import { html, fixture, expect } from "@open-wc/testing";
import { qualityBadge } from "../../helpers/quality";

// Ordered as hls.js reports them from the manifest — the menu must not re-sort
const LEVELS = [
  { name: "270", height: 270, badge: undefined },
  { name: "480", height: 480, badge: undefined },
  { name: "720", height: 720, badge: undefined },
  { name: "1080", height: 1080, badge: "HD" as const },
  { name: "1440", height: 1440, badge: "2K" as const },
  { name: "2160", height: 2160, badge: "4K" as const },
];

const settingsButton = async (props: Record<string, unknown> = {}) => {
  const el: any = await fixture(
    html`<video-settings-button settings="quality"></video-settings-button>`,
  );
  Object.assign(el, { qualityLevels: LEVELS, ...props });
  return el;
};

/** Renders a label and separates its text from its badge. */
const readLabel = async (label: unknown) => {
  const host: HTMLElement = await fixture(html`<div>${label}</div>`);
  const badge = host.querySelector("sup.badge");
  const withoutBadge = host.cloneNode(true) as HTMLElement;
  withoutBadge.querySelector("sup.badge")?.remove();
  return {
    label: withoutBadge.textContent.replace(/\s+/g, " ").trim(),
    badge: badge ? badge.textContent.trim() : null,
  };
};

/** Renders menu items and reads back the label and badge of each row. */
const readItems = async (items: unknown[]) => {
  const menu: any = await fixture(
    html`<video-menu .items=${items}></video-menu>`,
  );
  return Array.from(
    menu.shadowRoot.querySelectorAll(".item") as NodeListOf<HTMLElement>,
  ).map((button) => {
    const text = button.querySelector(".text");
    const badge = text.querySelector("sup.badge");
    const withoutBadge = text.cloneNode(true) as HTMLElement;
    withoutBadge.querySelector("sup.badge")?.remove();
    return {
      label: withoutBadge.textContent.replace(/\s+/g, " ").trim(),
      badge: badge ? badge.textContent.trim() : null,
    };
  });
};

describe("video-settings-button quality menu", () => {
  it("labels renditions by height and keeps the manifest order", async () => {
    const el = await settingsButton({ qualityLevel: -1 });
    const items = await readItems(el.qualityMenuItems);

    expect(items.slice(1).map((i) => i.label)).to.deep.equal([
      "270p",
      "480p",
      "720p",
      "1080p",
      "1440p",
      "2160p",
    ]);
  });

  it("badges only the higher tiers", async () => {
    const el = await settingsButton({ qualityLevel: -1 });
    const items = await readItems(el.qualityMenuItems);

    expect(items.slice(1).map((i) => i.badge)).to.deep.equal([
      null,
      null,
      null,
      "HD",
      "2K",
      "4K",
    ]);
  });

  it("reads plain Auto until a rendition is playing", async () => {
    const el = await settingsButton({ qualityLevel: -1 });
    const [auto] = await readItems(el.qualityMenuItems);

    expect(auto.label).to.equal("Auto");
  });

  // Every row in the selection list is a choice, so a resolution appended to
  // "Auto" would read as choosing that resolution. It belongs on the parent
  // row, which reports rather than offers.
  it("keeps Auto bare in the selection list while a rendition plays", async () => {
    const el = await settingsButton({
      qualityLevel: -1,
      currentQualityLevel: 1080,
    });
    const [auto] = await readItems(el.qualityMenuItems);

    expect(auto.label).to.equal("Auto");
    expect(auto.badge).to.equal(null);
  });

  it("translates Auto when a translation is provided", async () => {
    const el = await settingsButton({
      qualityLevel: -1,
      currentQualityLevel: 2160,
      translation: { auto: "Авто" },
    });
    const [auto] = await readItems(el.qualityMenuItems);

    expect(auto.label).to.equal("Авто");
    expect(await readLabel(el.qualitySummary)).to.deep.equal({
      label: "Авто (2160p)",
      badge: "4K",
    });
  });

  // Regression: ABR switches used to overwrite the user's selection, moving the
  // checkmark off "Auto" onto whatever level happened to be playing
  it("keeps Auto selected while the playing rendition changes", async () => {
    const el = await settingsButton({
      qualityLevel: -1,
      currentQualityLevel: 720,
    });

    expect(el.qualityMenuItems[0].isActive).to.equal(true);
    expect(el.qualityMenuItems.filter((i: any) => i.isActive)).to.have.lengthOf(
      1,
    );

    el.currentQualityLevel = 2160;

    expect(el.qualityMenuItems[0].isActive).to.equal(true);
    expect(el.qualityMenuItems.filter((i: any) => i.isActive)).to.have.lengthOf(
      1,
    );
  });

  it("marks the explicitly selected rendition instead of Auto", async () => {
    const el = await settingsButton({
      qualityLevel: 1440,
      currentQualityLevel: 1440,
    });
    const active = el.qualityMenuItems.filter((i: any) => i.isActive);

    expect(active).to.have.lengthOf(1);
    expect(active[0].value).to.equal("1440");
  });

  it("summarises the selected quality for the parent menu", async () => {
    const el = await settingsButton({
      qualityLevel: 2160,
      currentQualityLevel: 2160,
    });

    expect(await readLabel(el.qualitySummary)).to.deep.equal({
      label: "2160p",
      badge: "4K",
    });
  });

  it("summarises automatic selection for the parent menu", async () => {
    const el = await settingsButton({
      qualityLevel: -1,
      currentQualityLevel: 720,
    });

    expect(await readLabel(el.qualitySummary)).to.deep.equal({
      label: "Auto (720p)",
      badge: null,
    });
  });
});

describe("qualityBadge", () => {
  it("tiers by the shorter edge so portrait renditions are correct", () => {
    // 1080p portrait is 1080x2340 — keying off height alone would say 2K
    expect(qualityBadge(1080, 2340)).to.equal("HD");
    expect(qualityBadge(2160, 3840)).to.equal("4K");
  });

  it("maps landscape renditions to their tier", () => {
    expect(qualityBadge(854, 480)).to.equal(undefined);
    expect(qualityBadge(1280, 720)).to.equal(undefined);
    expect(qualityBadge(1920, 1080)).to.equal("HD");
    expect(qualityBadge(2560, 1440)).to.equal("2K");
    expect(qualityBadge(3840, 2160)).to.equal("4K");
  });

  it("has no badge when the resolution is unknown", () => {
    expect(qualityBadge(undefined, undefined)).to.equal(undefined);
  });
});
