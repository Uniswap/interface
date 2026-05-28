import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Input, styled, Text, Tooltip } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { logger } from 'utilities/src/logger/logger'
import { formatUnits, parseUnits } from 'viem'

import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import {
  computeBorrowAssets,
  computeHealthFactor,
  computeLiquidationPrice,
  computeMaxBorrowable,
  computeMaxWithdrawableCollateral,
  computeSupplyAssets,
  getHealthColor,
  type HealthColor,
} from 'pages/Markets/data/morphoPricing'
import { useMorphoUserPosition, useMorphoVaultUserPosition } from 'pages/Markets/data/morphoReads'
import { getMorphoAddressForMarket } from 'pages/Markets/data/registry'
import { Eyebrow, Label, SectionCard } from 'pages/Markets/detailLayout'
import { getMorphoAssetAdapter } from 'pages/Markets/protocol/morpho/adapters'
import { useMorphoActionFlows } from 'pages/Markets/protocol/morpho/useMorphoActionFlows'
import type { LendingMarketDetailEntity, LendingVaultDetailEntity } from 'pages/Markets/types'
import { useNativeTokenPercentageBufferExperiment } from 'pages/Pool/Positions/create/hooks/useNativeTokenPercentageBufferExperiment'
import { usePendingTransactions } from 'state/transactions/hooks'
import { TransactionType, type PendingTransactionDetails } from 'state/transactions/types'
import { PresetAmountButton } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/PresetAmountButton'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/useMaxAmountSpend'
import { applyNativeTokenPercentageBuffer } from 'uniswap/src/features/gas/utils'
import { useOnChainCurrencyBalance } from 'uniswap/src/features/portfolio/api'
import { CurrencyField } from 'uniswap/src/types/currency'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

const ActionPanel = styled(Flex, {
  gap: '$spacing24',
  p: '$spacing28',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded28',
  backgroundColor: '$surface1',
})

const ActionHeader = styled(Flex, {
  gap: '$spacing10',
})

const PanelEyebrow = styled(Eyebrow, {
  color: '$accent1',
})

const ActionTabs = styled(Flex, {
  row: true,
  gap: '$spacing8',
  flexWrap: 'nowrap',
  p: '$spacing4',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded24',
  backgroundColor: '$surface2',
  overflow: 'hidden',
})

const InputPanel = styled(Flex, {
  gap: '$spacing10',
  p: '$spacing18',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded24',
  backgroundColor: '$surface2',
})

const SubmitButton = styled(Button, {
  minHeight: 48,
  borderRadius: '$roundedFull',
})

const StatGrid = styled(Flex, {
  row: true,
  flexWrap: 'wrap',
  gap: '$spacing16',
})

const StatCard = styled(Flex, {
  gap: '$spacing8',
  flex: 1,
  flexBasis: 0,
  minWidth: 0,
  p: '$spacing16',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded20',
  backgroundColor: '$surface2',
  overflow: 'hidden',
})

const AmountHint = styled(Text, {
  variant: 'body4',
  color: '$neutral3',
})

const InputErrorText = styled(Text, {
  variant: 'body4',
  color: '$statusCritical',
})

const SafetyHint = styled(Text, {
  variant: 'body4',
  color: '$neutral3',
  fontSize: 11,
})

const PositionSection = styled(Flex, {
  gap: '$spacing8',
  p: '$spacing16',
  borderWidth: 1,
  borderColor: '$surface3',
  borderRadius: '$rounded20',
  backgroundColor: '$surface2',
})

const PositionRow = styled(Flex, {
  row: true,
  justifyContent: 'space-between',
  alignItems: 'center',
})

function formatTokenAmount(value: bigint, decimals: number): string {
  const num = Number(formatUnits(value, decimals))
  if (num === 0) {
    return '0'
  }
  if (num < 0.0001) {
    return '<0.0001'
  }
  return num.toLocaleString(undefined, { maximumFractionDigits: 4 })
}

const InputHeaderRow = styled(Flex, {
  row: true,
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '$spacing12',
})

const AmountInput = styled(Input, {
  backgroundColor: 'transparent',
  borderColor: 'transparent',
  borderWidth: 0,
  borderRadius: 0,
  height: 60,
  px: 0,
  outlineWidth: 0,
  focusStyle: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    outlineWidth: 0,
  },
  '$platform-web': {
    boxShadow: 'none',
  },
})

const ActionTab = styled(Flex, {
  flex: 1,
  minHeight: 44,
  px: '$spacing14',
  py: '$spacing10',
  borderRadius: '$roundedFull',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  variants: {
    active: {
      true: {
        backgroundColor: '$surface1',
      },
    },
  } as const,
})

function ActionModeButton({
  label,
  active,
  onPress,
  isDisabled,
}: {
  label: string
  active: boolean
  onPress: () => void
  isDisabled?: boolean
}) {
  return (
    <ActionTab active={active} onPress={isDisabled ? undefined : onPress} opacity={isDisabled ? 0.5 : 1}>
      <Text variant="buttonLabel3" color={active ? '$neutral1' : '$neutral3'}>
        {label}
      </Text>
    </ActionTab>
  )
}

