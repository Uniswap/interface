import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import type { GetEarnPositionResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useCallback, useEffect, useMemo } from 'react'
import { Flex, SpinningLoader } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { getEarnPositionQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/earn'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenProjects } from 'uniswap/src/features/dataApi/tokenProjects/tokenProjects'
import { DepositReviewView } from 'uniswap/src/features/earn/DepositReviewView'
import { EarnVaultOverview } from 'uniswap/src/features/earn/EarnVaultOverview'
import {
  type EarnVaultModalInitialView,
  EarnVaultView,
  useEarnVaultModalFlow,
} from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnPositionInfo } from 'uniswap/src/features/earn/utils'
import { YouNeedTokenView } from 'uniswap/src/features/earn/YouNeedTokenView'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { usePortfolioBalances } from 'uniswap/src/features/portfolio/balances/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { noop } from 'utilities/src/react/noop'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { DepositAmountView } from '~/features/earn/DepositAmountView'
import type { EarnVaultModalContentProps } from '~/features/earn/types'
import { WithdrawAmountView } from '~/features/earn/WithdrawAmountView'
import { WithdrawReviewView } from '~/features/earn/WithdrawReviewView'
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
  const currencyInfo = useCurrencyInfo(vault?.currencyId)
  const currency = currencyInfo?.currency
  const symbol = currency?.symbol ?? ''

  const { balance: onChainBalance } = useOnChainCurrencyBalance(currency, evmAccount?.address)
  const availableBalance = onChainBalance ? Number(onChainBalance.toExact()) : 0

  // Token project groups the same token across every chain it lives on; used here to
  // (1) resolve the mainnet variant for swap/on-ramp prefill and (2) match wallet balances
  // by currencyId across all chain variants of the underlying.
  const projectQueryIds = useMemo(() => (vault?.currencyId ? [vault.currencyId] : []), [vault?.currencyId])
  const { data: tokenProject, error: tokenProjectError } = useTokenProjects(projectQueryIds)
  const mainnetCurrencyInfo = useMemo(
    () => tokenProject?.find((info) => info.currency.chainId === UniverseChainId.Mainnet),
    [tokenProject],
  )
  const mainnetCurrencyId = mainnetCurrencyInfo?.currencyId ?? vault?.currencyId
  const projectCurrencyIds = useMemo(() => {
    const ids = new Set(tokenProject?.map((info) => info.currencyId.toLowerCase()) ?? [])
    if (vault?.currencyId) {
      ids.add(vault.currencyId.toLowerCase())
    }
    return ids
  }, [tokenProject, vault?.currencyId])

  const portfolio = usePortfolioBalances({ evmAddress: evmAccount?.address, skip: !isOpen || !evmAccount?.address })
  const hasAnyBalanceForUnderlying = useMemo(() => {
    if (!projectCurrencyIds.size || !portfolio.data) {
      return false
    }
    return Object.values(portfolio.data).some(
      (entry) => projectCurrencyIds.has(entry.currencyInfo.currencyId.toLowerCase()) && entry.quantity > 0,
    )
  }, [portfolio.data, projectCurrencyIds])
  // Gate on data presence (not `loading`) so cached results short-circuit background refetches.
  // Errors and a missing EVM address also count as settled — both leave the queries unable to
  // resolve, so without this the spinner would hang. Routing still gates on `HasData` so a
  // no-balance redirect only fires when we have a real result to trust.
  const balanceLookupHasData = portfolio.data !== undefined && tokenProject !== undefined
  const balanceLookupErrored = portfolio.error !== undefined || tokenProjectError !== undefined
  const balanceLookupSettled = balanceLookupHasData || balanceLookupErrored || !evmAccount?.address

  const positionQueryParams =
    vault && evmAccount?.address
      ? { walletAddress: evmAccount.address, vaultAddress: vault.vaultAddress, chainId: vault.chainId }
      : undefined
  const positionQuery = useQuery(
    getEarnPositionQueryOptions({
      params: positionQueryParams,
      enabled: isOpen && !!positionQueryParams,
    }),
  )
  const position = resolvePosition({
    isConnected,
    positionQuery,
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
    if (!mainnetCurrencyId) {
      return
    }
    navigateToSwapFlow({ outputCurrencyId: mainnetCurrencyId })
    handleClose()
  }, [handleClose, mainnetCurrencyId, navigateToSwapFlow])

  const handleBuyWithCash = useCallback(() => {
    if (!mainnetCurrencyInfo) {
      return
    }
    navigateToFiatOnRamp({ prefilledCurrency: { currencyInfo: mainnetCurrencyInfo } })
    handleClose()
  }, [handleClose, mainnetCurrencyInfo, navigateToFiatOnRamp])

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
          availableBalance,
          balanceLookupSettled,
          currencyInfo,
          hasPosition,
          isConnected,
          position,
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
  const { availableBalance, balanceLookupSettled, currencyInfo, hasPosition, isConnected, position, symbol, vault } =
    vaultData
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
          availableBalance={availableBalance}
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

function resolvePosition({
  isConnected,
  positionQuery,
  prefetchedPosition,
}: {
  isConnected: boolean
  positionQuery: UseQueryResult<GetEarnPositionResponse | undefined, Error>
  prefetchedPosition: EarnPositionInfo | undefined
}): EarnPositionInfo | undefined {
  if (!isConnected) {
    return undefined
  }
  if (positionQuery.isError) {
    return undefined
  }
  if (positionQuery.isSuccess && !positionQuery.isPlaceholderData) {
    return getEarnPositionInfo(positionQuery.data?.position)
  }
  return prefetchedPosition
}
