import { beforeEach, describe, expect, it, vi } from 'vitest'

const rumSetGlobalContextProperty = vi.fn()
const logsSetGlobalContextProperty = vi.fn()

vi.mock('@datadog/browser-rum', () => ({
  datadogRum: { setGlobalContextProperty: (...args: unknown[]) => rumSetGlobalContextProperty(...args) },
}))
vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: { setGlobalContextProperty: (...args: unknown[]) => logsSetGlobalContextProperty(...args) },
}))
vi.mock('@universe/environment', () => ({
  isExtensionApp: true,
  isWebApp: false,
  isTestEnv: (): boolean => false,
}))

const { setAttributesToDatadog } = await import('utilities/src/logger/datadog/Datadog.web')

describe('setAttributesToDatadog (web)', () => {
  beforeEach(() => {
    rumSetGlobalContextProperty.mockClear()
    logsSetGlobalContextProperty.mockClear()
  })

  it('writes every attribute to both RUM and Logs global context', async () => {
    await setAttributesToDatadog({ activeWalletAddress: '0xabc', signerWalletCount: 2, testnetMode: false })

    const expected = [
      ['activeWalletAddress', '0xabc'],
      ['signerWalletCount', 2],
      ['testnetMode', false],
    ]
    expect(rumSetGlobalContextProperty.mock.calls).toEqual(expected)
    expect(logsSetGlobalContextProperty.mock.calls).toEqual(expected)
  })
})
