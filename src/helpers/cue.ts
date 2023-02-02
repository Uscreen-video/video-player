export const getCueText = (element: Node) => {
  const wrapper = document.createElement('div')
  wrapper.appendChild(element)
  return wrapper.innerHTML.split(/\n/gm)
}
