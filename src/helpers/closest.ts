export function closestElement(
  selector: string,
  base = this,
  __Closest = (
    el: Element | Document | Window,
    found = el && (el as Element).closest(selector),
  ): any =>
    !el || el === document || el === window
      ? null // standard .closest() returns null for non-found selectors also
      : found
        ? found // found a selector INside this element
        : __Closest((el as any).getRootNode().host), // recursion!! break out to parent DOM
) {
  return __Closest(base);
}
