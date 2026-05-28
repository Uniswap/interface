import { getChromeWithThrow } from '@universe/environment'

export const restart = (): void => {
  const chrome = getChromeWithThrow()
  chrome.runtime.reload()
}
