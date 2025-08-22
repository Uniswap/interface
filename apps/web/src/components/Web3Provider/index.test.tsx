import { useAccount } from 'hooks/useAccount'
import { mocked } from 'test-utils/mocked'
import { render } from 'test-utils/render'
import { Flex } from 'ui/src'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { WalletConnectionResult } from 'uniswap/src/features/telemetry/types'
import { setUserProperty } from 'uniswap/src/features/telemetry/user'

vi.mock('hooks/useAccount')
vi.mock('hooks/useEthersProvider', () => ({
  useEthersWeb3Provider: () => {
    return { provider: {}, off: vi.fn(), send: vi.fn().mockResolvedValue('v1') }
  },
}))

const ACCOUNT1 = '0x0000000000000000000000000000000000000000'
const ACCOUNT2 = '0x0000000000000000000000000000000000000001'
const account1Result = { address: ACCOUNT1, connector: { name: 'test' } } as unknown as ReturnType<typeof useAccount>
const account2Result = { address: ACCOUNT2, connector: { name: 'test' } } as unknown as ReturnType<typeof useAccount>

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

vi.mock('uniswap/src/features/telemetry/user', async (importOriginal) => {
  const original = (await importOriginal()) as any
  return {
    ...original,
    setUserProperty: vi.fn(),
  }
})

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
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WalletConnected, {
        result: WalletConnectionResult.Succeeded,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_name: 'test',
        wallet_type: 'Network',
        is_reconnect: false,
        peer_wallet_agent: '(Injected)',
        page: 'landing-page',
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
      expect(sendAnalyticsEvent).toHaveBeenCalledTimes(4)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.WalletConnected, {
        result: WalletConnectionResult.Succeeded,
        wallet_address: '0x0000000000000000000000000000000000000000',
        wallet_name: 'test',
        wallet_type: 'Network',
        is_reconnect: true,
        peer_wallet_agent: '(Injected)',
        page: 'landing-page',
      })
    })
  })
})
