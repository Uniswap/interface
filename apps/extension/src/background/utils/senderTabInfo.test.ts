import { getSenderTabInfo, isValidSender, type ValidMessageSender } from 'src/background/utils/senderTabInfo'

const TAB_URL = 'https://trusted.example/swap?x=1'
const FAVICON = 'https://trusted.example/favicon.ico'

function makeSender(overrides: Partial<ValidMessageSender> = {}): ValidMessageSender {
  return {
    tab: { id: 42, url: TAB_URL, favIconUrl: FAVICON } as ValidMessageSender['tab'],
    url: TAB_URL,
    frameId: 0,
    ...overrides,
  }
}

describe('isValidSender', () => {
  it('accepts a sender with tab id, tab url, frame url and frame id', () => {
    expect(isValidSender(makeSender())).toBe(true)
  })

  it.each([
    ['no sender', undefined],
    ['no tab', { url: TAB_URL, frameId: 0 }],
    ['no tab id', { tab: { url: TAB_URL } as chrome.tabs.Tab, url: TAB_URL, frameId: 0 }],
    ['no tab url', { tab: { id: 42 } as chrome.tabs.Tab, url: TAB_URL, frameId: 0 }],
    ['no frame url', { tab: { id: 42, url: TAB_URL } as chrome.tabs.Tab, frameId: 0 }],
    ['no frame id', { tab: { id: 42, url: TAB_URL } as chrome.tabs.Tab, url: TAB_URL }],
  ])('rejects a sender with %s', (_label, sender) => {
    expect(isValidSender(sender as chrome.runtime.MessageSender | undefined)).toBe(false)
  })
})

describe('getSenderTabInfo', () => {
  it('keys a top-level page to its own url and keeps the tab favicon', () => {
    expect(getSenderTabInfo(makeSender())).toEqual({
      tabId: 42,
      frameId: 0,
      frameUrl: TAB_URL,
      tabUrl: TAB_URL,
      isCrossOriginFrame: false,
      favIconUrl: FAVICON,
    })
  })

  it('treats a same-origin iframe as the same dapp', () => {
    const frameUrl = 'https://trusted.example/embedded/widget'

    expect(getSenderTabInfo(makeSender({ url: frameUrl, frameId: 3 }))).toEqual({
      tabId: 42,
      frameId: 3,
      frameUrl,
      tabUrl: TAB_URL,
      isCrossOriginFrame: false,
      favIconUrl: FAVICON,
    })
  })

  it('keys a cross-origin iframe to its own origin and drops the parent favicon', () => {
    const frameUrl = 'https://attacker.example/poc.html'

    expect(getSenderTabInfo(makeSender({ url: frameUrl, frameId: 7 }))).toEqual({
      tabId: 42,
      frameId: 7,
      frameUrl,
      tabUrl: TAB_URL,
      isCrossOriginFrame: true,
    })
  })

  it('treats a different port on the same host as cross-origin', () => {
    const frameUrl = 'https://trusted.example:8443/'

    expect(getSenderTabInfo(makeSender({ url: frameUrl, frameId: 1 })).isCrossOriginFrame).toBe(true)
  })
})
