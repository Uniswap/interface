import { InterfaceEventName, WalletConnectionResult } from '@uniswap/analytics-events'
import { sendAnalyticsEvent, user } from 'analytics'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import { useAccount } from 'wagmi'

jest.mock('wagmi', () => ({
  ...jest.requireActual('wagmi'),
  useAccount: jest.fn(),
}))

jest.mock('hooks/useEthersProvider', () => ({
  useEthersWeb3Provider: () => {
    return { provider: {}, off: jest.fn(), send: jest.fn().mockResolvedValue('v1') }
  },
}))

const ACCOUNT1 = '0x0000000000000000000000000000000000000000'
const ACCOUNT2 = '0x0000000000000000000000000000000000000001'
const account1Result = { address: ACCOUNT1, connector: { name: 'test' } } as unknown as ReturnType<typeof useAccount>
const account2Result = { address: ACCOUNT2, connector: { name: 'test' } } as unknown as ReturnType<typeof useAccount>

jest.mock('analytics', () => ({
  useTrace: jest.fn(),
  sendAnalyticsEvent: jest.fn(),
  user: { set: jest.fn(), postInsert: jest.fn() },
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
      render(<div />)

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WALLET_CONNECTED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_type: 'test',
        is_reconnect: false,
        peer_wallet_agent: '(Injected)',
      })
      expect(first(mocked(sendAnalyticsEvent).mock.invocationCallOrder)).toBeGreaterThan(
        last(mocked(user.set).mock.invocationCallOrder)
      )
      expect(first(mocked(sendAnalyticsEvent).mock.invocationCallOrder)).toBeGreaterThan(
        last(mocked(user.postInsert).mock.invocationCallOrder)
      )
    })

    it('sends event with is_reconnect when a previous account reconnects', async () => {
      // Arrange
      mocked(useAccount).mockReturnValue(account1Result)
      const { rerender } = render(<div />)

      mocked(useAccount).mockReturnValue(account2Result)
      rerender(<div />)

      mocked(useAccount).mockReturnValue(account1Result)
      rerender(<div />)

      // Assert
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(3)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WALLET_CONNECTED, {
        result: WalletConnectionResult.SUCCEEDED,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_type: 'test',
        is_reconnect: true,
        peer_wallet_agent: '(Injected)',
      })
    })
  })
})
