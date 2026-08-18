# CLAUDE.md

Working notes for agents on `@uscreentv/video-player`. Read
[`docs/`](./docs/README.md) first for how the player is designed — this file is
the operational layer on top of it.

## Commands

```sh
pnpm dev            # vite dev server on index.html (a real player with a live stream)
pnpm build          # clean + dist/ + lib/ + types/
pnpm test           # web-test-runner, playwright chromium
pnpm manifest       # regenerate custom-elements.json
pnpm generate       # hygen: scaffold src/components/<name>/
```

`pnpm test` loads `./dist/index.js`, so **run `pnpm build` before `pnpm test`**
or you will be testing the previous build. `pnpm build && pnpm test` is the
check to run before proposing a PR.

**Do not use `pnpm verify`.** It is `prettier:check && lint && build && test`,
but neither `prettier:check` nor `lint` exists in `package.json` (there is no
eslint in the project at all), so it fails on the first step and never reaches
the build or the tests. Formatting is still enforced on commit by lint-staged.

Node `^22`, pnpm `^8`. Commits are linted by commitlint (conventional commits)
and releases are automated by semantic-release from `main`, so the commit
subject decides the version bump.

## Layout

```
src/
  state/          the whole state + command machinery (start here)
    index.ts        initialState, context, connect(), listen(), createState()
    controller.ts   StateController — provider, reducer, command dispatcher
    commander.ts    @listen plumbing, createCommand
    connector.ts    @connect plumbing
    dispatcher.ts   dispatch()
    mapper.ts       the reducer table
    events.ts       CommandEvent / CommandRegisterEvent
  types.ts        Command, Action, Event, State, DRM types — the contracts
  components/
    video-player/     owns state + fullscreen/idle/keyboard controllers
    video-container/  owns the <video> element and nearly every command handler
      subtitles.ts    text track controller
      audios/         audio track controller (hls + native implementations)
      sources.ts      <source> selection, lazy-src handling
    buttons/          one file per button, all extend VideoButton
    <other elements>/ Name.component.ts + Name.styles.css + Name.test.ts + index.ts
  helpers/        small, dependency-free utilities
  decorators/     @watch
  mixins/         DependentPropsMixin (the `when` attribute)
  variables.json  theme tokens → --video-player-* custom properties
```

## Conventions

- **Components** are `PascalCase.component.ts` + `PascalCase.styles.css` +
  `PascalCase.test.ts` + `index.ts` re-export, one directory per element. Use
  `pnpm generate` to scaffold. Only `*.component.ts` files are picked up by the
  custom-elements analyzer and by `src/index.ts`'s glob — buttons are loaded by
  a second glob and are *not* in the manifest.
- **Styles** are imported with `?inline` and wrapped in `unsafeCSS`. PostCSS
  gives you nesting plus `$token` variables from `src/variables.json`, each
  compiled to `var(--video-player-<token>, <default>)`. Never hard-code a colour
  that already has a token.
- **New behaviour is a command handler**, not a method call from a sibling. Add
  `@listen(Command.x, deps)` to whichever element can satisfy it, and let the
  dependency object express readiness instead of writing timers or polling.
- **State changes are reported, never requested.** `dispatch(this, Action.y, …)`
  belongs next to the browser event that proves the change happened. If you find
  yourself dispatching an action to make something happen, you want a command.
- **A new state field** goes in `State` in `src/types.ts`; it only needs a
  `stateMapper` entry if a plain merge is wrong.
- **Reading state in a component** is `@connect("field")`. Stack it under
  `@property({ reflect: true })` when CSS needs it as an attribute.
- **Icons** are SVG files in `src/icons/`, imported `?raw` and rendered with
  `unsafeSVG`, always wrapped in a named slot so integrators can replace them.
- Prettier is enforced via lint-staged on `src/**/*.ts`.

## Traps

All live in the code today; none are fixed.

- **`dispatch()` returns a Promise that never settles.** The `resolve`/`reject`
  pair rides in the event detail and is never called. `await` hangs.
- **Outside Safari the player always uses hls.js**, whatever the source type —
  `INIT_NATIVE_HLS_RE` in `Video-container.component.ts` gates the native path
  on the user agent, not on `canPlayType()`.
