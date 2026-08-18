# Lifecycle

From markup to playing video, and what happens around it.

## Startup

```
<video> assigned to the container's slot
        │
        ▼
  read saved preferences  ──►  applied to the <video> element
        │
  inspect <source> elements ──►  pick one, decide which engine to use
        │
  init action   ── describes the media to the rest of the player
        │
  init command  ── asks whoever can start playback to start it
        │
        ├── native engine   (Safari)
        └── hls.js engine   (everything else)
```

Two things about this order are load-bearing:

- **Startup is triggered by the `<video>` being slotted**, not by the player
  connecting. Nothing can be inspected before the media element is actually
  there.
- **The init action must land before the init command.** The engine handlers are
  gated on state that only that action sets, so reversing the two leaves both
  handlers waiting forever.

If the chosen `<source>` carries only a `data-src`, startup describes the media
in state and stops without loading anything. Firing the init command yourself is
what starts the download — this is the lazy-loading path.

## Readiness

`canPlay` is the gate for `play`, `seek` and `setPlaybackRate`. It is set when
the engine can actually act on those requests, not when it merely knows the
stream exists — for hls.js that means a variant playlist has been parsed and
segment URLs exist, and for the native engine it means metadata has loaded.

Setting it earlier would release every held command before there is anything to
play or seek within. It is the single most delicate ordering in the player.

## Engines

The player picks between two engines at startup, on the browser rather than on
the source type: **Safari uses the browser's own HLS support, everything else
uses hls.js.** The native branch is effectively "Apple", the hls.js branch is
"everything else".

- The **native** engine hands the source to the `<video>` element and lets it
  play. Everything the player knows afterwards comes from native media events.
- The **hls.js** engine is imported dynamically, so it never ships to Safari
  users. It is also reachable at runtime: if native playback fails with a source
  error, the player falls back to hls.js against the same element.

Both engines converge on the same state, so nothing above `<video-container>`
knows which one is running.

## Tracks, quality, DRM, analytics

- **Subtitles.** A track is identified by its label and language together, not
  by language alone, because one stream can carry several tracks in the same
  language. The player suppresses the browser's own subtitle rendering and
  pushes cue text into state instead, which is what makes cues styleable. Track
  order puts the viewer's browser language first, then sorts by label.
- **Audio tracks** follow the same identity scheme, with one implementation per
  engine behind a common interface.
- **Quality** selection is hls.js only; the native engine offers no equivalent.
  Levels are published to state once the manifest is parsed, and `-1` means
  automatic.
- **DRM** is configured once on `<video-player>`, keyed by key system. FairPlay
  on the native path is handled directly; the hls.js path translates the same
  configuration into its own DRM options, and the cast session receives the
  Widevine license URL.
- **Analytics** (Mux) is loaded lazily and attached to the media element; on the
  hls.js path the engine instance is handed over too, so rendition data is
  reported.

## Errors

An error is delivered as a **command**, not an action, because the response is
behaviour rather than a fact to record. `<video-errors-manager>` handles it: on
a network error it clears `canPlay` — which parks every gated command — retries
the source a few times with a visible message, and then either resumes playback
or asks the viewer to reload.

## Persistence

Set `storage-key` on `<video-player>` and volume, mute, playback rate, quality,
subtitle track and audio track are remembered in `localStorage`. Without the
attribute nothing is written.

Restoring is deliberately split across startup: volume and mute go straight onto
the `<video>` element before any state exists, track preferences are handed to
the track controllers as they are built, and quality has to wait until the
engine has published the level list.

## Player-level controllers

`<video-player>` owns three controllers that do not fit any single component:

- **Fullscreen** — normalises the vendor-prefixed APIs and can target an element
  other than the player. iOS is special-cased, because there only the `<video>`
  element itself can go fullscreen.
- **Idle** — a timer reset by pointer activity, exposed both as an attribute
  (for CSS) and as state (for components). Suppressed while paused.
- **Keyboard** — binds Space, `M`, the arrow keys and Enter to commands, which
  is why the player is focusable.
