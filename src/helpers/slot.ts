export const isDeepAssigned = (element: HTMLSlotElement): boolean => {
  const [children] = element.assignedNodes()
  if (!children) return false
  if (children instanceof HTMLSlotElement) return isDeepAssigned(children)
  return true
}
