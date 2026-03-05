import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getTokenValue, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { RoundExclamation } from 'ui/src/components/icons/RoundExclamation'
import { Flex } from 'ui/src/components/layout/Flex'
import { SwapTypeTransactionInfo } from 'uniswap/src/components/activity/details/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getCurrencyAmount, ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { getAmountsFromTrade } from 'uniswap/src/features/transactions/swap/utils/getAmountsFromTrade'
import {
  ApproveTransactionInfo,
  BridgeTransactionInfo,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
  TransactionTypeInfo,
  WrapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  buildCurrencyId,
  buildNativeCurrencyId,
  buildWrappedNativeCurrencyId,
  currencyIdToChain,
} from 'uniswap/src/utils/currencyId'
import { openTransactionLink } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'

export const PLAN_STEP_ITEM_WIDTH = '$icon.20'

export function PlanStepItem({ transactionDetails }: { transactionDetails: TransactionDetails }): JSX.Element | null {
  const { typeInfo } = transactionDetails

  return (
    <Flex row centered justifyContent="space-between" gap="$spacing12" width="100%">
      {StepStatusIconMap[transactionDetails.status] ? (
        <Flex centered width={getTokenValue(PLAN_STEP_ITEM_WIDTH)}>
          {StepStatusIconMap[transactionDetails.status]}
        </Flex>
      ) : null}
      <Flex row grow flexShrink={1} alignItems="center" gap="$spacing8">
        <StepDescriptor info={typeInfo} chainId={transactionDetails.chainId} />
        <StepStatusBadge status={transactionDetails.status} />
      </Flex>
      {transactionDetails.hash && (
        <TouchableArea onPress={() => openTransactionLink(transactionDetails.hash, transactionDetails.chainId)}>
          <ExternalLink color="$neutral3" size={14} />
        </TouchableArea>
      )}
    </Flex>
  )
}

const StepStatusIconMap: { [key in TransactionStatus]?: React.ReactNode } = {
  [TransactionStatus.Success]: <CheckCircleFilled size="$icon.20" color="$statusSuccess" />,
  [TransactionStatus.Failed]: <RoundExclamation size="$icon.20" color="$statusCritical" />,
  [TransactionStatus.AwaitingAction]: <RoundExclamation size="$icon.18" color="$statusCritical" />,
  [TransactionStatus.Pending]: <SpinningLoader unstyled size={16} />,
  [TransactionStatus.Queued]: (
    <Flex
      width={15}
      height={15}
      borderRadius="$roundedFull"
      borderWidth="$spacing1"
      borderStyle="dashed"
      borderColor="$neutral3"
    />
  ),
}

function StepStatusBadge({ status }: { status: TransactionStatus }): JSX.Element | null {
  const { t } = useTranslation()

  if (status !== TransactionStatus.Failed && status !== TransactionStatus.AwaitingAction) {
    return null
  }

  const badgeTextMap = {
    [TransactionStatus.Failed]: t('common.failed'),
    [TransactionStatus.AwaitingAction]: t('transaction.status.plan.step.status.interrupted'),
  } as const

  const badgeContent = badgeTextMap[status]

  return (
    <Flex flexShrink={0} borderRadius="$rounded6" backgroundColor="$statusCritical2" p="$spacing4">
      <Text variant="buttonLabel4" color="$statusCritical">
        {badgeContent}
      </Text>
    </Flex>
  )
}

