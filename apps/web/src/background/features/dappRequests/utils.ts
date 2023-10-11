import { sendMessageToActiveTab } from 'src/background/utils/messageUtils'
import {
  ExtensionToContentScriptRequestType,
  InjectedAssetRemoveRequest,
  InjectFrameRequest,
} from 'src/types/requests'
import { logger } from 'utilities/src/logger/logger'

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
  height: 630,
  top: 150,
  left: 1800,
}

// save request window id to be able to identify it later
let requestWindowId: number | undefined

export async function openRequestsWindow(
  windowParams: WindowParams = APPROVAL_WINDOW_PARAMS
): Promise<void> {
  // We need current window width to calculate the left position of the new window
  const currentWindowWidth = await chrome.windows
    .getCurrent()
    .then((window) => window.width ?? DEFAULT_WINDOW_WIDTH)

  const { id } = await chrome.windows.create({
    ...windowParams,
    left: currentWindowWidth - 425,
    url: REQUESTS_WINDOW_URL,
  })

  requestWindowId = id
}

/** Opens extension in a docked window (injected in dapp) */
export function openDockedWindow(): void {
  const message: InjectFrameRequest = {
    type: ExtensionToContentScriptRequestType.InjectAsset,
    assetType: 'frame',
    filename: 'index.html',
  }
  sendMessageToActiveTab(message)
}

/** Closes docked window in dapp if injected. */
export function closeDockedWindow(): void {
  const message: InjectedAssetRemoveRequest = {
    type: ExtensionToContentScriptRequestType.InjectedAssetRemove,
    assetType: 'frame',
    filename: 'index.html',
  }
  sendMessageToActiveTab(message)
}

/**
 * Loop through all open windows and see if there is a window whose first tab has the id of the requests window,
 * so we don't open too duplicate windows
 */
export async function maybeOpenRequestsWindow(
  // tab sending the request
  tabId: number,
  // for dapps
  dockInclusionList: string[] = []
): Promise<void> {
  const dappUrl = extractBaseUrl((await chrome.tabs.get(tabId)).url ?? '')
  const useDock = dappUrl && dockInclusionList.includes(dappUrl)

  if (useDock) {
    return openDockedWindow()
  }

  const windows = await chrome.windows.getAll()
  const requestsWindowFound = windows.find((window) => window.id === requestWindowId)

  if (requestsWindowFound) {
    logger.warn(
      'dappRequests/utils',
      'maybeOpenRequestsWindow',
      'Requests window already opened. Skipping.'
    )
    return
  }

  await openRequestsWindow()
}

export function extractBaseUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const parsedUrl = new URL(url)
    return `${parsedUrl.protocol}//${parsedUrl.hostname}${
      parsedUrl.port ? ':' + parsedUrl.port : ''
    }`
  } catch (error) {
    logger.error(error, {
      tags: { file: 'dappRequests/utils', function: 'extractBaseUrl' },
      extra: { url },
    })
  }
}
