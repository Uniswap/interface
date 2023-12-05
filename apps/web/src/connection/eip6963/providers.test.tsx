import { MockEIP1193Provider } from '@web3-react/core'
import METAMASK_ICON from 'assets/wallets/metamask-icon.svg'
import { renderHook } from 'test-utils/render'
import { v4 as uuidv4 } from 'uuid'

import { EIP6963_PROVIDER_MANAGER, useInjectedProviderDetails } from './providers'
import { EIP6963Event, EIP6963ProviderInfo } from './types'

const mockProvider1 = new MockEIP1193Provider()
const mockProvider2 = new MockEIP1193Provider()

const listenersToClearAfterTests: (() => void)[] = []

afterEach(() => {
  listenersToClearAfterTests.forEach((listener) => window.removeEventListener(EIP6963Event.REQUEST_PROVIDER, listener))
  listenersToClearAfterTests.length = 0

  // @ts-ignore
  EIP6963_PROVIDER_MANAGER._map.clear() // reset the map after each test
})

function announceProvider(rdns: string, provider: MockEIP1193Provider) {
  const info: EIP6963ProviderInfo = {
    name: rdns + ' wallet',
    rdns,
    icon: "data:image/svg+xml;charset=UTF-8,<svg xmlns='http://www.w3.org/2000/svg'></svg>",
    uuid: uuidv4(),
  }

  const detail = Object.freeze({ info, provider })

  const announce = () => {
    window.dispatchEvent(
      new CustomEvent(EIP6963Event.ANNOUNCE_PROVIDER, {
        detail,
      })
    )
  }

  announce()

  window.addEventListener(EIP6963Event.REQUEST_PROVIDER, announce)

  listenersToClearAfterTests.push(announce)
}

describe('EIP6963 Providers', () => {
  describe('EIP6963ProviderManager', () => {
    it('should add announced providers to map', () => {
      announceProvider('mockExtension1', mockProvider1)
      announceProvider('mockExtension2', mockProvider2)

      expect(EIP6963_PROVIDER_MANAGER.map.size).toEqual(2)
      expect(EIP6963_PROVIDER_MANAGER.map.get('mockExtension1')).toBeDefined()
      expect(EIP6963_PROVIDER_MANAGER.map.get('mockExtension2')).toBeDefined()
    })

    it('should ignore coinbase', () => {
      announceProvider('com.coinbase.wallet', mockProvider1)

      expect(EIP6963_PROVIDER_MANAGER.map.size).toEqual(0)
    })

    it('should replace metamask logo', () => {
      announceProvider('io.metamask', mockProvider1)

      expect(EIP6963_PROVIDER_MANAGER.map.size).toEqual(1)
      expect(EIP6963_PROVIDER_MANAGER.map.get('io.metamask')?.info.icon).toEqual(METAMASK_ICON)
    })

    it('should ignore improperly formatted provider info', () => {
      announceProvider(undefined as any, mockProvider1)

      expect(EIP6963_PROVIDER_MANAGER.map.size).toEqual(0)
    })

    it('should ignore improperly formatted providers', () => {
      announceProvider('mockExtension1', {} as any)

      expect(EIP6963_PROVIDER_MANAGER.map.size).toEqual(0)
    })
  })

  it('useInjectedProviderDetails', () => {
    announceProvider('mockExtension1', mockProvider1)
    const test = renderHook(() => useInjectedProviderDetails())

    expect([test.result.current.values()].length).toEqual(1)
    expect(test.result.current.get('mockExtension1')).toBeDefined()

    announceProvider('mockExtension2', mockProvider2)

    expect(test.result.current.size).toEqual(2)
    expect(test.result.current.get('mockExtension1')).toBeDefined()
    expect(test.result.current.get('mockExtension2')).toBeDefined()
  })
})