const HEALTH_COLOR_MAP: Record<HealthColor, string> = {
  green: '$statusSuccess',
  yellow: '$DEP_accentWarning',
  red: '$statusCritical',
}

const HealthBarTrack = styled(Flex, {
  height: 10,
  borderRadius: '$roundedFull',
  backgroundColor: '$surface3',
  overflow: 'hidden',
})

export function HealthFactorBar({ market }: { market: LendingMarketDetailEntity }) {
  const { t } = useTranslation()
  const morphoAddress = getMorphoAddressForMarket(market.id)
  const position = useMorphoUserPosition(morphoAddress, market.marketId, market.chainId)

  const health = useMemo(() => {
    if (!position || !market.oraclePriceRaw) {
      return null
    }

    return computeHealthFactor({
      collateral: position.collateral,
      borrowShares: position.borrowShares,
      totalBorrowAssets: position.totalBorrowAssets,
      totalBorrowShares: position.totalBorrowShares,
      oraclePrice: market.oraclePriceRaw,
      lltv: market.lltvRaw,
      collateralDecimals: market.collateralAsset.decimals,
      loanDecimals: market.loanAsset.decimals,
    })
  }, [market, position])

  if (!health || !health.hasPosition) {
    return null
  }

  const color = getHealthColor(health.usagePercent)
  const tokenColor = HEALTH_COLOR_MAP[color]
  const statusLabel =
    color === 'green'
      ? t('common.healthFactor.safe')
      : color === 'yellow'
        ? t('common.healthFactor.atRisk')
        : t('common.healthFactor.liquidatable')
  const valueLabel = health.hasDebt ? health.healthFactor.toFixed(2) : '∞'

  return (
    <SectionCard>
      <Flex row justifyContent="space-between" alignItems="center">
        <Flex gap="$spacing4">
          <Eyebrow>{t('common.healthFactor')}</Eyebrow>
          <Text variant="body2" fontWeight="600">
            {valueLabel}
          </Text>
        </Flex>
        <Text variant="body2" color={tokenColor} fontWeight="600">
          {statusLabel}
        </Text>
      </Flex>
      <HealthBarTrack>
        <Flex
          height="100%"
          borderRadius="$roundedFull"
          backgroundColor={tokenColor}
          width={`${Math.max(health.hasDebt ? 2 : 0, health.usagePercent)}%`}
        />
      </HealthBarTrack>
    </SectionCard>
  )
}

function buildMorphoAssetAmounts(amount: string, assetKey: string) {
  const adapter = getMorphoAssetAdapter(assetKey as never)

  return {
    adapter,
    amounts: {
      underlyingAmount: parseUnits(amount, adapter.underlying.decimals),
      protocolAmount: parseUnits(amount, adapter.protocol.decimals),
    },
  }
}

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase())
}

function getPendingActionLabel(
  action: 'supply' | 'borrow' | 'repay' | 'withdraw' | 'deposit' | 'redeem',
  t: ReturnType<typeof useTranslation>['t'],
): string {
  switch (action) {
    case 'supply':
      return t('common.supplying')
    case 'borrow':
      return t('common.borrowing')
    case 'repay':
      return t('common.repaying')
    case 'withdraw':
      return t('common.withdrawing')
    case 'deposit':
      return t('common.depositing')
    case 'redeem':
      return t('common.redeeming')
  }

  return t('common.submitting')
}

function getPendingApprovalLabel(t: ReturnType<typeof useTranslation>['t']) {
  return t('common.approving')
}

function getPendingAuthorizationLabel(t: ReturnType<typeof useTranslation>['t']) {
  return t('common.authorizing')
}

function getMarketPendingLabel(
  pendingTransactions: PendingTransactionDetails[],
  action: 'supply' | 'borrow' | 'repay' | 'withdraw',
  marketId: string,
  routerAddress: string,
  collateralTokenAddress: string,
  loanTokenAddress: string,
  t: ReturnType<typeof useTranslation>['t'],
): string | null {
  const approvalTokenAddress =
    action === 'supply' ? collateralTokenAddress : action === 'repay' ? loanTokenAddress : undefined
  if (
    approvalTokenAddress &&
    pendingTransactions.some(
      (tx) =>
        tx.info.type === TransactionType.APPROVAL &&
        sameAddress(tx.info.spender, routerAddress) &&
        sameAddress(tx.info.tokenAddress, approvalTokenAddress),
    )
  ) {
    return getPendingApprovalLabel(t)
  }

  if (
    pendingTransactions.some(
      (tx) =>
        tx.info.type === TransactionType.MORPHO_AUTHORIZATION && sameAddress(tx.info.targetAddress, routerAddress),
    )
  ) {
    return getPendingAuthorizationLabel(t)
  }

  if (
    pendingTransactions.some((tx) => {
      if (action === 'supply') {
        return tx.info.type === TransactionType.MORPHO_SUPPLY && 'marketId' in tx.info && tx.info.marketId === marketId
      }
      if (action === 'borrow') {
        return tx.info.type === TransactionType.BORROW && 'marketId' in tx.info && tx.info.marketId === marketId
      }
      if (action === 'repay') {
        return tx.info.type === TransactionType.REPAY && 'marketId' in tx.info && tx.info.marketId === marketId
      }
      return (
        tx.info.type === TransactionType.WITHDRAW_LIQUIDITY_STAKING &&
        'protocol' in tx.info &&
        tx.info.protocol === 'morpho-market' &&
        'marketId' in tx.info &&
        tx.info.marketId === marketId
      )
    })
  ) {
    return getPendingActionLabel(action, t)
  }

  return null
}

