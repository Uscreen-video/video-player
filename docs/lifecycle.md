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

## Autoplay

A page asks for autoplay the usual way, with the attribute on the `<video>`.
Startup reads it into `isAutoplay`, **removes it**, and starts playback itself
on the first `canplay`.

The attribute cannot stay. `cloneNode` copies attributes but not playback
state, so a copy of the page that carries `autoplay` starts the stream by
itself, from the beginning, and WebKit plays such a copy even though it is in
no document — with sound nothing on the page can reach. Turbo takes a copy on
every visit and on every frame render, and asks no one first. Without the
attribute the copy stays paused at `readyState` 0.

The player keeps the rest of the browser's behaviour: the first pause gives up
on autoplay, as the browser's own autoplaying flag does, and a refusal — an
unmuted autoplay the viewer never allowed — is left where the attribute would
have left it.

Keep `preload` off `auto` for the same reason: a copy with `preload="auto"`
loads the whole stream and stays in `NETWORK_LOADING` for as long as the
snapshot lives. `metadata` fetches once and goes idle.

## Readiness

`canPlay` is the gate for `play`, `seek` and `setPlaybackRate`. It is set when
the engine can actually act on those requests, not when it merely knows the
stream exists — for hls.js that means a variant playlist has been parsed and
segment URLs exist, and for the native engine it means metadata has loaded.

The gate only ever closes on iOS: everywhere else `canPlay` starts out `true`,
because only iOS refuses to act on a `<video>` element that has not loaded yet.
So the three commands are held on iOS and pass straight through elsewhere, and
setting the flag late costs nothing on the platforms that do not need it.

Setting it *earlier* would release every held command before there is anything
to play or seek within, which is what makes this the most delicate ordering in
the player. The flag is not write-once, either — an error can reopen the gate
and park those commands again (see [Errors](#errors)).

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

A key-system failure is classified before it is shown, on both engines: no
usable key system, a refused license (with the HTTP status), a license request
that never reached a server, a failed FairPlay certificate, or unknown. Each
gets its own persistent message, never keyed on the browser version. A key
system that fails leaves nothing to play, so the player is paused with the
message — unless a cast session is running, where the receiver holds its own
license and a local key failure says nothing about what the viewer sees. Every
error also leaves the player as a `playback-error` DOM event on
`<video-player>`, so the page can record what the viewer saw.

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
