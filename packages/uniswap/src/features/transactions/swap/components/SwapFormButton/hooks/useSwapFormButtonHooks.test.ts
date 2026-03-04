import { useOnReviewPress } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useOnReviewPress'
import { useSwapFormButtonColors } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonColors'
import { useSwapFormButtonText } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useSwapFormButtonText'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { act, renderHook } from 'uniswap/src/test/test-utils'
import { CurrencyField } from 'uniswap/src/types/currency'
import type { Mock } from 'vitest'

const mockT = vi.fn((key: string, options?: Record<string, unknown>) =>
  options ? `${key}:${JSON.stringify(options)}` : key,
)

vi.mock('react-i18next', () => ({
  useTranslation: (): { t: typeof mockT } => ({ t: mockT }),
}))

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  }
})

vi.mock('uniswap/src/constants/tokens', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/constants/tokens')>()
  return {
    ...actual,
    nativeOnChain: vi.fn(),
  }
})

vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: vi.fn(),
  useActiveAccount: vi.fn(),
}))

vi.mock('uniswap/src/features/platforms/utils/chains', () => ({
  isSVMChain: vi.fn(),
  chainIdToPlatform: vi.fn(),
}))

vi.mock('uniswap/src/features/providers/webForNudgeProvider', () => ({
  useIsWebFORNudgeEnabled: vi.fn(),
  useIsShowingWebFORNudge: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext', () => ({
  useTransactionModalContext: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsAmountSelectionInvalid', () => ({
  useIsAmountSelectionInvalid: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet', () => ({
  useIsMissingPlatformWallet: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTokenSelectionInvalid', () => ({
  useIsTokenSelectionInvalid: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTradeIndicative', () => ({
  useIsTradeIndicative: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings', () => ({
  useParsedSwapWarnings: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton', () => ({
  getActionText: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore', () => ({
  useSwapFormStore: vi.fn(),
  useSwapFormStoreDerivedSwapInfo: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled', () => ({
  useIsSwapButtonDisabled: vi.fn(),
}))

vi.mock(
  'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockingWithCustomMessage',
  () => ({
    useIsBlockingWithCustomMessage: vi.fn(),
  }),
)

vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  return {
    ...actual,
    useColorsFromTokenColor: vi.fn(),
  }
})

vi.mock('uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore', () => ({
  useSwapFormWarningStoreActions: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/services/hooks/usePrepareSwap', () => ({
  usePrepareSwap: vi.fn(),
}))

vi.mock('uniswap/src/features/transactions/swap/services/hooks/useWarningService', () => ({
  useWarningService: vi.fn(),
}))

vi.mock('utilities/src/react/hooks', () => ({
  useEvent: <T extends (...args: never[]) => unknown>(handler: T): T => handler,
}))

