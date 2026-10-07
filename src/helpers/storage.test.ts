import { expect } from "@open-wc/testing";
import { createProvider } from "./storage";

const KEY = "test:storage";

describe("storage provider", () => {
  const original = Object.getOwnPropertyDescriptor(window, "localStorage");

  const blockStorage = () =>
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("blocked", "SecurityError");
      },
    });

  afterEach(() => {
    Object.defineProperty(window, "localStorage", original);
    window.localStorage.removeItem(KEY);
  });

  it("reads defaults when the browser blocks storage", () => {
    blockStorage();

    expect(createProvider(KEY).get()).to.deep.equal({});
  });

  it("ignores a write when the browser blocks storage", () => {
    blockStorage();

    expect(() => createProvider(KEY).set({ volume: 1 })).not.to.throw();
  });

  it("reads defaults when the stored value is not JSON", () => {
    window.localStorage.setItem(KEY, "{");

    expect(createProvider(KEY).get()).to.deep.equal({});
  });

  it("reads defaults when the stored value is not an object", () => {
    window.localStorage.setItem(KEY, "null");

    expect(createProvider(KEY).get()).to.deep.equal({});
  });

  it("reads back what it wrote", () => {
    const provider = createProvider(KEY);

    provider.set({ volume: 0.5, playbackRate: 2 });

    expect(provider.get()).to.deep.equal({ volume: 0.5, playbackRate: 2 });
  });
});
