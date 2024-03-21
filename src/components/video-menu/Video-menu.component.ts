import { unsafeCSS, LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { when } from "lit/directives/when.js";
import styles from "./Video-menu.styles.css?inline";
import { eventCode, emit } from "../../helpers/event";

type MenuItem = {
  // The value associated with the menu item
  value: string | number;
  // The text label of the menu item
  label: string;
  // Indicates whether the menu item is currently active
  isActive?: boolean;
  // Icon to display before the label
  iconBefore?: any;
  // Icon to display after the label
  iconAfter?: any;
  // Keyboard shortcut for the menu item
  key?: string;
};

@customElement("video-menu")
export class VideoMenu extends LitElement {
  static styles = unsafeCSS(styles);

  /**
   * An array of menu items to display.
   */
  @property({ type: Array })
  items: MenuItem[] = [];

  /**
   * The title of the menu.
   */
  @property()
  title: string;

  handleClick(e: any) {
    e.stopPropagation();
    emit(this, "menu-item-click", { value: e.currentTarget.dataset.value });
  }

  handleKeyDown(e: KeyboardEvent) {
    if (eventCode(e, "space", "enter")) {
      e.stopPropagation();
      Promise.resolve(() => this.handleClick(e));
    }
  }

  render() {
    return html`
      ${when(
        this.title,
        () => html`
          <p class="title">
            <slot name="title"> ${this.title} </slot>
          </p>
        `,
      )}
      <ul class="menu">
        ${this.items.map(
          (item) => html`
            <li>
              <button
                tabindex="0"
                class="item"
                area-pressed=${item.isActive}
                data-value=${item.value}
                @click=${this.handleClick}
                @keydown=${this.handleKeyDown}
              >
                ${item.iconBefore}
                <span class="text">
                  <slot name="label:${item.value}"> ${item.label} </slot>
                </span>
                ${item.iconAfter}
              </button>
            </li>
          `,
        )}
      </ul>
    `;
  }
}
