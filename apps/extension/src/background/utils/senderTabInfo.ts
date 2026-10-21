import type { SenderTabInfo } from 'src/app/features/dappRequests/shared'
import { extractBaseUrl } from 'utilities/src/format/urls'

export type ValidMessageSender = chrome.runtime.MessageSender & {
  tab: chrome.tabs.Tab & { id: number; url: string }
  url: string
  frameId: number
}

export function isValidSender(sender?: chrome.runtime.MessageSender): sender is ValidMessageSender {
  return (
    sender?.tab?.id !== undefined &&
    sender.tab.url !== undefined &&
    sender.url !== undefined &&
    sender.frameId !== undefined
  )
}

/**
 * A cross-origin frame is keyed to its own origin, so it cannot inherit the top-level page's
 * connection, and it carries no favicon because the tab's icon belongs to the parent.
 */
export function getSenderTabInfo(sender: ValidMessageSender): SenderTabInfo {
  const frame = { tabId: sender.tab.id, frameId: sender.frameId, frameUrl: sender.url, tabUrl: sender.tab.url }

  return extractBaseUrl(sender.url) === extractBaseUrl(sender.tab.url)
    ? { ...frame, isCrossOriginFrame: false, favIconUrl: sender.tab.favIconUrl }
    : { ...frame, isCrossOriginFrame: true }
}