function getVaultPendingLabel(
  pendingTransactions: PendingTransactionDetails[],
  action: 'deposit' | 'withdraw' | 'redeem',
  vaultAddress: string,
  routerAddress: string,
  assetAddress: string,
  t: ReturnType<typeof useTranslation>['t'],
): string | null {
  const approvalTokenAddress = action === 'deposit' ? assetAddress : vaultAddress
  if (
    pendingTransactions.some(
      (tx) =>
        tx.info.type === TransactionType.APPROVAL &&
        sameAddress(tx.info.spender, routerAddress) &&
        sameAddress(tx.info.tokenAddress, approvalTokenAddress),
    )
  ) {
    return getPendingApprovalLabel(t)
  }

  if (
    pendingTransactions.some((tx) => {
      if (action === 'deposit') {
        return (
          tx.info.type === TransactionType.DEPOSIT_LIQUIDITY_STAKING &&
          'protocol' in tx.info &&
          tx.info.protocol === 'morpho-vault' &&
          'vaultAddress' in tx.info &&
          sameAddress(tx.info.vaultAddress, vaultAddress)
        )
      }
      if (action === 'withdraw') {
        return (
          tx.info.type === TransactionType.WITHDRAW_LIQUIDITY_STAKING &&
          'protocol' in tx.info &&
          tx.info.protocol === 'morpho-vault' &&
          'vaultAddress' in tx.info &&
          sameAddress(tx.info.vaultAddress, vaultAddress)
        )
      }
      return tx.info.type === TransactionType.MORPHO_REDEEM && sameAddress(tx.info.vaultAddress, vaultAddress)
    })
  ) {
    return getPendingActionLabel(action, t)
  }

  return null
}

