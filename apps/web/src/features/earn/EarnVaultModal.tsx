import { useCallback, useEffect } from 'react'
import { Flex, SpinningLoader } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { DepositReviewView } from 'uniswap/src/features/earn/DepositReviewView'
import { EarnVaultOverview } from 'uniswap/src/features/earn/EarnVaultOverview'
import { useEarnDepositSources } from 'uniswap/src/features/earn/hooks/useEarnDepositSources'
import { useEarnMainnetActionCurrencyForVault } from 'uniswap/src/features/earn/hooks/useEarnMainnetActionCurrency'
import { useEarnPosition } from 'uniswap/src/features/earn/hooks/useEarnPosition'
import {
  type EarnVaultModalInitialView,
  EarnVaultView,
  useEarnVaultModalFlow,
} from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { WithdrawReviewView } from 'uniswap/src/features/earn/WithdrawReviewView'
import { YouNeedTokenView } from 'uniswap/src/features/earn/YouNeedTokenView'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { noop } from 'utilities/src/react/noop'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { DepositAmountView } from '~/features/earn/DepositAmountView'
import type { EarnVaultModalContentProps } from '~/features/earn/types'
import { WithdrawAmountView } from '~/features/earn/WithdrawAmountView'
import { useAccount } from '~/hooks/useAccount'
import { useColor } from '~/hooks/useColor'

interface EarnVaultModalProps {
  vault: EarnVaultInfo | null
  prefetchedPosition?: EarnPositionInfo
  initialView?: EarnVaultModalInitialView
  isOpen: boolean
  onClose: () => void
  onConnectWallet?: () => void
}

// Single Modal hosts the entire vault → {deposit,withdraw}-{amount,review} flow so the
// backdrop never unmounts between transitions, avoiding a visible overlay flicker.
export function EarnVaultModal({
  vault,
  prefetchedPosition,
  initialView = EarnVaultView.Vault,
  isOpen,
  onClose,
  onConnectWallet,
}: EarnVaultModalProps) {
  const account = useAccount()
  const { navigateToSwapFlow, navigateToFiatOnRamp } = useUniswapContext()
  const isConnected = account.isConnected
  const evmAccount = useActiveAccount(Platform.EVM)
  const currencyInfo = useCurrencyInfo(vault?.displayCurrencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''
  const {
    balanceLookupHasData,
    balanceLookupSettled,
    depositSourceOptions,
    hasAnyBalanceForUnderlying,
    selectedDepositSource,
    setSelectedDepositSourceCurrencyId,
  } = useEarnDepositSources({
    vault,
    walletAddress: evmAccount?.address,
    isOpen,
    resetSelectionOnClose: true,
  })
  const { currencyIdForSwap, currencyInfoForActions } = useEarnMainnetActionCurrencyForVault({ vault })

  const { position } = useEarnPosition({
    vault,
    walletAddress: evmAccount?.address,
    isConnected,
    enabled: isOpen,
    prefetchedPosition,
  })
  const hasPosition = position !== undefined

  const {
    flow,
    selectedTab,
    setSelectedTab,
    reset,
    startDeposit,
    startNeedToken,
    submitDepositAmount,
    backToDepositAmount,
    startWithdraw,
    submitWithdrawAmount,
    backToWithdrawAmount,
    backToVault,
  } = useEarnVaultModalFlow({
    hasPosition,
    initialPosition: position,
    initialView,
    isOpen,
    vaultId: vault?.id,
  })

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [onClose, reset])

  const handleWithdraw = useCallback(() => {
    if (position) {
      startWithdraw(position)
    }
  }, [position, startWithdraw])

  // Gate the deposit CTA on the user holding the underlying somewhere; if they don't,
  // route to the "You need {symbol}" view instead of opening the deposit amount input.
  // Wait for both the portfolio and token-project queries to resolve — otherwise users
  // with a balance would be briefly misrouted while data is loading.
  const handleDeposit = useCallback(() => {
    if (isConnected && balanceLookupHasData && !hasAnyBalanceForUnderlying) {
      startNeedToken()
      return
    }
    startDeposit()
  }, [balanceLookupHasData, hasAnyBalanceForUnderlying, isConnected, startDeposit, startNeedToken])

  // Apply the same deposit guard when an external entry point opens the modal directly to
  // DepositAmount (e.g. the token details "Deposit" shortcut). Without this, users with an
  // existing position but no wallet balance would skip the "You need {symbol}" screen.
  useEffect(() => {
    if (
      isOpen &&
      flow.view === EarnVaultView.DepositAmount &&
      isConnected &&
      balanceLookupHasData &&
      !hasAnyBalanceForUnderlying
    ) {
      startNeedToken()
    }
  }, [balanceLookupHasData, flow.view, hasAnyBalanceForUnderlying, isConnected, isOpen, startNeedToken])

  const handleSwapForToken = useCallback(() => {
    if (!currencyIdForSwap) {
      return
    }
    navigateToSwapFlow({ outputCurrencyId: currencyIdForSwap })
    handleClose()
  }, [currencyIdForSwap, handleClose, navigateToSwapFlow])

  const handleBuyWithCash = useCallback(() => {
    if (!currencyInfoForActions) {
      return
    }
    navigateToFiatOnRamp({
      prefilledCurrency: { currencyInfo: currencyInfoForActions },
    })
    handleClose()
  }, [currencyInfoForActions, handleClose, navigateToFiatOnRamp])

  return (
    <Modal
      name={ModalName.EarnVault}
      isModalOpen={isOpen}
      maxWidth={420}
      padding="$spacing16"
      gap="$spacing16"
      backgroundColor="$surface1"
      onClose={handleClose}
    >
      <EarnVaultModalContent
        onConnectWallet={onConnectWallet ?? noop}
        flow={flow}
        flowHandlers={{
          onBackToDepositAmount: backToDepositAmount,
          onBackToVault: backToVault,
          onBackToWithdrawAmount: backToWithdrawAmount,
          onBuyWithCash: handleBuyWithCash,
          onClose: handleClose,
          onDeposit: handleDeposit,
          onReviewDeposit: submitDepositAmount,
          onReviewWithdraw: submitWithdrawAmount,
          onSwapForToken: handleSwapForToken,
          onWithdraw: handleWithdraw,
        }}
        tabState={{ selectedTab, setSelectedTab }}
        vaultData={{
          balanceLookupSettled,
          currencyInfo,
          depositSourceOptions,
          hasPosition,
          isConnected,
          position,
          selectedDepositSource,
          setSelectedDepositSourceCurrencyId,
          symbol,
          vault,
        }}
      />
    </Modal>
  )
}

