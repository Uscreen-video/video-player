# Architecture

The player is a set of Lit web components that share one state object and one
message bus. There is no store library and no central controller.

- [State and commands](./state-and-commands.md) — how the pieces talk
- [Lifecycle](./lifecycle.md) — from markup to playing video
- [Customization](./customization.md) — the integrator-facing surface

## The three ideas

**One state object, provided through context.** `<video-player>` creates it and
provides it under `"video-state"`. Every other element consumes the slice it
needs. Nothing walks the DOM looking for siblings.

**Commands are requests, actions are facts.** A button never touches the
`<video>` element — it fires a *command*. Whichever element can satisfy that
command handles it, and once the browser confirms what happened an *action*
updates state. Commands travel outward as DOM events; state comes back through
context.

**Handlers are gated on state.** A command handler declares the state it needs.
If the state does not match yet, the command is held and retried automatically
when state changes. This is what lets the player cope with the very different
timing of Safari, hls.js and Chromecast without polling or timers.

The practical consequence: to add behaviour you add a command handler, not a
call site. To add UI you add a component that consumes a state field. The two
never need to know about each other.

## Element tree

```html
<video-player storage-key="uscreen:player">
  <video slot="video"><source src="…m3u8" type="application/x-mpegURL" /></video>
  <video-controls>
    <video-timeline><video-timer></video-timer></video-timeline>
    <video-play-button></video-play-button>
    <video-fullscreen-button></video-fullscreen-button>
  </video-controls>
  <video-cues></video-cues>
</video-player>
```

`<video-player>` wraps the `video`, `chromecast` and `errors` slots in a
`<video-container>`, and puts everything else in a default slot — so controls
are siblings of the container, not children.

| Element | Role |
| --- | --- |
| `<video-player>` | Owns state, the command bus, and the fullscreen / idle / keyboard controllers. The only element that must exist. |
| `<video-container>` | Owns the media element. Nearly every playback command handler lives here, and native `<video>` events become actions here. |
| `<video-controls>` | Layout and idle-hiding for the control bar. Optional. |
| Buttons | All extend `<video-button>`. Each reads a state field and fires one command — no other logic. |
| `<video-chromecast>` | Mirrors playback commands onto a cast session while casting. |
| `<video-errors-manager>` | The only consumer of the `error` command. Mounted by default. |
| `<video-cues>`, `<video-timeline>`, `<video-timer>`, `<video-slider>`, `<video-menu>`, `<video-condition>`, `<video-live-sign>`, `<video-progress>`, `<video-volume-control>` | Presentational; each consumes state and, where interactive, fires commands. |

## Where things live

```
src/
  state/        state, actions, commands, the @connect / @listen decorators
  types.ts      Command, Action, Event and State — the contracts
  components/   one directory per element
  helpers/      small utilities (device, storage, drm, mux, time, cues)
  decorators/   @watch
  mixins/       DependentPropsMixin — the `when` attribute
  variables.json  theme tokens
```

Per-element attributes are documented in the component sources and in the
generated `custom-elements.json`.
