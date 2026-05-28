import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { useAccount } from 'hooks/useAccount'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import { Flex } from 'ui/src'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setUserProperty } from 'uniswap/src/features/telemetry/user'

jest.mock('hooks/useAccount')
jest.mock('hooks/useEthersProvider', () => ({
  useEthersWeb3Provider: () => {
    return { provider: {}, off: jest.fn(), send: jest.fn().mockResolvedValue('v1') }
  },
}))

const ACCOUNT1 = '0x0000000000000000000000000000000000000000'
const ACCOUNT2 = '0x0000000000000000000000000000000000000001'
const account1Result = { address: ACCOUNT1, connector: { name: 'test' } } as unknown as ReturnType<typeof useAccount>
const account2Result = { address: ACCOUNT2, connector: { name: 'test' } } as unknown as ReturnType<typeof useAccount>

jest.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: jest.fn(),
}))

jest.mock('uniswap/src/features/telemetry/user', () => ({
  setUserProperty: jest.fn(),
}))

function first<T>(array: T[]): T {
  return array[0]
}

function last<T>(array: T[]): T {
  return array[array.length - 1]
}

describe('Web3Provider', () => {
  describe('analytics', () => {
    it('sends event when the active account changes', async () => {
      // Arrange
      mocked(useAccount).mockReturnValue(account1Result)
      render(<Flex />)

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
      expect(setUserProperty).toHaveBeenCalledTimes(5)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WALLET_CONNECTED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_name: 'test',
        wallet_type: 'Network',
        is_reconnect: false,
        peer_wallet_agent: '(Injected)',
      })
      expect(first(mocked(sendAnalyticsEvent).mock.invocationCallOrder)).toBeGreaterThan(
        last(mocked(setUserProperty).mock.invocationCallOrder),
      )
    })

    it('sends event with is_reconnect when a previous account reconnects', async () => {
      // Arrange
      mocked(useAccount).mockReturnValue(account1Result)
      const { rerender } = render(<Flex />)

      mocked(useAccount).mockReturnValue(account2Result)
      rerender(<Flex />)

      mocked(useAccount).mockReturnValue(account1Result)
      rerender(<Flex />)

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(3)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WALLET_CONNECTED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_name: 'test',
        wallet_type: 'Network',
        is_reconnect: true,
        peer_wallet_agent: '(Injected)',
      })
    })
  })
})
