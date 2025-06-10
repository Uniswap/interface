import { useFiatOnRampTransactions } from 'state/fiatOnRampTransactions/hooks'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import Updater from 'state/fiatOnRampTransactions/updater'
import { mocked } from 'test-utils/mocked'
import { act, render } from 'test-utils/render'

const dispatchMock = jest.fn()
jest.mock('state/hooks', () => ({
  ...jest.requireActual('state/hooks'),
  useAppDispatch: () => dispatchMock,
}))
jest.mock('state/fiatOnRampTransactions/hooks')

describe('FiatOnRampTransactions Updater', () => {
  it('should fetch /transaction endpoint for each onramp transaction with forceFetch=false', async () => {
    mocked(useFiatOnRampTransactions).mockReturnValue({
      '123': {
        account: '0x123',
        externalSessionId: '123',
        status: FiatOnRampTransactionStatus.INITIATED,
        forceFetched: false,
        addedAt: Date.now(),
        type: FiatOnRampTransactionType.BUY,
        syncedWithBackend: false,
        provider: 'COINBASE_PAY',
      },
      '234': {
        account: '0x123',
        externalSessionId: '234',
        status: FiatOnRampTransactionStatus.INITIATED,
        forceFetched: false,
        addedAt: Date.now(),
        type: FiatOnRampTransactionType.BUY,
        syncedWithBackend: false,
        provider: 'COINBASE_PAY',
      },
      '345': {
        account: '0x123',
        externalSessionId: '345',
        status: FiatOnRampTransactionStatus.INITIATED,
        forceFetched: true,
        addedAt: Date.now(),
        type: FiatOnRampTransactionType.BUY,
        syncedWithBackend: false,
        provider: 'COINBASE_PAY',
      },
    })
    const fetchSpy = jest
      .spyOn(window, 'fetch')
      .mockResolvedValue({ json: jest.fn().mockReturnValue({ transaction: 'test' }) } as any)
    const { asFragment } = render(<Updater />)
    await act(async () => {
      asFragment()
    })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(dispatchMock).toHaveBeenCalledTimes(2)
  })

  it('should fetch /transaction endpoint for each offramp transaction with forceFetch=false or status=PENDING', async () => {
    mocked(useFiatOnRampTransactions).mockReturnValue({
      '123': {
        account: '0x123',
        externalSessionId: '123',
        status: FiatOnRampTransactionStatus.INITIATED,
        forceFetched: false,
        addedAt: Date.now(),
        type: FiatOnRampTransactionType.SELL,
        syncedWithBackend: false,
        provider: 'COINBASE_PAY',
      },
      '234': {
        account: '0x123',
        externalSessionId: '234',
        status: FiatOnRampTransactionStatus.PENDING,
        forceFetched: true,
        addedAt: Date.now(),
        type: FiatOnRampTransactionType.SELL,
        syncedWithBackend: false,
        provider: 'COINBASE_PAY',
      },
      '345': {
        account: '0x123',
        externalSessionId: '345',
        status: FiatOnRampTransactionStatus.COMPLETE,
        forceFetched: true,
        addedAt: Date.now(),
        type: FiatOnRampTransactionType.SELL,
        syncedWithBackend: false,
        provider: 'COINBASE_PAY',
      },
    })
    const fetchSpy = jest
      .spyOn(window, 'fetch')
      .mockResolvedValue({ json: jest.fn().mockReturnValue({ transaction: 'test' }) } as any)
    const { asFragment } = render(<Updater />)
    await act(async () => {
      asFragment()
    })
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(dispatchMock).toHaveBeenCalledTimes(2)
  })
})
