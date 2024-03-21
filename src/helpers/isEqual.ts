export const isEqual = (a: any, b: any) => {
  if (typeof a !== typeof b) return false;
  if (typeof a === "object") return Object.is(a, b);
  return a === b;
};
