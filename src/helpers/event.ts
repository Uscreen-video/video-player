export const eventCode = (e: KeyboardEvent, ...codes: string[]) => {
  const code = e.code.toLowerCase();
  return codes.some((c) => c.toLowerCase() === code);
};

export function emit(
  el: HTMLElement,
  name: string,
  detail?: Record<string, unknown>,
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
