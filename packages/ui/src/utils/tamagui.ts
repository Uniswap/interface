export function assertWebElement(element: unknown): asserts element is HTMLDivElement {
  if (!(element instanceof HTMLDivElement)) {
    throw new Error('Element is not an HTMLDivElement')
  }
}
