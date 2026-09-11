# Customization

Four layers, in increasing order of intrusiveness. Most integrations need only
the first two.

## 1. Composition

Every control is an independent element, and the arrangement in light DOM *is*
the layout. Omit what you do not want, wrap what you do, put controls wherever
they belong. Nothing requires `<video-controls>` — it is a convenience wrapper
that handles positioning and hiding while idle.

The player also has structural slots: `video` (required), `chromecast`, and
`errors`, which is filled with `<video-errors-manager>` unless you supply your
own. When a video is DRM-protected, set `drm-help-url` on `<video-player>` and
the "no key system" error links the viewer to that page.

## 2. Slots

Buttons expose **state-dependent slot names**, which is the intended way to
replace icons and labels without subclassing:

```html
<video-play-button>
  <svg slot="icon:play">…</svg>
  <span slot="tooltip:play">Reproducir</span>
</video-play-button>
```

| Element | Slots |
| --- | --- |
| Play | `icon:play`, `icon:pause`, `tooltip:play`, `tooltip:pause` |
| Volume | `icon:muted`, `icon:min`, `icon:mid`, `icon:max`, `tooltip:mute`, `tooltip:unmute` |
| Fullscreen, PiP, Chromecast, Airplay, Subtitles | `icon:enabled`, `icon:disabled`, and the matching `tooltip:*` |
| Settings, Subtitles | `menu` replaces the whole dropdown |
| `<video-menu>` | `title`, and `label:<value>` per item |
| `<video-slider>`, `<video-timeline>` | `tooltip` |

Menu labels can also be swapped without touching slots: the subtitles and
settings buttons each take a `translation` object, and the settings button's
`settings` attribute chooses which submenus exist at all.

## 3. Styling

**Shadow parts** — `button`, `tooltip` and `menu` on `<video-button>`; `slider`
and `tooltip` on `<video-slider>`; `progress-container` on `<video-timeline>`;
`sign` on `<video-live-sign>`.

**CSS custom properties** come in two families:

- **Theme tokens**, `--video-player-<name>`, listed in `src/variables.json` —
  fonts, tooltip colours, button colour and size, menu item colours, timer,
  live sign, cue size. Setting one on any ancestor rethemes every component that
  uses it.
- **Local knobs** declared on each component's `:host` — aspect ratio on the
  container, progress and buffer colours on the timeline, track and thumb
  styling on the slider, and so on. Each component's `.styles.css` is the list.

`--primary` is the shared accent hook: the slider fill, timeline progress and
menu hover all fall back through it, so setting it once is usually enough.

## 4. Reacting to state from markup

Two mechanisms let a page author branch on player state without writing
JavaScript.

**`<video-condition>`** renders one of two slots based on a query evaluated
against state, and reflects a `matching` attribute for CSS:

```html
<video-condition query="isPlaying == true && volume >= 0.5">
  <span slot="true">Loud and playing</span>
  <span slot="false">Not so much</span>
</video-condition>
```

Comparators are `>`, `>=`, `<`, `<=`, `==` and `!=`, combined with `&&` or `||`
and evaluated left to right — there is no operator precedence, so keep queries
simple.

**`when`** links one property of an element to others, so an element can
restyle its own behaviour as state changes:

```html
<video-timeline when="fullscreen=true->full-width=true"></video-timeline>
```

Rules are separated by `;`, the dependency and its linked properties by `->`.
When the dependency stops matching, the linked properties return to the values
they had when the element connected. Supported on `<video-controls>` and
`<video-timeline>`.

## Beyond this

If you need behaviour rather than appearance, add a component that listens for a
command — see [state and commands](./state-and-commands.md). Reaching into the
player's internals from outside is not supported; the command bus and the state
context are the intended entry points.