export function MarketActionPanel({ market }: { market: LendingMarketDetailEntity }) {
  const { t } = useTranslation()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const morpho = useMorphoActionFlows(market.chainId)
  const pendingTransactions = usePendingTransactions()
  const { formatCurrencyAmount } = useFormatter()
  const bufferPercentage = useNativeTokenPercentageBufferExperiment()
  const [action, setAction] = useState<'supply' | 'borrow' | 'repay' | 'withdraw'>('supply')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const execution = market.morphoExecution
  const morphoAddress = getMorphoAddressForMarket(market.id)
  const userPosition = useMorphoUserPosition(morphoAddress, market.marketId, market.chainId)
  const collateralAdapter = execution ? getMorphoAssetAdapter(execution.collateralAssetKey as never) : undefined
  const loanAdapter = execution ? getMorphoAssetAdapter(execution.loanAssetKey as never) : undefined
  const collateralCurrency = useCurrency(collateralAdapter?.underlying.address, market.chainId)
  const loanCurrency = useCurrency(loanAdapter?.underlying.address, market.chainId)
  const selectedCurrency = action === 'supply' || action === 'withdraw' ? collateralCurrency : loanCurrency
  const spendCurrency = action === 'supply' ? collateralCurrency : action === 'repay' ? loanCurrency : undefined
  const spendTokenSymbol =
    action === 'supply'
      ? collateralAdapter?.underlying.symbol
      : action === 'repay'
        ? loanAdapter?.underlying.symbol
        : undefined
  const parsedAmount = tryParseCurrencyAmount(amount, selectedCurrency)
  const { balance: spendBalance } = useOnChainCurrencyBalance(spendCurrency, account.address)
  const spendBalanceWithBuffer = useMemo(
    () => applyNativeTokenPercentageBuffer(spendBalance, bufferPercentage),
    [bufferPercentage, spendBalance],
  )
  const maxSpendAmount = useMaxAmountSpend({ currencyAmount: spendBalanceWithBuffer })
  const insufficientBalanceError = useMemo(() => {
    if (!parsedAmount || !spendCurrency || !spendTokenSymbol) {
      return undefined
    }

    if (maxSpendAmount?.lessThan(parsedAmount)) {
      return t('common.insufficientTokenBalance.error', { tokenSymbol: spendTokenSymbol })
    }

    return undefined
  }, [maxSpendAmount, parsedAmount, spendCurrency, spendTokenSymbol, t])
  const inputError = !parsedAmount ? t('common.noAmount.error') : insufficientBalanceError
  const formattedSpendBalance = formatCurrencyAmount({
    amount: spendBalanceWithBuffer,
    type: NumberType.TokenNonTx,
  })
  const positionCollateral = userPosition?.collateral ?? 0n
  const positionSupplyAssets = userPosition ? computeSupplyAssets(userPosition) : 0n
  const positionBorrowAssets = userPosition ? computeBorrowAssets(userPosition) : 0n
  const hasPosition = account.address && userPosition && (positionCollateral > 0n || positionBorrowAssets > 0n)

  const oraclePriceRaw = market.oraclePriceRaw ?? 0n
  const lltvRaw = market.lltvRaw

  const maxWithdrawCollateral = useMemo(() => {
    if (!userPosition || oraclePriceRaw === 0n) {
      return 0n
    }
    return computeMaxWithdrawableCollateral({
      collateral: positionCollateral,
      borrowShares: userPosition.borrowShares,
      totalBorrowAssets: userPosition.totalBorrowAssets,
      totalBorrowShares: userPosition.totalBorrowShares,
      oraclePrice: oraclePriceRaw,
      lltv: lltvRaw,
    })
  }, [userPosition, positionCollateral, oraclePriceRaw, lltvRaw])

  const maxBorrowable = useMemo(() => {
    if (!userPosition || oraclePriceRaw === 0n) {
      return 0n
    }
    return computeMaxBorrowable({
      collateral: positionCollateral,
      borrowShares: userPosition.borrowShares,
      totalBorrowAssets: userPosition.totalBorrowAssets,
      totalBorrowShares: userPosition.totalBorrowShares,
      totalSupplyAssets: userPosition.totalSupplyAssets,
      oraclePrice: oraclePriceRaw,
      lltv: lltvRaw,
    })
  }, [userPosition, positionCollateral, oraclePriceRaw, lltvRaw])

  const postActionHealth = useMemo(() => {
    if (!userPosition || oraclePriceRaw === 0n || !amount.trim()) {
      return null
    }
    const collateralDecimals = market.collateralAsset.decimals
    const loanDecimals = market.loanAsset.decimals
    try {
      let nextCollateral = positionCollateral
      let nextBorrowShares = userPosition.borrowShares
      const nextTotalBorrowAssets = userPosition.totalBorrowAssets
      const nextTotalBorrowShares = userPosition.totalBorrowShares

      if (action === 'supply') {
        nextCollateral = positionCollateral + parseUnits(amount.trim(), collateralDecimals)
      } else if (action === 'withdraw') {
        const w = parseUnits(amount.trim(), collateralDecimals)
        nextCollateral = positionCollateral > w ? positionCollateral - w : 0n
      } else if (action === 'borrow') {
        const borrowAmt = parseUnits(amount.trim(), loanDecimals)
        const extraShares =
          nextTotalBorrowAssets > 0n
            ? (borrowAmt * (nextTotalBorrowShares + 1_000_000n)) / (nextTotalBorrowAssets + 1n)
            : borrowAmt * 1_000_000n
        nextBorrowShares = userPosition.borrowShares + extraShares
      } else if (action === 'repay') {
        const repayAmt = parseUnits(amount.trim(), loanDecimals)
        const repayShares =
          nextTotalBorrowAssets > 0n
            ? (repayAmt * (nextTotalBorrowShares + 1_000_000n)) / (nextTotalBorrowAssets + 1n)
            : 0n
        nextBorrowShares = userPosition.borrowShares > repayShares ? userPosition.borrowShares - repayShares : 0n
      }

      return computeHealthFactor({
        collateral: nextCollateral,
        borrowShares: nextBorrowShares,
        totalBorrowAssets: nextTotalBorrowAssets,
        totalBorrowShares: nextTotalBorrowShares,
        oraclePrice: oraclePriceRaw,
        lltv: lltvRaw,
        collateralDecimals,
        loanDecimals,
      })
    } catch {
      return null
    }
  }, [userPosition, positionCollateral, oraclePriceRaw, lltvRaw, amount, action, market])

  const liquidationPrice = useMemo(() => {
    if (!userPosition || oraclePriceRaw === 0n || positionBorrowAssets === 0n) {
      return null
    }
    return computeLiquidationPrice({
      collateral: positionCollateral,
      borrowShares: userPosition.borrowShares,
      totalBorrowAssets: userPosition.totalBorrowAssets,
      totalBorrowShares: userPosition.totalBorrowShares,
      lltv: lltvRaw,
      collateralDecimals: market.collateralAsset.decimals,
      loanDecimals: market.loanAsset.decimals,
    })
  }, [userPosition, positionCollateral, positionBorrowAssets, oraclePriceRaw, lltvRaw, market])

  const handleSetMax = (nextAmount: string) => {
    if (!nextAmount) {
      return
    }

    setAmount(nextAmount)
  }

  if (!execution) {
    return (
      <ActionPanel>
        <PanelEyebrow>{market.chainLabel}</PanelEyebrow>
        <Text variant="subheading1">{t('common.supply')}</Text>
        <Label>{t('common.liveMarketActionsPending')}</Label>
      </ActionPanel>
    )
  }

  const ensuredCollateralAdapter = collateralAdapter!
  const ensuredLoanAdapter = loanAdapter!
  const collateralDecimals = ensuredCollateralAdapter.underlying.decimals
  const loanDecimals = ensuredLoanAdapter.underlying.decimals

  const routerAddress = morpho.execution?.routerAddress
  const actionLabel =
    action === 'supply'
      ? t('common.supply')
      : action === 'borrow'
        ? t('common.borrow')
        : action === 'repay'
          ? t('common.repay')
          : t('common.withdraw')
  const selectedRate = action === 'borrow' ? market.borrowApy : market.supplyApy
  const pendingLabel = routerAddress
    ? getMarketPendingLabel(
        pendingTransactions,
        action,
        execution.marketId,
        routerAddress,
        ensuredCollateralAdapter.underlying.address,
        ensuredLoanAdapter.underlying.address,
        t,
      )
    : null
  const submitLabel =
    isSubmitting || pendingLabel
      ? pendingLabel ?? morpho.status ?? getPendingActionLabel(action, t)
      : inputError ?? t('common.button.confirm')

  const submit = async (nextAction: typeof action = action) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      morpho.setStatus(null)
      const normalizedAmount = amount.trim()
      const nextActionAssetKey =
        nextAction === 'supply' || nextAction === 'withdraw' ? execution.collateralAssetKey : execution.loanAssetKey
      const { amounts } = buildMorphoAssetAmounts(normalizedAmount, nextActionAssetKey)

      await (nextAction === 'supply'
        ? await morpho.runSupplyCollateral(
            execution.marketId,
            execution.collateralAssetKey as never,
            execution.loanAssetKey as never,
            amounts,
          )
        : nextAction === 'borrow'
          ? await morpho.runBorrow(
              execution.marketId,
              execution.collateralAssetKey as never,
              execution.loanAssetKey as never,
              amounts,
            )
          : nextAction === 'repay'
            ? await morpho.runRepay(
                execution.marketId,
                execution.collateralAssetKey as never,
                execution.loanAssetKey as never,
                amounts,
              )
            : await morpho.runWithdrawCollateral(
                execution.marketId,
                execution.collateralAssetKey as never,
                execution.loanAssetKey as never,
                amounts,
              ))
      setAmount('')
    } catch (error) {
      if (!didUserReject(error)) {
        const message = error instanceof Error ? error.message : String(error)
        setSubmitError(message.length > 120 ? `${message.slice(0, 120)}…` : message)
        logger.warn('Markets', 'MarketActionPanel', 'Failed to submit lending market action', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActionPress = (nextAction: typeof action) => {
    setAction(nextAction)
  }

  return (
    <ActionPanel>
      <ActionHeader>
        <PanelEyebrow>{market.chainLabel}</PanelEyebrow>
        <Text variant="subheading1">{actionLabel}</Text>
        <Label>
          {market.loanAsset.symbol} / {market.collateralAsset.symbol}
        </Label>
      </ActionHeader>

      <ActionTabs>
        <ActionModeButton
          label={t('common.supply')}
          active={action === 'supply'}
          onPress={() => handleActionPress('supply')}
          isDisabled={isSubmitting || Boolean(pendingLabel)}
        />
        <ActionModeButton
          label={t('common.borrow')}
          active={action === 'borrow'}
          onPress={() => handleActionPress('borrow')}
          isDisabled={isSubmitting || Boolean(pendingLabel)}
        />
        <ActionModeButton
          label={t('common.repay')}
          active={action === 'repay'}
          onPress={() => handleActionPress('repay')}
          isDisabled={isSubmitting || Boolean(pendingLabel)}
        />
        <ActionModeButton
          label={t('common.withdraw')}
          active={action === 'withdraw'}
          onPress={() => handleActionPress('withdraw')}
          isDisabled={isSubmitting || Boolean(pendingLabel)}
        />
      </ActionTabs>

      <StatGrid>
        <StatCard>
          <Label>{t('common.apy')}</Label>
          <Text variant="body3" color={action === 'borrow' ? '$neutral1' : '$accent1'}>
            {`${(selectedRate * 100).toFixed(2)}%`}
          </Text>
        </StatCard>
        <StatCard>
          <Label>LLTV</Label>
          <Text variant="body3">{`${(market.lltv * 100).toFixed(0)}%`}</Text>
        </StatCard>
      </StatGrid>

      {hasPosition ? (
        <PositionSection>
          <AmountHint>{t('common.yourPosition')}</AmountHint>
          <PositionRow>
            <Label>{t('common.collateral')}</Label>
            <Text variant="body4">{`${formatTokenAmount(positionCollateral, collateralDecimals)} ${ensuredCollateralAdapter.underlying.symbol}`}</Text>
          </PositionRow>
          {positionSupplyAssets > 0n ? (
            <PositionRow>
              <Label>{t('common.supplied')}</Label>
              <Text variant="body4">{`${formatTokenAmount(positionSupplyAssets, loanDecimals)} ${ensuredLoanAdapter.underlying.symbol}`}</Text>
            </PositionRow>
          ) : null}
          <PositionRow>
            <Label>{t('common.borrowed')}</Label>
            <Text variant="body4">{`${formatTokenAmount(positionBorrowAssets, loanDecimals)} ${ensuredLoanAdapter.underlying.symbol}`}</Text>
          </PositionRow>
          <PositionRow>
            <Label>{t('common.maxBorrowable')}</Label>
            <Text variant="body4">{`${formatTokenAmount(maxBorrowable, loanDecimals)} ${ensuredLoanAdapter.underlying.symbol}`}</Text>
          </PositionRow>
          <PositionRow>
            <Label>{t('common.maxWithdrawable')}</Label>
            <Text variant="body4">{`${formatTokenAmount(maxWithdrawCollateral, collateralDecimals)} ${ensuredCollateralAdapter.underlying.symbol}`}</Text>
          </PositionRow>
          {liquidationPrice !== null ? (
            <PositionRow>
              <Flex row alignItems="center" gap="$spacing4">
                <Label>{t('common.liquidationPrice')}</Label>
                <Tooltip placement="top">
                  <Tooltip.Trigger>
                    <InfoCircleFilled color="$neutral3" size={12} />
                  </Tooltip.Trigger>
                  <Tooltip.Content>
                    <Tooltip.Arrow />
                    <Text variant="body4">{t('common.liquidationPrice.tooltip')}</Text>
                  </Tooltip.Content>
                </Tooltip>
              </Flex>
              <Text variant="body4" color="$statusCritical">
                {`≈ ${liquidationPrice.toFixed(4)} ${ensuredLoanAdapter.underlying.symbol}`}
              </Text>
            </PositionRow>
          ) : null}
        </PositionSection>
      ) : null}

      <InputPanel>
        <InputHeaderRow>
          <AmountHint>{actionLabel}</AmountHint>
          {action === 'supply' && spendBalanceWithBuffer ? (
            <PresetAmountButton
              percentage={100}
              currencyField={CurrencyField.INPUT}
              currencyAmount={parsedAmount}
              currencyBalance={spendBalanceWithBuffer}
              onSetPresetValue={handleSetMax}
            />
          ) : null}
          {action === 'withdraw' && account.address && maxWithdrawCollateral > 0n ? (
            <AmountHint
              cursor="pointer"
              onPress={() => setAmount(formatUnits(maxWithdrawCollateral, collateralDecimals))}
            >
              Max
            </AmountHint>
          ) : null}
          {action === 'repay' && account.address && positionBorrowAssets > 0n ? (
            <AmountHint cursor="pointer" onPress={() => setAmount(formatUnits(positionBorrowAssets, loanDecimals))}>
              Max
            </AmountHint>
          ) : null}
          {action === 'borrow' && account.address && maxBorrowable > 0n ? (
            <AmountHint cursor="pointer" onPress={() => setAmount(formatUnits(maxBorrowable, loanDecimals))}>
              Max
            </AmountHint>
          ) : null}
        </InputHeaderRow>
        <AmountInput value={amount} onChangeText={setAmount} placeholder="0.0" placeholderTextColor="$neutral3" />
        {account.address && action === 'supply' && spendTokenSymbol && spendBalanceWithBuffer ? (
          <AmountHint>{`Balance: ${formattedSpendBalance} ${spendTokenSymbol}`}</AmountHint>
        ) : null}
        {account.address && action === 'repay' && spendBalanceWithBuffer ? (
          <AmountHint>{`Balance: ${formattedSpendBalance} ${ensuredLoanAdapter.underlying.symbol}`}</AmountHint>
        ) : null}
      </InputPanel>
      {postActionHealth && postActionHealth.hasDebt ? (
        <Flex row justifyContent="space-between" alignItems="center">
          <SafetyHint>{t('common.healthFactor.postAction')}</SafetyHint>
          <Text
            variant="body4"
            color={
              getHealthColor(postActionHealth.usagePercent) === 'green'
                ? '$statusSuccess'
                : getHealthColor(postActionHealth.usagePercent) === 'yellow'
                  ? '$statusWarning'
                  : '$statusCritical'
            }
          >
            {postActionHealth.healthFactor === Infinity ? '∞' : postActionHealth.healthFactor.toFixed(2)}
          </Text>
        </Flex>
      ) : null}
      {(action === 'borrow' || action === 'withdraw') && hasPosition ? (
        <SafetyHint>{t('common.safetyMarginHint')}</SafetyHint>
      ) : null}
      {insufficientBalanceError ? <InputErrorText>{insufficientBalanceError}</InputErrorText> : null}
      {submitError ? <InputErrorText>{submitError}</InputErrorText> : null}
      {account.isConnected ? (
        <SubmitButton
          size="small"
          variant="branded"
          emphasis="primary"
          onPress={() => void submit()}
          isDisabled={isSubmitting || Boolean(pendingLabel) || Boolean(inputError)}
        >
          <Text variant="buttonLabel3" color="$white">
            {submitLabel}
          </Text>
        </SubmitButton>
      ) : (
        <SubmitButton size="small" variant="branded" emphasis="primary" onPress={accountDrawer.open}>
          <Text variant="buttonLabel3" color="$white">
            {t('common.connectWallet.button')}
          </Text>
        </SubmitButton>
      )}
    </ActionPanel>
  )
}

export function VaultActionPanel({ vault }: { vault: LendingVaultDetailEntity }) {
  const { t } = useTranslation()
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const pendingTransactions = usePendingTransactions()
  const morpho = useMorphoActionFlows(vault.chainId)
  const { formatCurrencyAmount } = useFormatter()
  const bufferPercentage = useNativeTokenPercentageBufferExperiment()
  const [action, setAction] = useState<'deposit' | 'withdraw' | 'redeem'>('deposit')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const execution = vault.morphoExecution
  const vaultUserPosition = useMorphoVaultUserPosition(
    execution?.vaultAddress as `0x${string}` | undefined,
    vault.chainId,
  )
  const assetAdapter = execution ? getMorphoAssetAdapter(execution.assetKey as never) : undefined
  const assetCurrency = useCurrency(assetAdapter?.underlying.address, vault.chainId)
  const parsedAmount = tryParseCurrencyAmount(amount, assetCurrency)
  const spendCurrency = action === 'deposit' ? assetCurrency : undefined
  const { balance: spendBalance } = useOnChainCurrencyBalance(spendCurrency, account.address)
  const spendBalanceWithBuffer = useMemo(
    () => applyNativeTokenPercentageBuffer(spendBalance, bufferPercentage),
    [bufferPercentage, spendBalance],
  )
  const maxSpendAmount = useMaxAmountSpend({ currencyAmount: spendBalanceWithBuffer })
  const insufficientBalanceError = useMemo(() => {
    if (!parsedAmount || !spendCurrency || !assetAdapter) {
      return undefined
    }

    if (maxSpendAmount?.lessThan(parsedAmount)) {
      return t('common.insufficientTokenBalance.error', { tokenSymbol: assetAdapter.underlying.symbol })
    }

    return undefined
  }, [assetAdapter, maxSpendAmount, parsedAmount, spendCurrency, t])
  const inputError = !parsedAmount ? t('common.noAmount.error') : insufficientBalanceError
  const formattedSpendBalance = formatCurrencyAmount({
    amount: spendBalanceWithBuffer,
    type: NumberType.TokenNonTx,
  })
  const vaultShares = vaultUserPosition?.shares ?? 0n
  const vaultRedeemableAssets = vaultUserPosition?.assets ?? 0n
  const vaultMaxWithdrawAssets = useMemo(() => {
    const raw = vaultUserPosition?.maxWithdrawAssets ?? 0n
    return (raw * 995n) / 1000n
  }, [vaultUserPosition?.maxWithdrawAssets])
  const vaultMaxRedeemShares = useMemo(() => {
    const raw = vaultUserPosition?.maxRedeemShares ?? 0n
    return (raw * 995n) / 1000n
  }, [vaultUserPosition?.maxRedeemShares])
  const hasVaultPosition = account.address && vaultUserPosition && vaultShares > 0n

  const handleSetMax = (nextAmount: string) => {
    if (!nextAmount) {
      return
    }

    setAmount(nextAmount)
  }

  if (!execution) {
    return (
      <ActionPanel>
        <PanelEyebrow>{vault.chainLabel}</PanelEyebrow>
        <Text variant="subheading1">{t('common.deposit')}</Text>
        <Label>{t('common.liveVaultActionsPending')}</Label>
      </ActionPanel>
    )
  }

  const ensuredAssetAdapter = assetAdapter!
  const assetDecimals = ensuredAssetAdapter.underlying.decimals

  const routerAddress = morpho.execution?.routerAddress
  const actionLabel =
    action === 'deposit' ? t('common.deposit') : action === 'withdraw' ? t('common.withdraw') : t('common.redeem')
  const selectedRate = vault.apy
  const pendingLabel = routerAddress
    ? getVaultPendingLabel(
        pendingTransactions,
        action,
        execution.vaultAddress,
        routerAddress,
        ensuredAssetAdapter.underlying.address,
        t,
      )
    : null
  const submitLabel =
    isSubmitting || pendingLabel
      ? pendingLabel ?? morpho.status ?? getPendingActionLabel(action, t)
      : inputError ?? t('common.button.confirm')

  const submit = async (nextAction: typeof action = action) => {
    try {
      setIsSubmitting(true)
      setSubmitError(null)
      morpho.setStatus(null)
      const normalizedAmount = amount.trim()
      const { amounts } = buildMorphoAssetAmounts(normalizedAmount, execution.assetKey)
      const vaultContract = morpho.getVaultContract?.(execution.vaultAddress)
      const requiredShareAllowance =
        nextAction === 'withdraw' && vaultContract
          ? ((await vaultContract.previewWithdraw(amounts.protocolAmount)) as bigint) ?? undefined
          : undefined

      await (nextAction === 'deposit'
        ? await morpho.runVaultDeposit(execution.vaultAddress, execution.assetKey as never, amounts)
        : nextAction === 'withdraw'
          ? await morpho.runVaultWithdraw(
              execution.vaultAddress,
              execution.assetKey as never,
              amounts,
              requiredShareAllowance,
            )
          : await morpho.runVaultRedeem(execution.vaultAddress, execution.assetKey as never, amounts.protocolAmount))
      setAmount('')
    } catch (error) {
      if (!didUserReject(error)) {
        const message = error instanceof Error ? error.message : String(error)
        setSubmitError(message.length > 120 ? `${message.slice(0, 120)}…` : message)
        logger.warn('Markets', 'VaultActionPanel', 'Failed to submit lending vault action', error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleActionPress = (nextAction: typeof action) => {
    setAction(nextAction)
  }

  return (
    <ActionPanel>
      <ActionHeader>
        <PanelEyebrow>{vault.chainLabel}</PanelEyebrow>
        <Text variant="subheading1">{actionLabel}</Text>
        <Label>{vault.title}</Label>
      </ActionHeader>

      <ActionTabs>
        <ActionModeButton
          label={t('common.deposit')}
          active={action === 'deposit'}
          onPress={() => handleActionPress('deposit')}
          isDisabled={isSubmitting || Boolean(pendingLabel)}
        />
        <ActionModeButton
          label={t('common.withdraw')}
          active={action === 'withdraw'}
          onPress={() => handleActionPress('withdraw')}
          isDisabled={isSubmitting || Boolean(pendingLabel)}
        />
        <ActionModeButton
          label={t('common.redeem')}
          active={action === 'redeem'}
          onPress={() => handleActionPress('redeem')}
          isDisabled={isSubmitting || Boolean(pendingLabel)}
        />
      </ActionTabs>

      <StatGrid>
        <StatCard>
          <Label>{t('common.netApy')}</Label>
          <Text variant="body3" color="$accent1">
            {`${(selectedRate * 100).toFixed(2)}%`}
          </Text>
        </StatCard>
        <StatCard>
          <Label>{t('common.fee')}</Label>
          <Text variant="body3">{`${(vault.feeRate * 100).toFixed(2)}%`}</Text>
        </StatCard>
      </StatGrid>

      {hasVaultPosition ? (
        <PositionSection>
          <AmountHint>{t('common.yourPosition')}</AmountHint>
          <PositionRow>
            <Label>{t('common.shares')}</Label>
            <Text variant="body4">{formatTokenAmount(vaultShares, assetDecimals)}</Text>
          </PositionRow>
          <PositionRow>
            <Label>{t('common.redeemable')}</Label>
            <Text variant="body4">{`${formatTokenAmount(vaultRedeemableAssets, assetDecimals)} ${ensuredAssetAdapter.underlying.symbol}`}</Text>
          </PositionRow>
          <PositionRow>
            <Label>{t('common.maxWithdrawable')}</Label>
            <Text variant="body4">{`${formatTokenAmount(vaultMaxWithdrawAssets, assetDecimals)} ${ensuredAssetAdapter.underlying.symbol}`}</Text>
          </PositionRow>
        </PositionSection>
      ) : null}

      <InputPanel>
        <InputHeaderRow>
          <AmountHint>{action === 'redeem' ? `${actionLabel} (${t('common.shares')})` : actionLabel}</AmountHint>
          {action === 'deposit' && spendBalanceWithBuffer ? (
            <PresetAmountButton
              percentage={100}
              currencyField={CurrencyField.INPUT}
              currencyAmount={parsedAmount}
              currencyBalance={spendBalanceWithBuffer}
              onSetPresetValue={handleSetMax}
            />
          ) : null}
          {action === 'withdraw' && account.address && vaultMaxWithdrawAssets > 0n ? (
            <AmountHint cursor="pointer" onPress={() => setAmount(formatUnits(vaultMaxWithdrawAssets, assetDecimals))}>
              Max
            </AmountHint>
          ) : null}
          {action === 'redeem' && account.address && vaultMaxRedeemShares > 0n ? (
            <AmountHint cursor="pointer" onPress={() => setAmount(formatUnits(vaultMaxRedeemShares, assetDecimals))}>
              Max
            </AmountHint>
          ) : null}
        </InputHeaderRow>
        <AmountInput value={amount} onChangeText={setAmount} placeholder="0.0" placeholderTextColor="$neutral3" />
        {account.address && action === 'deposit' && assetAdapter && spendBalanceWithBuffer ? (
          <AmountHint>{`Balance: ${formattedSpendBalance} ${assetAdapter.underlying.symbol}`}</AmountHint>
        ) : null}
        {action === 'redeem' && amount.trim() && vaultRedeemableAssets > 0n && vaultShares > 0n ? (
          <SafetyHint>{`≈ ${formatTokenAmount((parseUnits(amount.trim() || '0', assetDecimals) * vaultRedeemableAssets) / vaultShares, assetDecimals)} ${ensuredAssetAdapter.underlying.symbol}`}</SafetyHint>
        ) : null}
      </InputPanel>
      {(action === 'withdraw' || action === 'redeem') && hasVaultPosition ? (
        <SafetyHint>{t('common.safetyMarginHint')}</SafetyHint>
      ) : null}
      {insufficientBalanceError ? <InputErrorText>{insufficientBalanceError}</InputErrorText> : null}
      {submitError ? <InputErrorText>{submitError}</InputErrorText> : null}
      {account.isConnected ? (
        <SubmitButton
          size="small"
          variant="branded"
          emphasis="primary"
          onPress={() => void submit()}
          isDisabled={isSubmitting || Boolean(pendingLabel) || Boolean(inputError)}
        >
          <Text variant="buttonLabel3" color="$white">
            {submitLabel}
          </Text>
        </SubmitButton>
      ) : (
        <SubmitButton size="small" variant="branded" emphasis="primary" onPress={accountDrawer.open}>
          <Text variant="buttonLabel3" color="$white">
            {t('common.connectWallet.button')}
          </Text>
        </SubmitButton>
      )}
    </ActionPanel>
  )
}
