import { useFiatOnRampTransactions } from 'state/fiatOnRampTransactions/hooks'
import { FiatOnRampTransactionStatus, FiatOnRampTransactionType } from 'state/fiatOnRampTransactions/types'
import Updater from 'state/fiatOnRampTransactions/updater'
import { mocked } from 'test-utils/mocked'
import { act, render } from 'test-utils/render'

const dispatchMock = vi.fn()
vi.mock('state/hooks', async () => {
  const actual = await vi.importActual('state/hooks')
  return {
    ...actual,
    useAppDispatch: () => dispatchMock,
  }
})
vi.mock('state/fiatOnRampTransactions/hooks')

describe('FiatOnRampTransactions Updater', () => {
  beforeEach(() => {
    dispatchMock.mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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
    const fetchSpy = vi
      .spyOn(window, 'fetch')
      .mockResolvedValue({ json: vi.fn().mockReturnValue({ transaction: 'test' }) } as any)

    render(<Updater />)

    await act(async () => {
      vi.advanceTimersByTime(1)
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
    const fetchSpy = vi
      .spyOn(window, 'fetch')
      .mockResolvedValue({ json: vi.fn().mockReturnValue({ transaction: 'test' }) } as any)

    render(<Updater />)

    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(dispatchMock).toHaveBeenCalledTimes(2)
  })
})
