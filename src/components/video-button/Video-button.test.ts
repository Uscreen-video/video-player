import { html, fixture, expect } from "@open-wc/testing";
import type { Button } from "./Video-button.component";
import "./Button.component";

describe("<ds-button>", () => {
  it("with default parameters", async () => {
    const el: Button = await fixture(html`<ds-button></ds-button>`);
    expect(el.disabled).equal(undefined);
  });
});
