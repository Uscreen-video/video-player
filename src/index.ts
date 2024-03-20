export * as types from "./types";
export const components = import.meta.glob("./components/**/*.component.ts", {
  eager: true,
});
export const buttons = import.meta.glob("./components/buttons/*.ts", {
  eager: true,
});
