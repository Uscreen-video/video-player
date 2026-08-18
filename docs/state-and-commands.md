# State and commands

Two channels, in opposite directions. Commands flow out from the UI as DOM
events; state flows back in through context.

```
  <video-play-button>  ──command: togglePlay──►  <video-player>
                                                   (command bus + state)
  <video-play-button>  ◄──state: isPlaying────      │
                                                    │
                       ◄──command──────────────  <video-container>
                       ──action: play─────────►    (owns the <video>)
```

## State

One flat object, defined as `State` in `src/types.ts` — source, playback, audio,
tracks, UI, remote-playback and device flags. That type is the contract; this
document does not copy it.

`<video-player>` provides it through `@lit/context`, so it reaches the whole
subtree — light DOM and shadow DOM alike. Components read it with `@connect`:

```ts
@connect("isPlaying")
isPlaying: boolean;
```

Stack `@connect` under `@property` to also reflect the value as an attribute,
which is how components expose state to CSS:

```ts
@connect("idle")
@property({ type: Boolean, reflect: true })
idle: boolean;          // → <video-controls idle> → :host([idle]) { opacity: 0 }
```

## Actions

An action records something that has already happened. `dispatch(host, action,
params)` sends it to the player, which reduces it into new state.

Most actions are a shallow merge into state; the name exists for readability and
debug output. A handful mean more than a merge — `init` re-seeds defaults,
`play` also marks the video as played and playable, `pause` leaves live mode,
the `toggle*` ones flip a flag.

Actions are dispatched from two kinds of place only: the native media event
handler in `<video-container>`, and controllers reporting browser facts
(fullscreen change, cast connection, track lists). The rule worth preserving is
that **an action never asks for something to happen** — if you find yourself
dispatching one to cause an effect, you want a command.

`dispatch` is fire-and-forget; it does not report back when the state has
settled.

## Commands

A command is a request. Any element can fire one:

```ts
this.command = createCommand(this);
this.command(Command.togglePlay);
```

Handlers register themselves with `@listen`, optionally declaring the state they
require:

```ts
@listen(Command.play, { canPlay: true, castActivated: false })
async play() { … }
```

When a command arrives, every handler registered for it is checked against
current state:

- **dependencies match** → the handler runs;
- **dependencies do not match** → the command is held, and retried on every
  later state change until it matches.

Dependencies use strict equality, so `{ canPlay: true }` means exactly `true`.
A handler may return a Promise; a rejection puts the command back on hold.

This gating is doing real work:

- **Readiness without timers.** `play` requires `canPlay`. Press play before the
  stream is ready and nothing is lost — the command fires the moment it becomes
  ready, which is what makes iOS behave.
- **Routing by state.** `<video-container>` handles `play` / `pause` /
  `togglePlay` when not casting; `<video-chromecast>` handles the same commands
  when casting. Starting a cast session reroutes playback with no branch
  anywhere in the UI.
- **Waiting on the user.** Unmuting an autoplaying video is expressed as a
  dependency on the user having interacted with the page, not as a callback.

A command can carry meta: `once` (never hold it) and `keyboard` (origin).

## The public boundary

Stable, and safe to build against:

- **Element names, attributes and properties.**
- **The command bus** — `player.command(Command.play)` from script, or a command
  event from any descendant. `Command` in `src/types.ts` is the contract.
- **The state-update event** — the write channel for state. It is *input only*:
  the player stops its propagation, so it cannot be used to observe state from
  outside.
- **The `"video-state"` context** — the read channel. Inside the player use
  `@connect`; outside it read `playerElement.state.value`.
- **Outward DOM events** — `enter-fullscreen` and `exit-fullscreen` from
  `<video-player>`, plus the interaction events of `<video-slider>` and
  `<video-menu>`.

Internal and liable to change: the `Action` enum and its reducer, the command
bookkeeping inside the player, the track controllers, and everything in
`src/helpers`.
