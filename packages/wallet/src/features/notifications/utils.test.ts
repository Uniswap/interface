import { TradeType } from '@uniswap/sdk-core'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { formSwapNotificationTitle } from 'wallet/src/features/notifications/utils'
import { TransactionStatus } from 'wallet/src/features/transactions/types'
import { mockLocalizedFormatter } from 'wallet/src/test/mocks'

describe(formSwapNotificationTitle, () => {
  it('formats successful local swap title', () => {
    expect(
      formSwapNotificationTitle(
        mockLocalizedFormatter,
        TransactionStatus.Success,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000',
        TradeType.EXACT_INPUT,
      ),
    ).toEqual('Swapped 1.00 DAI for ~1.00 USDC.')
  })

  it('formats successful remote swap title', () => {
    expect(
      formSwapNotificationTitle(
        mockLocalizedFormatter,
        TransactionStatus.Success,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1200000',
      ),
    ).toEqual('Swapped 1.00 DAI for 1.20 USDC.')
  })

  it('formats canceled swap title', () => {
    expect(
      formSwapNotificationTitle(
        mockLocalizedFormatter,
        TransactionStatus.Canceled,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000',
        TradeType.EXACT_INPUT,
      ),
    ).toEqual('Canceled DAI-USDC swap.')
  })

  it('formats failed swap title', () => {
    expect(
      formSwapNotificationTitle(
        mockLocalizedFormatter,
        TransactionStatus.Failed,
        DAI,
        USDC,
        '1-DAI',
        '1-USDC',
        '1000000000000000000',
        '1000000',
        TradeType.EXACT_INPUT,
      ),
    ).toEqual('Failed to swap 1.00 DAI for ~1.00 USDC.')
  })
})