import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useColorsFromTokenColor } from 'ui/src'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { useActiveAccount, useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { chainIdToPlatform, isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useIsShowingWebFORNudge, useIsWebFORNudgeEnabled } from 'uniswap/src/features/providers/webForNudgeProvider'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { useIsAmountSelectionInvalid } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsAmountSelectionInvalid'
import { useIsBlockingWithCustomMessage } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsBlockingWithCustomMessage'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'
import { useIsSwapButtonDisabled } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsSwapButtonDisabled'
import { useIsTokenSelectionInvalid } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTokenSelectionInvalid'
import { useIsTradeIndicative } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsTradeIndicative'
import { useSwapFormWarningStoreActions } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/useSwapFormWarningStore'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { getActionText } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SubmitSwapButton'
import { usePrepareSwap } from 'uniswap/src/features/transactions/swap/services/hooks/usePrepareSwap'
import { useWarningService } from 'uniswap/src/features/transactions/swap/services/hooks/useWarningService'
import {
  useSwapFormStore,
  useSwapFormStoreDerivedSwapInfo,
} from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'

type UseSwapFormStoreSelector<T> = (s: { isSubmitting: boolean }) => T
type UseSwapFormStoreDerivedSwapInfoSelector<T> = (s: {
  currencies: Record<string, { currency: { symbol?: string } } | undefined>
  wrapType: WrapType
  chainId: number
}) => T

describe('swap form button hooks', () => {
  const mockUseFeatureFlag = useFeatureFlag as Mock
  const mockNativeOnChain = nativeOnChain as Mock
  const mockUseConnectionStatus = useConnectionStatus as Mock
  const mockUseActiveAccount = useActiveAccount as Mock
  const mockChainIdToPlatform = chainIdToPlatform as unknown as Mock
  const mockIsSVMChain = isSVMChain as unknown as Mock
  const mockUseIsWebFORNudgeEnabled = useIsWebFORNudgeEnabled as Mock
  const mockUseIsShowingWebFORNudge = useIsShowingWebFORNudge as Mock
  const mockUseTransactionModalContext = useTransactionModalContext as Mock
  const mockUseIsAmountSelectionInvalid = useIsAmountSelectionInvalid as Mock
  const mockUseIsMissingPlatformWallet = useIsMissingPlatformWallet as Mock
  const mockUseIsSwapButtonDisabled = useIsSwapButtonDisabled as Mock
  const mockUseIsTokenSelectionInvalid = useIsTokenSelectionInvalid as Mock
  const mockUseIsTradeIndicative = useIsTradeIndicative as Mock
  const mockUseParsedSwapWarnings = useParsedSwapWarnings as Mock
  const mockGetActionText = getActionText as Mock
  const mockUseSwapFormStore = useSwapFormStore as Mock
  const mockUseSwapFormStoreDerivedSwapInfo = useSwapFormStoreDerivedSwapInfo as Mock
  const mockUseIsBlockingWithCustomMessage = useIsBlockingWithCustomMessage as Mock
  const mockUseColorsFromTokenColor = useColorsFromTokenColor as Mock
  const mockUseSwapFormWarningStoreActions = useSwapFormWarningStoreActions as Mock
  const mockUsePrepareSwap = usePrepareSwap as Mock
  const mockUseWarningService = useWarningService as Mock

  const setDerivedSwapInfo = ({
    wrapType = WrapType.NotApplicable,
    chainId = 1,
    inputSymbol = 'ABC',
  }: {
    wrapType?: WrapType
    chainId?: number
    inputSymbol?: string
  } = {}): void => {
    mockUseSwapFormStoreDerivedSwapInfo.mockImplementation(
      (selector: UseSwapFormStoreDerivedSwapInfoSelector<unknown>) =>
        selector({
          currencies: {
            [CurrencyField.INPUT]: { currency: { symbol: inputSymbol } },
          },
          wrapType,
          chainId,
        }),
    )
  }

  const setWarnings = ({
    blockingWarning,
    insufficientBalanceWarning,
    insufficientGasFundsWarning,
  }: {
    blockingWarning?: { buttonText?: string }
    insufficientBalanceWarning?: Record<string, unknown>
    insufficientGasFundsWarning?: Record<string, unknown>
  } = {}): void => {
    mockUseParsedSwapWarnings.mockReturnValue({
      insufficientBalanceWarning,
      blockingWarning,
      insufficientGasFundsWarning,
    })
  }

  const setConnection = ({
    isDisconnected = false,
    isMissingPlatformWallet = false,
    isSVM = false,
  }: {
    isDisconnected?: boolean
    isMissingPlatformWallet?: boolean
    isSVM?: boolean
  } = {}): void => {
    mockUseConnectionStatus.mockReturnValue({ isDisconnected })
    mockUseIsMissingPlatformWallet.mockReturnValue(isMissingPlatformWallet)
    mockIsSVMChain.mockReturnValue(isSVM)
  }

  const setWebForNudge = ({
    enabled = false,
    showing = false,
  }: {
    enabled?: boolean
    showing?: boolean
  } = {}): void => {
    mockUseIsWebFORNudgeEnabled.mockReturnValue(enabled)
    mockUseIsShowingWebFORNudge.mockReturnValue(showing)
  }

  const setRedirectCallback = (enabled: boolean): void => {
    mockUseTransactionModalContext.mockReturnValue({
      swapRedirectCallback: enabled ? vi.fn() : undefined,
    })
  }

  const setSubmitting = (isSubmitting: boolean): void => {
    mockUseSwapFormStore.mockImplementation((selector: UseSwapFormStoreSelector<boolean>) => selector({ isSubmitting }))
  }

  const setActiveAccount = (hasActiveAccount: boolean): void => {
    mockUseActiveAccount.mockReturnValue(hasActiveAccount ? { address: '0xabc' } : undefined)
  }

  const setupWarningService = (): {
    prepareSwap: Mock
    warningService: {
      setSkipBridgingWarning: Mock
      setSkipMaxTransferWarning: Mock
      setSkipTokenProtectionWarning: Mock
      setSkipBridgedAssetWarning: Mock
    }
  } => {
    const prepareSwap = vi.fn()
    const warningService = {
      setSkipBridgingWarning: vi.fn(),
      setSkipMaxTransferWarning: vi.fn(),
      setSkipTokenProtectionWarning: vi.fn(),
      setSkipBridgedAssetWarning: vi.fn(),
    }
    mockUsePrepareSwap.mockReturnValue(prepareSwap)
    mockUseWarningService.mockReturnValue(warningService)
    return { prepareSwap, warningService }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet && false)
    mockNativeOnChain.mockReturnValue({ symbol: 'ETH' })
    setConnection()
    setActiveAccount(true)
    mockChainIdToPlatform.mockReturnValue('evm')
    setWebForNudge()
    setRedirectCallback(false)
    mockUseIsAmountSelectionInvalid.mockReturnValue(false)
    mockUseIsSwapButtonDisabled.mockReturnValue(false)
    mockUseIsTokenSelectionInvalid.mockReturnValue(false)
    mockUseIsTradeIndicative.mockReturnValue(false)
    setWarnings()
    mockGetActionText.mockReturnValue('Wrap ETH')

    setSubmitting(false)
    setDerivedSwapInfo()
    mockUseIsBlockingWithCustomMessage.mockReturnValue(false)
    mockUseColorsFromTokenColor.mockReturnValue({
      validTokenColor: '$token',
      lightTokenColor: '$tokenLight',
    })

    mockUseSwapFormWarningStoreActions.mockReturnValue({
      handleHideTokenWarningModal: vi.fn(),
      handleHideMaxNativeTransferModal: vi.fn(),
      handleHideBridgedAssetModal: vi.fn(),
    })
    mockUsePrepareSwap.mockReturnValue(vi.fn())
    mockUseWarningService.mockReturnValue({
      setSkipBridgingWarning: vi.fn(),
      setSkipMaxTransferWarning: vi.fn(),
      setSkipTokenProtectionWarning: vi.fn(),
      setSkipBridgedAssetWarning: vi.fn(),
    })
  })

  describe('useSwapFormButtonText', () => {
    it('returns Get Started when swapRedirectCallback exists', () => {
      setRedirectCallback(true)
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.getStarted')
    })

    it('returns empty swap text when web FOR nudge enabled', () => {
      setWebForNudge({ enabled: true })
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('empty.swap.button.text')
    })

    it('returns finalizing quote when trade is indicative', () => {
      mockUseIsTradeIndicative.mockReturnValue(true)
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('swap.finalizingQuote')
    })

    it('returns login when disconnected and embedded wallet enabled', () => {
      mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.EmbeddedWallet && true)
      setConnection({ isDisconnected: true })
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('nav.logIn.button')
    })

    it('returns connect wallet when disconnected and embedded wallet disabled', () => {
      setConnection({ isDisconnected: true })
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.connectWallet.button')
    })

    it('returns connect to platform when missing platform wallet', () => {
      setConnection({ isMissingPlatformWallet: true, isSVM: true })
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.connectTo:{"platform":"Solana"}')
    })

    it('returns connect to Ethereum when missing platform wallet on EVM', () => {
      setConnection({ isMissingPlatformWallet: true, isSVM: false })
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.connectTo:{"platform":"Ethereum"}')
    })

    it('returns blocking warning button text before selection errors', () => {
      setWarnings({ blockingWarning: { buttonText: 'Blocked' } })
      mockUseIsTokenSelectionInvalid.mockReturnValue(true)
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('Blocked')
    })

    it('returns select token when token selection invalid', () => {
      mockUseIsTokenSelectionInvalid.mockReturnValue(true)
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.selectToken.label')
    })

    it('returns no amount when amount selection invalid', () => {
      mockUseIsAmountSelectionInvalid.mockReturnValue(true)
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.noAmount.error')
    })

    it('returns insufficient balance text with input symbol', () => {
      setWarnings({ insufficientBalanceWarning: { type: 'INSUFFICIENT_BALANCE' } })
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.insufficientTokenBalance.error.simple:{"tokenSymbol":"ABC"}')
    })

    it('returns insufficient gas funds text with native symbol', () => {
      setWarnings({ insufficientGasFundsWarning: { type: 'INSUFFICIENT_GAS' } })
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.insufficientTokenBalance.error.simple:{"tokenSymbol":"ETH"}')
    })

    it('falls through when blocking warning has no button text', () => {
      setWarnings({ blockingWarning: { buttonText: '' } })
      mockUseIsTokenSelectionInvalid.mockReturnValue(true)
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('common.selectToken.label')
    })

    it('returns wrap action text when wrap is selected', () => {
      setDerivedSwapInfo({ wrapType: WrapType.Wrap })
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('Wrap ETH')
      expect(mockGetActionText).toHaveBeenCalled()
    })

    it('returns review text by default', () => {
      const { result } = renderHook(() => useSwapFormButtonText())
      expect(result.current).toBe('swap.button.review')
    })

    describe('priority order', () => {
      it('prioritizes swap redirect over other states', () => {
        setRedirectCallback(true)
        setWebForNudge({ enabled: true })
        mockUseIsTradeIndicative.mockReturnValue(true)
        setConnection({ isDisconnected: true })
        const { result } = renderHook(() => useSwapFormButtonText())
        expect(result.current).toBe('common.getStarted')
      })

      it('prioritizes web FOR nudge over indicative', () => {
        setWebForNudge({ enabled: true })
        mockUseIsTradeIndicative.mockReturnValue(true)
        const { result } = renderHook(() => useSwapFormButtonText())
        expect(result.current).toBe('empty.swap.button.text')
      })

      it('prioritizes web FOR nudge over disconnected', () => {
        setWebForNudge({ enabled: true })
        setConnection({ isDisconnected: true })
        const { result } = renderHook(() => useSwapFormButtonText())
        expect(result.current).toBe('empty.swap.button.text')
      })

      it('prioritizes insufficient balance over insufficient gas', () => {
        setWarnings({
          insufficientBalanceWarning: { type: 'INSUFFICIENT_BALANCE' },
          insufficientGasFundsWarning: { type: 'INSUFFICIENT_GAS' },
        })
        const { result } = renderHook(() => useSwapFormButtonText())
        expect(result.current).toBe('common.insufficientTokenBalance.error.simple:{"tokenSymbol":"ABC"}')
      })

      it('prioritizes selection errors over insufficient balance', () => {
        mockUseIsTokenSelectionInvalid.mockReturnValue(true)
        setWarnings({ insufficientBalanceWarning: { type: 'INSUFFICIENT_BALANCE' } })
        const { result } = renderHook(() => useSwapFormButtonText())
        expect(result.current).toBe('common.selectToken.label')
      })
    })
  })

  describe('useSwapFormButtonColors', () => {
    it('uses default background and secondary emphasis when disabled', () => {
      mockUseIsSwapButtonDisabled.mockReturnValue(true)
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBeUndefined()
      expect(result.current.variant).toBe('default')
      expect(result.current.emphasis).toBe('secondary')
    })

    it('uses accent colors when web FOR nudge is prompted', () => {
      setWebForNudge({ enabled: true })
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBe('$accent2')
      expect(result.current.variant).toBe('branded')
      expect(result.current.emphasis).toBe('primary')
      expect(result.current.buttonTextColor).toBe('$accent1')
    })

    it('uses light token color when no active account', () => {
      setActiveAccount(false)
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBe('$tokenLight')
      expect(result.current.emphasis).toBe('secondary')
      expect(result.current.buttonTextColor).toBe('$token')
    })

    it('uses valid token color when active account and not prompted', () => {
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBe('$token')
      expect(result.current.variant).toBe('branded')
      expect(result.current.emphasis).toBe('primary')
    })

    it('uses light token color when submitting', () => {
      setSubmitting(true)
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBe('$tokenLight')
      expect(result.current.emphasis).toBe('secondary')
    })

    it('does not prompt web FOR nudge when showing or redirecting', () => {
      setWebForNudge({ enabled: true, showing: true })
      setRedirectCallback(true)
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBe('$token')
      expect(result.current.buttonTextColor).toBeUndefined()
    })

    it('uses default variant when blocking without redirect', () => {
      mockUseIsBlockingWithCustomMessage.mockReturnValue(true)
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.variant).toBe('default')
      expect(result.current.emphasis).toBe('secondary')
    })

    it('keeps branded variant when disabled but redirecting', () => {
      mockUseIsSwapButtonDisabled.mockReturnValue(true)
      setRedirectCallback(true)
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.variant).toBe('branded')
      expect(result.current.emphasis).toBe('primary')
    })

    it('uses inactive account colors even when web FOR nudge enabled', () => {
      setWebForNudge({ enabled: true })
      setActiveAccount(false)
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBe('$tokenLight')
      expect(result.current.buttonTextColor).toBe('$accent1')
      expect(result.current.emphasis).toBe('secondary')
    })

    it('uses submitting color over web FOR nudge when submitting', () => {
      setWebForNudge({ enabled: true })
      setSubmitting(true)
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBe('$tokenLight')
      expect(result.current.emphasis).toBe('secondary')
    })

    it('handles missing token colors', () => {
      mockUseColorsFromTokenColor.mockReturnValue({
        validTokenColor: undefined,
        lightTokenColor: undefined,
      })
      const { result } = renderHook(() => useSwapFormButtonColors())
      expect(result.current.backgroundColor).toBeUndefined()
      expect(result.current.buttonTextColor).toBeUndefined()
    })
  })

  describe('useOnReviewPress', () => {
    it('calls prepareSwap with all skip flags false on review press', () => {
      const { prepareSwap, warningService } = setupWarningService()

      const { result } = renderHook(() => useOnReviewPress())

      act(() => {
        result.current.handleOnReviewPress()
      })

      expect(warningService.setSkipBridgingWarning).toHaveBeenCalledWith(false)
      expect(warningService.setSkipMaxTransferWarning).toHaveBeenCalledWith(false)
      expect(warningService.setSkipTokenProtectionWarning).toHaveBeenCalledWith(false)
      expect(warningService.setSkipBridgedAssetWarning).toHaveBeenCalledWith(false)
      expect(prepareSwap).toHaveBeenCalled()
    })

    it('acknowledge token warning hides modal and skips token protection warning', () => {
      const handleHideTokenWarningModal = vi.fn()
      mockUseSwapFormWarningStoreActions.mockReturnValue({
        handleHideTokenWarningModal,
        handleHideMaxNativeTransferModal: vi.fn(),
        handleHideBridgedAssetModal: vi.fn(),
      })
      const { warningService, prepareSwap } = setupWarningService()

      const { result } = renderHook(() => useOnReviewPress())

      act(() => {
        result.current.handleOnAcknowledgeTokenWarningPress()
      })

      expect(handleHideTokenWarningModal).toHaveBeenCalled()
      expect(warningService.setSkipTokenProtectionWarning).toHaveBeenCalledWith(true)
      expect(warningService.setSkipBridgingWarning).toHaveBeenCalledWith(false)
      expect(warningService.setSkipMaxTransferWarning).toHaveBeenCalledWith(false)
      expect(warningService.setSkipBridgedAssetWarning).toHaveBeenCalledWith(false)
      expect(prepareSwap).toHaveBeenCalled()
    })

    it('acknowledge low native balance skips bridging/max/token protection', () => {
      const handleHideMaxNativeTransferModal = vi.fn()
      mockUseSwapFormWarningStoreActions.mockReturnValue({
        handleHideTokenWarningModal: vi.fn(),
        handleHideMaxNativeTransferModal,
        handleHideBridgedAssetModal: vi.fn(),
      })
      const { prepareSwap, warningService } = setupWarningService()

      const { result } = renderHook(() => useOnReviewPress())

      act(() => {
        result.current.handleOnAcknowledgeLowNativeBalancePress()
      })

      expect(handleHideMaxNativeTransferModal).toHaveBeenCalled()
      expect(warningService.setSkipBridgingWarning).toHaveBeenCalledWith(true)
      expect(warningService.setSkipMaxTransferWarning).toHaveBeenCalledWith(true)
      expect(warningService.setSkipTokenProtectionWarning).toHaveBeenCalledWith(true)
      expect(warningService.setSkipBridgedAssetWarning).toHaveBeenCalledWith(false)
      expect(prepareSwap).toHaveBeenCalled()
    })

    it('acknowledge bridged asset skips all warnings', () => {
      const handleHideBridgedAssetModal = vi.fn()
      mockUseSwapFormWarningStoreActions.mockReturnValue({
        handleHideTokenWarningModal: vi.fn(),
        handleHideMaxNativeTransferModal: vi.fn(),
        handleHideBridgedAssetModal,
      })
      const { prepareSwap, warningService } = setupWarningService()

      const { result } = renderHook(() => useOnReviewPress())

      act(() => {
        result.current.handleOnAcknowledgeBridgedAssetPress()
      })

      expect(handleHideBridgedAssetModal).toHaveBeenCalled()
      expect(warningService.setSkipBridgingWarning).toHaveBeenCalledWith(true)
      expect(warningService.setSkipMaxTransferWarning).toHaveBeenCalledWith(true)
      expect(warningService.setSkipTokenProtectionWarning).toHaveBeenCalledWith(true)
      expect(warningService.setSkipBridgedAssetWarning).toHaveBeenCalledWith(true)
      expect(prepareSwap).toHaveBeenCalled()
    })
  })
})
