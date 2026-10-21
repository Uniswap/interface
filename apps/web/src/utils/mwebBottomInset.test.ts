import { applyMwebBottomInset } from '~/utils/mwebBottomInset'

const env = vi.hoisted(() => ({
  isMobileWeb: false,
  isSafari: false,
  isWebAndroid: false,
  isWebIOS: false,
}))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isMobileWeb() {
      return env.isMobileWeb
    },
    get isSafari() {
      return env.isSafari
    },
    get isWebAndroid() {
      return env.isWebAndroid
    },
    get isWebIOS() {
      return env.isWebIOS
    },
  }
})

// Literal on purpose: a changed allowance should fail here.
const CHROME_INSET = 'calc(env(safe-area-inset-bottom, 0px) + 144px)'

const IOS = { isMobileWeb: true, isSafari: false, isWebAndroid: false, isWebIOS: true }
const ANDROID = { isMobileWeb: true, isSafari: true, isWebAndroid: true, isWebIOS: false }

const CASES: ReadonlyArray<readonly [string, string, typeof env, string]> = [
  [
    'Trust Wallet on Android',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 Trust/Android',
    ANDROID,
    CHROME_INSET,
  ],
  [
    'MetaMask on Android',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 MetaMaskMobile',
    ANDROID,
    CHROME_INSET,
  ],
  [
    'Chrome for Android',
    'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    ANDROID,
    '',
  ],
  [
    'MetaMask on iOS',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 WebView MetaMaskMobile',
    IOS,
    '',
  ],
  [
    'Binance on iOS',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 BNC/3.22.2',
    IOS,
    '',
  ],
  [
    'Safari on iOS',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    { ...IOS, isSafari: true },
    '',
  ],
]

function setUserAgent(userAgent: string): void {
  Object.defineProperty(navigator, 'userAgent', { value: userAgent, configurable: true })
}

function readInset(): string {
  return document.documentElement.style.getPropertyValue('--mweb-bottom-inset')
}

describe('applyMwebBottomInset', () => {
  const originalUserAgent = navigator.userAgent

  afterEach(() => {
    setUserAgent(originalUserAgent)
    document.documentElement.style.removeProperty('--mweb-bottom-inset')
  })

  it.each(CASES)('sets the inset for %s', (_name, userAgent, flags, expected) => {
    setUserAgent(userAgent)
    Object.assign(env, flags)
    applyMwebBottomInset()
    expect(readInset()).toBe(expected)
  })
})
