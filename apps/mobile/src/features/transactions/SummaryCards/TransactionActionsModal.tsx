import dayjs from 'dayjs'
import { default as React, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch } from 'src/app/hooks'
import { ActionSheetModalContent, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { setClipboard } from 'src/utils/clipboard'
import { openMoonpayHelpLink, openUniswapHelpLink } from 'src/utils/linking'
import { ColorTokens, Flex, Separator, Text } from 'ui/src'
import { CHAIN_INFO } from 'wallet/src/constants/chains'
import { FORMAT_DATE_LONG, useFormattedDate } from 'wallet/src/features/language/localizedDayjs'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType, CopyNotificationType } from 'wallet/src/features/notifications/types'
import { useCurrencyInfo } from 'wallet/src/features/tokens/useCurrencyInfo'
import {
  BaseSwapTransactionInfo,
  TransactionDetails,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'

function renderOptionItem(label: string, textColorOverride?: ColorTokens): () => JSX.Element {
  return function OptionItem(): JSX.Element {
    return (
      <>
        <Separator />
        <Text
          color={textColorOverride ?? '$neutral1'}
          p="$spacing16"
          textAlign="center"
          variant="body1">
          {label}
        </Text>
      </>
    )
  }
}

interface TransactionActionModalProps {
  onExplore: () => void
  onViewTokenDetails?: (currencyId: CurrencyId) => void
  onViewMoonpay?: () => void
  onClose: () => void
  onCancel: () => void
  msTimestampAdded: number
  showCancelButton?: boolean
  transactionDetails: TransactionDetails
}

/** Display options for transactions. */
export default function TransactionActionsModal({
  msTimestampAdded,
  onCancel,
  onClose,
  onViewTokenDetails,
  onExplore,
  onViewMoonpay,
  showCancelButton,
  transactionDetails,
}: TransactionActionModalProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const dateString = useFormattedDate(dayjs(msTimestampAdded), FORMAT_DATE_LONG)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const inputCurrencyInfo = useCurrencyInfo(
    (transactionDetails.typeInfo as BaseSwapTransactionInfo).inputCurrencyId
  )

  const outputCurrencyInfo = useCurrencyInfo(
    (transactionDetails.typeInfo as BaseSwapTransactionInfo).outputCurrencyId
  )

  const options = useMemo(() => {
    const isFiatOnRampTransaction =
      transactionDetails.typeInfo.type === TransactionType.FiatPurchase

    const isSwapTransaction = transactionDetails.typeInfo.type === TransactionType.Swap

    const maybeViewSwapToken =
      onViewTokenDetails && isSwapTransaction && inputCurrencyInfo && outputCurrencyInfo
        ? [
            {
              key: ElementName.TokenAddress,
              onPress: () => onViewTokenDetails(inputCurrencyInfo.currencyId),
              render: renderOptionItem(
                t('View {{ tokenSymbol }}', {
                  tokenSymbol: inputCurrencyInfo?.currency.symbol,
                })
              ),
            },
            {
              key: ElementName.TokenAddress,
              onPress: () => onViewTokenDetails(outputCurrencyInfo.currencyId),
              render: renderOptionItem(
                t('View {{ tokenSymbol }}', {
                  tokenSymbol: outputCurrencyInfo?.currency.symbol,
                })
              ),
            },
          ]
        : []

    const maybeViewOnMoonpayOption = onViewMoonpay
      ? [
          {
            key: ElementName.MoonpayExplorerView,
            onPress: onViewMoonpay,
            render: renderOptionItem(t('View on MoonPay')),
          },
        ]
      : []

    const chainInfo = CHAIN_INFO[transactionDetails.chainId]

    const maybeViewOnEtherscanOption = transactionDetails.hash
      ? [
          {
            key: ElementName.EtherscanView,
            onPress: onExplore,
            render: renderOptionItem(
              t('View on {{ blockExplorerName }}', {
                blockExplorerName: chainInfo.explorer.name,
              })
            ),
          },
        ]
      : []

    const transactionId =
      // isFiatOnRampTransaction would not provide type narrowing here
      transactionDetails.typeInfo.type === TransactionType.FiatPurchase
        ? transactionDetails.typeInfo.id
        : transactionDetails.hash

    const maybeCopyTransactionIdOption = transactionId
      ? [
          {
            key: ElementName.Copy,
            onPress: async (): Promise<void> => {
              await setClipboard(transactionId)
              dispatch(
                pushNotification({
                  type: AppNotificationType.Copied,
                  copyType: CopyNotificationType.TransactionId,
                })
              )
              handleClose()
            },
            render: onViewMoonpay
              ? renderOptionItem(t('Copy MoonPay transaction ID'))
              : renderOptionItem(t('Copy transaction ID')),
          },
        ]
      : []

    const transactionActionOptions: MenuItemProp[] = [
      ...maybeViewSwapToken,
      ...maybeViewOnMoonpayOption,
      ...maybeViewOnEtherscanOption,
      ...maybeCopyTransactionIdOption,
      {
        key: ElementName.GetHelp,
        onPress: async (): Promise<void> => {
          if (isFiatOnRampTransaction) {
            await openMoonpayHelpLink()
          } else {
            await openUniswapHelpLink()
          }

          handleClose()
        },
        render: renderOptionItem(t('Get help')),
      },
    ]
    if (showCancelButton) {
      transactionActionOptions.push({
        key: ElementName.Cancel,
        onPress: onCancel,
        render: renderOptionItem(t('Cancel transaction'), '$statusCritical'),
      })
    }
    return transactionActionOptions
  }, [
    transactionDetails,
    inputCurrencyInfo,
    outputCurrencyInfo,
    onViewMoonpay,
    onViewTokenDetails,
    t,
    onExplore,
    showCancelButton,
    dispatch,
    handleClose,
    onCancel,
  ])

  return (
    <BottomSheetModal
      hideHandlebar
      backgroundColor="statusCritical"
      name={ModalName.TransactionActions}
      onClose={handleClose}>
      <Flex px="$spacing12">
        <ActionSheetModalContent
          header={
            <Text color="$neutral3" p="$spacing16" variant="body2">
              {t('Submitted on') + ' ' + dateString}
            </Text>
          }
          options={options}
          onClose={handleClose}
        />
      </Flex>
    </BottomSheetModal>
  )
}
