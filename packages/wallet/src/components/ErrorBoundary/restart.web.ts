import { getChromeWithThrow } from 'utilities/src/chrome/chrome'

export const restart = (): void => {
  const chrome = getChromeWithThrow()
  chrome.runtime.reload()
}
