export function emit(
  el: HTMLElement,
  name: string,
  detail?: Record<string, unknown>
) {
  const event = new CustomEvent(name, {
    bubbles: true,
    cancelable: false,
    composed: true,
    detail,
  });
  el.dispatchEvent(event);
  return event;
}
