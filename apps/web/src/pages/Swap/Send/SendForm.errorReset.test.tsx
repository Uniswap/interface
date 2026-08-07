import '~/test-utils/tokens/mocks'
import { useDynamicConfigValue } from '@universe/gating'
import { useState } from 'react'
import { DAI } from 'uniswap/src/constants/tokens'
import {
  TransactionModalContext,
  TransactionModalContextState,
  TransactionScreen,
} from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { logger } from 'utilities/src/logger/logger'
import { useSendCallback } from '~/features/Swap/hooks/useSendCallback'
import { SwapAndLimitContext } from '~/features/Swap/state/types'
import { tryParseCurrencyAmount } from '~/lib/utils/tryParseCurrencyAmount'
import { SendForm } from '~/pages/Swap/Send/SendForm'
import { SendContext, SendContextType } from '~/pages/Swap/Send/state/SendContext'
import { MultichainContext } from '~/state/multichain/types'
import { act, fireEvent, renderWithUniswapContext, screen, waitFor } from '~/test-utils/render'

vi.mock('~/features/Swap/hooks/useSendCallback', () => ({
  useSendCallback: vi.fn(),
}))

// The form screen's inputs and network-backed hooks are irrelevant to the reset behavior under test.
vi.mock('~/pages/Swap/Send/SendCurrencyInputForm', () => ({ SendCurrencyInputForm: () => null }))
vi.mock('~/pages/Swap/Send/SendRecipientForm', () => ({ SendRecipientForm: () => null }))
vi.mock('uniswap/src/features/address/useIsSmartContractAddress', () => ({
  useIsSmartContractAddress: () => ({ isSmartContractAddress: false, loading: false }),
}))
vi.mock('uniswap/src/features/send/useRecentTransfersByAddress', () => ({
  useRecentTransfersByAddress: () => ({ transfers: [], loading: false }),
}))
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useActiveAddress: () => undefined,
  useConnectionStatus: () => ({ isDisconnected: true }),
}))

const useSendCallbackMock = vi.mocked(useSendCallback)
const useDynamicConfigValueMock = vi.mocked(useDynamicConfigValue)

const mockMultichainContextValue = {
  reset: vi.fn(),
  setSelectedChainId: vi.fn(),
  setIsUserSelectedToken: vi.fn(),
  isSwapAndLimitContext: true,
  isUserSelectedToken: false,
  isMultichainContext: true,
}

const mockSwapAndLimitContextValue = {
  currencyState: { inputCurrency: DAI, outputCurrency: undefined },
  setCurrencyState: vi.fn(),
  currentTab: SwapTab.Send,
  setCurrentTab: vi.fn(),
}

const mockedSendContext: SendContextType = {
  sendState: {
    exactAmountToken: '1',
    exactAmountFiat: undefined,
    recipient: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
    inputCurrency: DAI,
    inputInFiat: false,
  },
  derivedSendInfo: {
    exactAmountOut: '100',
    parsedTokenAmount: tryParseCurrencyAmount('1', DAI),
    recipientData: {
      address: '0x9984b4b4E408e8D618A879e5315BD30952c89103',
    },
  },
  setSendState: vi.fn(),
}

const ERROR_TEXT = 'Transfer failed. Please try again.'
const CONFIRM_BUTTON = 'Confirm send'

function Harness() {
  const [screen_, setScreen] = useState(TransactionScreen.Review)

  const contextValue: TransactionModalContextState = {
    bottomSheetViewStyles: {},
    onClose: vi.fn(),
    screen: screen_,
    setScreen,
  }

  return (
    <TransactionModalContext.Provider value={contextValue}>
      <MultichainContext.Provider value={mockMultichainContextValue}>
        <SwapAndLimitContext.Provider value={mockSwapAndLimitContextValue}>
          <SendContext.Provider value={mockedSendContext}>
            <SendForm />
          </SendContext.Provider>
        </SwapAndLimitContext.Provider>
      </MultichainContext.Provider>
      <button type="button" onClick={() => setScreen(TransactionScreen.Form)}>
        go-form
      </button>
      <button type="button" onClick={() => setScreen(TransactionScreen.Review)}>
        go-review
      </button>
    </TransactionModalContext.Provider>
  )
}

describe('SendForm stale error reset', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    // The form screen resolves recipient ENS, which attempts a blocked RPC in the test env.
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    useDynamicConfigValueMock.mockImplementation((opts: { defaultValue?: unknown }) => {
      if (opts.defaultValue !== undefined && opts.defaultValue !== null) {
        return opts.defaultValue
      }
      return 100
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('clears a prior send failure when the review screen is reopened', async () => {
    useSendCallbackMock.mockReturnValue(vi.fn().mockRejectedValue(new Error('send failed')))

    renderWithUniswapContext(<Harness />)

    // Fail a send while on the review screen -> inline error surfaces.
    fireEvent.click(screen.getByRole('button', { name: CONFIRM_BUTTON }))
    await waitFor(() => expect(screen.getByText(ERROR_TEXT)).toBeInTheDocument())

    // Dismiss back to the form, then reopen review without a new attempt.
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'go-form' }))
    })
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'go-review' }))
    })

    // The stale error must not reappear on the fresh review open.
    await waitFor(() => expect(screen.queryByText(ERROR_TEXT)).not.toBeInTheDocument())
  })
})
