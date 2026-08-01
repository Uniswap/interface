import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CrossChainIcon, SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { NotificationToast } from 'uniswap/src/components/notifications/NotificationToast'
import {
  getEarnPlanStatusTitleKeyFromTransactionStatus,
  getEarnPlanTransactionType,
} from 'uniswap/src/features/earn/planActivityTitles'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { BridgeTxNotification, PlanTxNotification } from 'uniswap/src/features/notifications/slice/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { CrossChainCurrencyRow } from 'uniswap/src/features/transactions/swap/components/CrossChainCurrencyRow'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getFormattedCurrencyAmount, getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { formBridgeNotificationTitle } from 'wallet/src/features/notifications/utils'
import { useCreateSwapFormState } from 'wallet/src/features/transactions/hooks/useCreateSwapFormState'

export function CrossChainNotification({
  notification,
}: {
  notification: BridgeTxNotification | PlanTxNotification
}): JSX.Element {
  const { t } = useTranslation()
  const formatter = useLocalizationContext()
  const { navigateToAccountActivityList, navigateToSwapFlow } = useWalletNavigation()

  const {
    chainId,
    txId,
    txStatus,
    inputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyId,
    outputCurrencyAmountRaw,
    address,
    hideDelay,
  } = notification

  const inputCurrencyInfo = useCurrencyInfo(inputCurrencyId)
  const outputCurrencyInfo = useCurrencyInfo(outputCurrencyId)

  const earnAction = 'earnAction' in notification ? notification.earnAction : undefined
  const earnTransactionType = earnAction ? getEarnPlanTransactionType(earnAction) : undefined
  const earnCurrencyId =
    earnTransactionType === undefined
      ? undefined
      : earnTransactionType === TransactionType.Withdraw
        ? outputCurrencyId
        : inputCurrencyId
  const earnAmountRaw =
    earnTransactionType === undefined
      ? undefined
      : earnTransactionType === TransactionType.Withdraw
        ? outputCurrencyAmountRaw
        : inputCurrencyAmountRaw
  const earnCurrencyInfo = useCurrencyInfo(earnCurrencyId)
  const swapFormState = useCreateSwapFormState({ address, chainId, txId })

  const onRetry = (): void => {
    navigateToSwapFlow(swapFormState ? { initialState: swapFormState } : undefined)
  }

  const retryButton =
    txStatus === TransactionStatus.Failed
      ? {
          title: t('common.button.retry'),
          onPress: onRetry,
        }
      : undefined

  const formattedInputTokenAmount = getFormattedCurrencyAmount({
    currency: inputCurrencyInfo?.currency,
    amount: inputCurrencyAmountRaw,
    formatter,
  })

  const formattedOutputTokenAmount = getFormattedCurrencyAmount({
    currency: outputCurrencyInfo?.currency,
    amount: outputCurrencyAmountRaw,
    formatter,
  })
  const formattedEarnTokenAmount =
    earnAmountRaw && earnCurrencyInfo
      ? getFormattedCurrencyAmount({
          currency: earnCurrencyInfo.currency,
          amount: earnAmountRaw,
          formatter,
          isApproximateAmount: txStatus !== TransactionStatus.Success,
        })
      : undefined
  const earnTokenSymbol = getSymbolDisplayText(earnCurrencyInfo?.currency.symbol)
  const earnTokenDescriptor =
    formattedEarnTokenAmount && earnTokenSymbol ? `${formattedEarnTokenAmount} ${earnTokenSymbol}` : undefined
  const earnTitle =
    earnAction &&
    getEarnNotificationTitle({
      earnAction,
      tokenDescriptor: earnTokenDescriptor,
      transactionStatus: txStatus,
      t,
    })
  const title = earnTitle ?? formBridgeNotificationTitle(txStatus)

  const showWarningIcon = txStatus === TransactionStatus.AwaitingAction
  const amountRow = earnAction ? (
    shouldShowEarnAmountRow(txStatus) && earnTokenDescriptor ? (
      <Text color="$neutral2" variant="body3">
        {earnTokenDescriptor}
      </Text>
    ) : null
  ) : (
    <CrossChainCurrencyRow
      inputChainId={inputCurrencyInfo?.currency.chainId ?? null}
      inputSymbol={inputCurrencyInfo?.currency.symbol ?? ''}
      outputChainId={outputCurrencyInfo?.currency.chainId ?? null}
      outputSymbol={outputCurrencyInfo?.currency.symbol ?? ''}
      formattedInputTokenAmount={formattedInputTokenAmount}
      formattedOutputTokenAmount={formattedOutputTokenAmount}
    />
  )
  const notificationIcon = earnAction ? (
    <CurrencyLogo currencyInfo={earnCurrencyInfo} size={iconSizes.icon40} />
  ) : (
    <SplitLogo
      chainId={chainId}
      inputCurrencyInfo={inputCurrencyInfo}
      outputCurrencyInfo={outputCurrencyInfo}
      size={iconSizes.icon40}
      customIcon={<CrossChainIcon status={txStatus} />}
    />
  )

  const contentOverride = (
    <Flex grow row gap="$spacing12" alignItems="center" width="100%">
      <Flex centered>{notificationIcon}</Flex>
      <Flex shrink gap="$spacing4">
        <Text color="$neutral2" variant="body3">
          {title}
        </Text>
        {amountRow}
      </Flex>
      {showWarningIcon && (
        <Flex ml="auto">
          <AlertTriangleFilled color="$statusWarning" size="$icon.20" />
        </Flex>
      )}
    </Flex>
  )

  return (
    <NotificationToast
      actionButton={retryButton}
      address={address}
      hideDelay={hideDelay}
      title={title}
      contentOverride={contentOverride}
      onPress={navigateToAccountActivityList}
    />
  )
}

function getEarnNotificationTitle({
  earnAction,
  tokenDescriptor,
  transactionStatus,
  t,
}: {
  earnAction: NonNullable<PlanTxNotification['earnAction']>
  tokenDescriptor: string | undefined
  transactionStatus: TransactionStatus
  t: ReturnType<typeof useTranslation>['t']
}): string {
  const actionKey = getEarnPlanTransactionType(earnAction) === TransactionType.Withdraw ? 'withdraw' : 'deposit'

  switch (transactionStatus) {
    case TransactionStatus.Success:
      return tokenDescriptor
        ? t(`explore.earn.review.${actionKey}.completed`, { symbol: tokenDescriptor })
        : t(`explore.earn.review.${actionKey}.completedFallback`)
    case TransactionStatus.Pending:
    case TransactionStatus.Queued:
    case TransactionStatus.Replacing:
      return tokenDescriptor
        ? t(`explore.earn.review.${actionKey}.pending`, { symbol: tokenDescriptor })
        : t(`explore.earn.review.${actionKey}.pendingFallback`)
    default:
      return t(getEarnPlanStatusTitleKeyFromTransactionStatus({ earnAction, transactionStatus }))
  }
}

function shouldShowEarnAmountRow(transactionStatus: TransactionStatus): boolean {
  return ![
    TransactionStatus.Pending,
    TransactionStatus.Queued,
    TransactionStatus.Replacing,
    TransactionStatus.Success,
  ].includes(transactionStatus)
}
