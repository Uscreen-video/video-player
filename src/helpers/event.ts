export const eventCode = (e: KeyboardEvent, ...codes: string[]) => {
  const code = e.code.toLowerCase()
  return codes.some(c => c.toLowerCase() === code)
}