function EarnVaultModalContent({
  onConnectWallet,
  flow,
  flowHandlers,
  tabState,
  vaultData,
}: EarnVaultModalContentProps): JSX.Element | null {
  const {
    balanceLookupSettled,
    currencyInfo,
    depositSourceOptions,
    hasPosition,
    isConnected,
    position,
    selectedDepositSource,
    setSelectedDepositSourceCurrencyId,
    symbol,
    vault,
  } = vaultData
  const tokenColor = useColor(currencyInfo?.currency)
  const {
    onBackToDepositAmount,
    onBackToVault,
    onBackToWithdrawAmount,
    onBuyWithCash,
    onClose,
    onDeposit,
    onReviewDeposit,
    onReviewWithdraw,
    onSwapForToken,
    onWithdraw,
  } = flowHandlers
  const { selectedTab, setSelectedTab } = tabState

  if (!vault) {
    return null
  }

  // Hold the deposit amount view until balance lookup completes. Otherwise the modal renders
  // DepositAmount first, then flips to NeedToken once the portfolio/tokenProject queries
  // resolve — a visible flicker when entering with initialView=DepositAmount. We gate on
  // `settled` (success or error) so a failed lookup falls through to DepositAmount rather
  // than spinning forever.
  if (flow.view === EarnVaultView.DepositAmount && isConnected && !balanceLookupSettled) {
    return <PendingDepositRoutingView />
  }

  switch (flow.view) {
    case EarnVaultView.Vault:
      return (
        <EarnVaultOverview
          onConnectWallet={onConnectWallet}
          currencyInfo={currencyInfo}
          hasPosition={hasPosition}
          isConnected={isConnected}
          onClose={onClose}
          onDeposit={onDeposit}
          onWithdraw={onWithdraw}
          position={position}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          symbol={symbol}
          vault={vault}
        />
      )
    case EarnVaultView.NeedToken:
      return (
        <YouNeedTokenView
          currencyInfo={currencyInfo}
          symbol={symbol}
          tokenColor={tokenColor}
          onBack={onBackToVault}
          onClose={onClose}
          onSwapForToken={onSwapForToken}
          onBuyWithCash={onBuyWithCash}
        />
      )
    case EarnVaultView.DepositAmount:
      return (
        <DepositAmountView
          vault={vault}
          depositSourceOptions={depositSourceOptions}
          selectedDepositSource={selectedDepositSource}
          onSelectDepositSource={setSelectedDepositSourceCurrencyId}
          initialAmount={flow.amount}
          onBack={onBackToVault}
          onClose={onClose}
          onReview={onReviewDeposit}
        />
      )
    case EarnVaultView.DepositReview:
      return (
        <DepositReviewView
          vault={vault}
          position={position}
          amount={flow.amount}
          sourceCurrencyId={flow.sourceCurrencyId}
          onBack={onBackToDepositAmount}
          onClose={onClose}
        />
      )
    case EarnVaultView.WithdrawAmount:
      return (
        <WithdrawAmountView
          vault={vault}
          availableBalance={flow.position.depositedUsd}
          initialAmount={flow.amount}
          initialChainId={flow.chainId}
          onBack={onBackToVault}
          onClose={onClose}
          onReview={onReviewWithdraw}
        />
      )
    case EarnVaultView.WithdrawReview:
      return (
        <WithdrawReviewView
          vault={vault}
          position={flow.position}
          amount={flow.amount}
          chainId={flow.chainId}
          destinationCurrencyId={flow.destinationCurrencyId}
          onBack={onBackToWithdrawAmount}
          onClose={onClose}
        />
      )
  }

  return assertNever(flow)
}

function PendingDepositRoutingView(): JSX.Element {
  return (
    <Flex alignItems="center" justifyContent="center" minHeight={320}>
      <SpinningLoader color="$neutral2" size={24} />
    </Flex>
  )
}

function assertNever(value: never): never {
  throw new Error(`Unexpected earn vault modal flow: ${JSON.stringify(value)}`)
}
