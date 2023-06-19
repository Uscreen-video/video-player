export const isMobile = () => {
  return window.matchMedia(`(max-width: 640px)`).matches
}