- **`canPlay` gates `play`, `seek` and `setPlaybackRate`, but only on iOS.**
  `initialState` sets `canPlay: !device.isIos`, so everywhere else it is already
  `true` before a source is inspected and those three commands are never held —
  the `Action.canPlay` dispatched from `LEVEL_LOADED` (hls.js) or
  `loadedmetadata` (native) is re-asserting a value that was true all along.
  Only iOS actually exercises the gate, and `<video-errors-manager>` reopens it
  by clearing `canPlay` on a network error. Still do not move the dispatch
  earlier: on the hls.js path it is `LEVEL_LOADED`, not `MANIFEST_PARSED`,
  because earlier means releasing iOS's pending commands before there are
  segments to act on.
- **`Action.init` must be dispatched before `Command.init`** — the `init`
  handlers are gated on `isSourceSupported`, which only that action sets.
- **Every `@listen` registration is delivered twice, and only controller order
  saves it.** `EventListener.hostConnected` does
  `_host.state?.registerCommand?.(event) || _host.dispatchEvent(event)` —
  `registerCommand` returns `undefined`, so the event is *always* dispatched as
  well. It goes unnoticed because `@listen` registers through
  `ReactiveElement.addInitializer`, which runs inside the `ReactiveElement`
  constructor (before any subclass field initialiser), so the `EventListener`
  controllers are always added before the `StateController` that
  `state = createState(this)` creates. Their `hostConnected` therefore runs
  first, while nothing is listening for `video-register-command` yet, and the
  duplicate event is dropped. Anything that gets a `StateController` connected
  ahead of the `@listen` controllers — a mixin, a base class, a hand-rolled
  `addController` call — makes every player-level command register twice.
  Reordering the fields in `Video-player.component.ts` is *not* one of those
  things — initializers always run before field initialisers, whatever the
  order on the page — so if commands do start registering twice, look at
  controller registration order and at that `||`, not at the field list.
- **A command listener that never fires is never unregistered.**
  `EventListener` stores its `unsubscribe` inside the handler invocation, so
  `hostDisconnected` has nothing to call unless the command ran at least once.
- **`StateController.hostDisconnected` never removes the `video-command`
  listener** it added.
- **`Keyboard.ts` `hostDisconnected` calls `addEventListener`** instead of
  removing. Separately, `handleKeydown` is passed unbound, so `this` is the
  player element — the `{ keyboard: true, once: true }` meta never reaches the
  bus and keyboard commands can pend like any other.
- **`DependentPropsMixin.updated()` uses `return` where it means `continue`** —
  if the first changed property is not a declared dependency, the rest are
  skipped for that update.
- **Two classes are both named `SubtitlesButton`** — `buttons/Settings.ts`
  (registers `video-settings-button`) and `buttons/Subtitles.ts` (registers
  `video-subtitles-button`). The custom-elements analyzer resolves tag names by
  class name, so adding buttons to the manifest globs mislabels one. Rename
  first.
- **`<video-cues>` renders cue text with `unsafeStatic`** — VTT HTML is injected
  unescaped, and each distinct cue creates a cached static template.
- **`<video-menu>` declares `--item-*` on `:host` but its `.item` rule reads
  `--menu-item-*`.** Both schemes are live; `--item-*` only drives padding and
  width.
- **`video-bulk-state-update` (`Event.bulk`) is declared but never used.** Dead.
- `custom-elements.json` is git-ignored, regenerated on `postinstall`, and
  covers `src/**/*.component.ts` only — the buttons are not in it.

## Debugging

```js
localStorage.debug = "player:*";
```

Namespaces: `player:commands` (fired / handled / resolved / rejected),
`player:state` (every action with its params), `player:subtitles`,
`player:audios`. A command that appears as "fired" but never "handled" is
pending on an unmet dependency — check the `@listen` gate.

`index.html` is a working page with a live HLS stream and the full control set;
`pnpm dev` is usually faster than writing a test to reproduce something.

## Docs

Prose docs live in `docs/` — [README](./docs/README.md) (overview and element
tree), [state-and-commands](./docs/state-and-commands.md),
[lifecycle](./docs/lifecycle.md), [customization](./docs/customization.md).
They are deliberately high level; implementation detail belongs here or in the
code. When you change the state model, the command lifecycle, the startup path
or the customization surface, update the matching page in the same change.
