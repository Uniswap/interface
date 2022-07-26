import { TradeType } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import CheckCircle from 'src/assets/icons/check-circle.svg'
import Send from 'src/assets/icons/send.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { getFormattedCurrencyAmount } from 'src/features/notifications/utils'
import { ElementName } from 'src/features/telemetry/constants'
import { useSelectTransactionById } from 'src/features/transactions/hooks'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { getInputAmountFromTrade, getOutputAmountFromTrade } from 'src/features/transactions/utils'
import { useActiveAccountWithThrow } from 'src/features/wallet/hooks'
import { toSupportedChainId } from 'src/utils/chainId'
import { openTransactionLink } from 'src/utils/linking'

type SwapStatusProps = {
  derivedSwapInfo: DerivedSwapInfo
  onNext: () => void
  onTryAgain: () => void
}

const getTextFromStatus = (
  t: TFunction,
  derivedSwapInfo: DerivedSwapInfo,
  transactionDetails?: TransactionDetails,
  status?: TransactionStatus
) => {
  if (!transactionDetails || transactionDetails.typeInfo.type !== TransactionType.Swap) {
    // TODO: should never go into this state but should probably do some
    // error display here
    return {
      title: t('Swap pending'),
      description: t(
        'We’ll notify you once your swap is complete. You can now safely leave this page.'
      ),
    }
  }

  if (status === TransactionStatus.Success) {
    const { typeInfo } = transactionDetails
    const { currencies } = derivedSwapInfo

    const inputCurrencyAmountRaw = getInputAmountFromTrade(typeInfo)
    const outputCurrencyAmountRaw = getOutputAmountFromTrade(typeInfo)

    const inputCurrency = currencies[CurrencyField.INPUT]
    const outputCurrency = currencies[CurrencyField.OUTPUT]

    const inputAmount = getFormattedCurrencyAmount(
      inputCurrency,
      inputCurrencyAmountRaw,
      typeInfo.tradeType === TradeType.EXACT_OUTPUT
    )

    const outputAmount = getFormattedCurrencyAmount(
      outputCurrency,
      outputCurrencyAmountRaw,
      typeInfo.tradeType === TradeType.EXACT_INPUT
    )

    return {
      title: t('Swap successful!'),
      description: t(
        'You swapped {{ inputAmount }}{{ inputCurrency }} for {{ outputAmount }}{{ outputCurrency }}.',
        {
          inputAmount,
          inputCurrency: inputCurrency?.symbol,
          outputAmount,
          outputCurrency: outputCurrency?.symbol,
        }
      ),
    }
  }

  if (status === TransactionStatus.Failed) {
    return {
      title: t('Swap failed'),
      description: t('Keep in mind that the network fee is still charged for failed swaps.'),
    }
  }

  // TODO: handle TransactionStatus.Unknown state
  return {
    title: t('Swap pending'),
    description: t(
      'We’ll notify you once your swap is complete. You can now safely leave this page.'
    ),
  }
}

function StatusIcon({ status, size }: { status?: TransactionStatus; size: number }) {
  const theme = useAppTheme()

  if (status === TransactionStatus.Success) {
    return <CheckCircle height={size} width={size} />
  }

  if (status === TransactionStatus.Failed) {
    return <AlertTriangle color={theme.colors.accentFailure} height={size} width={size} />
  }

  return <Send height={size} width={size} />
}

function isFinalizedState(status: TransactionStatus) {
  return status === TransactionStatus.Success || status === TransactionStatus.Failed
}

export function SwapStatus({ derivedSwapInfo, onNext, onTryAgain }: SwapStatusProps) {
  const account = useActiveAccountWithThrow()
  const { t } = useTranslation()
  const { txId, currencies } = derivedSwapInfo
  const chainId = toSupportedChainId(currencies[CurrencyField.INPUT]?.chainId) ?? ChainId.Mainnet
  const transaction = useSelectTransactionById(account.address, chainId, txId)

  const { title, description } = useMemo(() => {
    return getTextFromStatus(t, derivedSwapInfo, transaction, transaction?.status)
  }, [t, transaction, derivedSwapInfo])

  return (
    <AnimatedFlex flexGrow={1} mb="xl" px="sm">
      <Flex centered flexGrow={1}>
        <Flex centered>
          <StatusIcon size={72} status={transaction?.status} />
        </Flex>
        <Flex centered gap="sm">
          <Text variant="headlineSmall">{title}</Text>
          <Text color="textTertiary" textAlign="center" variant="body">
            {description}
          </Text>
          {transaction?.status === TransactionStatus.Failed ? (
            <TextButton
              fontWeight="600"
              textColor="accentAction"
              textVariant="body"
              onPress={onTryAgain}>
              {' '}
              {t('Try again')}
            </TextButton>
          ) : null}
        </Flex>
      </Flex>
      {transaction && isFinalizedState(transaction.status) ? (
        <PrimaryButton
          alignSelf="stretch"
          label={t('View transaction')}
          py="md"
          variant="transparent"
          onPress={() => openTransactionLink(transaction.hash, chainId)}
        />
      ) : null}
      <PrimaryButton
        alignSelf="stretch"
        label={t('OK')}
        py="md"
        testID={ElementName.OK}
        onPress={onNext}
      />
    </AnimatedFlex>
  )
}
