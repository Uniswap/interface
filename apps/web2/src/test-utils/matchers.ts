// This type is not exported from Jest, so we need to infer it from the expect.extend function.
type MatcherFunction = Parameters<typeof expect.extend>[0] extends { [key: string]: infer I } ? I : never

const isElementVisible = (element: HTMLElement): boolean => {
  return element.style.height !== '0px' && (!element.parentElement || isElementVisible(element.parentElement))
}

// Overrides the Testing Library matcher to check for height when determining whether an element is visible.
// We are doing this because:
// - original `toBeVisible()` does not take `height` into account
// https://github.com/testing-library/jest-dom/issues/450
// - original `toBeVisible()` and `toHaveStyle()` does not work at all in some cases
// https://github.com/testing-library/jest-dom/issues/209
// - `getComputedStyles()` returns empty object, making it impossible to check for Styled Components styles
// https://github.com/styled-components/styled-components/issues/3262
// https://github.com/jsdom/jsdom/issues/2986
// For the reasons above, this matcher only works for inline styles.
export const toBeVisible: MatcherFunction = function (element: HTMLElement) {
  const isVisible = isElementVisible(element)
  return {
    pass: isVisible,
    message: () => {
      const is = isVisible ? 'is' : 'is not'
      return [
        this.utils.matcherHint(`${this.isNot ? '.not' : ''}.toBeVisible`, 'element', ''),
        '',
        `Received element ${is} visible:`,
        `  ${this.utils.printReceived(element.cloneNode(false))}`,
      ].join('\n')
    },
  }
}