function useFormattedAmountsFromTypeInfo(info: SwapTypeTransactionInfo | BridgeTransactionInfo): {
  tokenInAmount: string
  tokenInSymbol: string
  tokenOutAmount: string
  tokenOutSymbol: string
} {
  const inputCurrencyInfo = useCurrencyInfo(info.inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(info.outputCurrencyId)
  const { formatCurrencyAmount } = useLocalizationContext()

  return useMemo(() => {
    if (!inputCurrencyInfo || !outputCurrencyInfo) {
      return {
        tokenInAmount: '',
        tokenOutAmount: '',
        tokenInSymbol: '',
        tokenOutSymbol: '',
      }
    }

    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = getAmountsFromTrade(info)

    const tokenInCurrencyAmount = getCurrencyAmount({
      value: inputCurrencyAmountRaw,
      valueType: ValueType.Raw,
      currency: inputCurrencyInfo.currency,
    })
    const tokenOutCurrencyAmount = getCurrencyAmount({
      value: outputCurrencyAmountRaw,
      valueType: ValueType.Raw,
      currency: outputCurrencyInfo.currency,
    })

    return {
      tokenInAmount: formatCurrencyAmount({ value: tokenInCurrencyAmount, type: NumberType.TokenTx }),
      tokenInSymbol: inputCurrencyInfo.currency.symbol ?? '',
      tokenOutAmount: formatCurrencyAmount({ value: tokenOutCurrencyAmount, type: NumberType.TokenTx }),
      tokenOutSymbol: outputCurrencyInfo.currency.symbol ?? '',
    }
  }, [info, inputCurrencyInfo, outputCurrencyInfo, formatCurrencyAmount])
}

function StepDescriptor({ info, chainId }: { info: TransactionTypeInfo; chainId: UniverseChainId }): JSX.Element {
  switch (info.type) {
    case TransactionType.Approve:
      return <ApproveStepDescriptor info={info} chainId={chainId} />
    case TransactionType.Swap:
      return <SwapStepDescriptor info={info} />
    case TransactionType.Bridge:
      return <BridgeStepDescriptor info={info} />
    case TransactionType.Wrap:
      return <WrapStepDescriptor info={info} chainId={chainId} />
    default:
      return <></>
  }
}

function ApproveStepDescriptor({
  info,
  chainId,
}: {
  info: ApproveTransactionInfo
  chainId: UniverseChainId
}): JSX.Element {
  const { t } = useTranslation()
  const symbol = useCurrencyInfo(buildCurrencyId(chainId, info.tokenAddress))?.currency.symbol ?? ''

  return (
    <Text variant="body3" flexShrink={1}>
      {t('common.approveSpend', { symbol })}
    </Text>
  )
}

function SwapStepDescriptor({ info }: { info: SwapTypeTransactionInfo }): JSX.Element {
  const { t } = useTranslation()

  const { tokenInAmount, tokenInSymbol, tokenOutAmount, tokenOutSymbol } = useFormattedAmountsFromTypeInfo(info)

  return (
    <Text variant="body3" flexShrink={1}>
      {t('transaction.status.plan.step.swap', {
        tokenInAmount,
        tokenInSymbol,
        tokenOutAmount,
        tokenOutSymbol,
      })}
    </Text>
  )
}

function BridgeStepDescriptor({ info }: { info: BridgeTransactionInfo }): JSX.Element {
  const { t } = useTranslation()

  const { tokenInAmount, tokenInSymbol } = useFormattedAmountsFromTypeInfo(info)

  const outputChainId = currencyIdToChain(info.outputCurrencyId)
  const chainLabel = outputChainId ? getChainInfo(outputChainId).label : ''

  return (
    <Text variant="body3" flexShrink={1}>
      {t('transaction.status.plan.step.bridge', {
        tokenInAmount,
        tokenInSymbol,
        destinationChain: chainLabel,
      })}
    </Text>
  )
}

function WrapStepDescriptor({ info, chainId }: { info: WrapTransactionInfo; chainId: UniverseChainId }): JSX.Element {
  const { t } = useTranslation()
  const nativeCurrencyInfo = useCurrencyInfo(buildNativeCurrencyId(chainId))
  const wrappedCurrencyInfo = useCurrencyInfo(buildWrappedNativeCurrencyId(chainId))
  const { formatCurrencyAmount } = useLocalizationContext()

  const currencyAmount = useMemo(() => {
    const currencyInfo = info.unwrapped ? nativeCurrencyInfo : wrappedCurrencyInfo

    if (!currencyInfo) {
      return null
    }

    return getCurrencyAmount({
      value: info.currencyAmountRaw,
      valueType: ValueType.Raw,
      currency: currencyInfo.currency,
    })
  }, [info.currencyAmountRaw, info.unwrapped, nativeCurrencyInfo, wrappedCurrencyInfo])

  return (
    <Text variant="body3" flexShrink={1}>
      {t('transaction.status.plan.step.wrap', {
        amount: formatCurrencyAmount({ value: currencyAmount }),
        symbol: currencyAmount?.currency.symbol ?? '',
      })}
    </Text>
  )
}
