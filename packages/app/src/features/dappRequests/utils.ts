const DEFAULT_WINDOW_WIDTH = 2000
type WindowParams = {
  type: chrome.windows.createTypeEnum
  width: number
  height: number
  top: number
  left: number
}

const APPROVAL_WINDOW_PARAMS: WindowParams = {
  type: 'popup',
  width: 250,
  height: 400,
  top: 100,
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
    left: currentWindowWidth - 200,
    url: 'approvalWindow.html',
  })
}
