const DEFAULT_WINDOW_WIDTH = 2000
export const REQUESTS_WINDOW_URL = 'requestsWindow.html'
type WindowParams = {
  type: chrome.windows.createTypeEnum
  width: number
  height: number
  top: number
  left: number
}

const APPROVAL_WINDOW_PARAMS: WindowParams = {
  type: 'popup',
  width: 375,
  height: 550,
  top: 150,
  left: 1800,
}

export async function openRequestsWindow(
  windowParams: WindowParams = APPROVAL_WINDOW_PARAMS
) {
  // We need current window width to calculate the left position of the new window
  const currentWindowWidth = await chrome.windows
    .getCurrent()
    .then((window) => window.width ?? DEFAULT_WINDOW_WIDTH)

  chrome.windows.create({
    ...windowParams,
    left: currentWindowWidth - 425,
    url: REQUESTS_WINDOW_URL,
  })
}

/**
 * Loop through all open windows and see if there is a window whose first tab has the id of the requests window,
 * so we don't open too duplicate windows
 */
export function openRequestsWindowIfNeeded() {
  chrome.windows.getAll((windows) => {
    const requestsWindow = windows.find((window) => {
      if (window.tabs && window.tabs.length > 0) {
        return window.tabs[0]?.url?.includes(REQUESTS_WINDOW_URL)
      }
    })
    if (requestsWindow) return
    openRequestsWindow()
  })
}
