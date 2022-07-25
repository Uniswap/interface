import dayjs from 'dayjs'
import { default as React, memo, useCallback, useMemo, useState } from 'react'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import { Button, ButtonProps } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useSpotPrices } from 'src/features/dataApi/prices'
import { openModal } from 'src/features/modals/modalSlice'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import AlertBanner from 'src/features/transactions/SummaryCards/AlertBanner'
import TransactionActionsModal from 'src/features/transactions/SummaryCards/TransactionActionsModal'
import { getTransactionSummaryTitle } from 'src/features/transactions/SummaryCards/utils'
import createSwapFromStateFromDetails from 'src/features/transactions/swap/createSwapFromStateFromDetails'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'
import { buildCurrencyId } from 'src/utils/currencyId'
import { openTransactionLink } from 'src/utils/linking'

export const TXN_HISTORY_ICON_SIZE = 36
export const TXN_HISTORY_SIZING = {
  primaryImage: TXN_HISTORY_ICON_SIZE * (2 / 3),
  secondaryImage: TXN_HISTORY_ICON_SIZE * (2 / 3) * (2 / 3),
}
const LOADING_SPINNER_SIZE = 24

// Key values needed for rendering transaction history item.
export interface TransactionSummaryInfo {
  type: TransactionType
  hash: string
  chainId: ChainId
  assetType: AssetType
  msTimestampAdded: number
  status: TransactionStatus
  amountRaw?: string
  tokenAddress?: string
  otherTokenAddress?: string // for swaps
  nftMetaData?: {
    name: string
    imageURL: string
  }
  fullDetails?: TransactionDetails // for resubmission or canceling
}

function TransactionSummaryItem({
  readonly,
  transactionSummaryInfo,
  inlineWarning,
  ...rest
}: {
  readonly: boolean
  transactionSummaryInfo: TransactionSummaryInfo
  inlineWarning?: boolean // Show warning inline and not as header banner.
} & ButtonProps) {
  const {
    type,
    hash,
    chainId,
    tokenAddress,
    amountRaw,
    assetType,
    msTimestampAdded,
    status,
    otherTokenAddress,
    nftMetaData,
    fullDetails,
  } = transactionSummaryInfo
  const theme = useAppTheme()

  const [showActionsModal, setShowActionsModal] = useState(false)
  const dispatch = useAppDispatch()

  const currencyId = buildCurrencyId(chainId, tokenAddress ?? '')
  const otherCurrencyId = buildCurrencyId(chainId, otherTokenAddress ?? '')
  const currency = useCurrency(currencyId)
  const otherCurrency = useCurrency(otherCurrencyId)
  const { spotPrices } = useSpotPrices([currency])

  const failed = status === TransactionStatus.Failed
  const canceled = status === TransactionStatus.Cancelled
  const cancelling = status === TransactionStatus.Cancelling
  const failedCancel = status === TransactionStatus.FailedCancel
  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending
  const showRetry =
    fullDetails?.typeInfo.type === TransactionType.Swap &&
    fullDetails.status === TransactionStatus.Failed

  const dateAdded = dayjs(msTimestampAdded).format('MMM D')

  const onRetrySwap = useCallback(() => {
    const swapFormState = createSwapFromStateFromDetails({
      transactionDetails: fullDetails,
      inputCurrency: currency,
      outputCurrency: otherCurrency,
    })
    dispatch(openModal({ name: ModalName.Swap, initialState: swapFormState }))
  }, [currency, dispatch, fullDetails, otherCurrency])

  // Only need a balance update on these 3 types of transactions.
  const balanceUpdate =
    amountRaw &&
    (type === TransactionType.Send ||
      type === TransactionType.Receive ||
      type === TransactionType.Swap)
      ? createBalanceUpdate(type, status, currency, amountRaw, spotPrices)
      : undefined

  let title = getTransactionSummaryTitle({
    transactionSummaryInfo,
    currency,
    otherCurrency,
    inlineWarning,
  })
  const caption = inProgress ? balanceUpdate?.assetIncrease : dateAdded.toLocaleString()

  const icon = useMemo(() => {
    return type === TransactionType.Swap && !failed ? (
      <>
        <Box left={2} position="absolute" testID="swap-success-toast" top={2}>
          <CurrencyLogoOrPlaceholder currency={currency} size={TXN_HISTORY_SIZING.primaryImage} />
        </Box>
        <Box bottom={0} position="absolute" right={0}>
          {canceled && inlineWarning ? (
            <SlashCircleIcon
              color={theme.colors.backgroundOutline}
              fillOpacity={1}
              height={TXN_HISTORY_SIZING.primaryImage}
              width={TXN_HISTORY_SIZING.primaryImage}
            />
          ) : (
            <CurrencyLogoOrPlaceholder
              currency={otherCurrency}
              size={TXN_HISTORY_SIZING.primaryImage}
            />
          )}
        </Box>
      </>
    ) : (
      <LogoWithTxStatus
        assetType={assetType}
        currency={currency}
        nftImageUrl={nftMetaData?.imageURL}
        size={TXN_HISTORY_SIZING}
        txStatus={status}
        txType={type}
      />
    )
  }, [
    assetType,
    canceled,
    currency,
    failed,
    inlineWarning,
    nftMetaData?.imageURL,
    otherCurrency,
    status,
    theme.colors.backgroundOutline,
    type,
  ])

  return (
    <>
      <Button {...rest} overflow="hidden" onPress={() => setShowActionsModal(true)}>
        {(canceled || cancelling || failedCancel) && !inlineWarning && (
          <AlertBanner status={status} />
        )}
        <Flex
          row
          alignItems="flex-start"
          bg="backgroundContainer"
          gap="xs"
          justifyContent="space-between"
          padding="md">
          <Flex row shrink alignItems="center" flexGrow={1} gap="xs" justifyContent="flex-start">
            {icon && (
              <Flex centered height={TXN_HISTORY_ICON_SIZE} width={TXN_HISTORY_ICON_SIZE}>
                {icon}
              </Flex>
            )}
            <Flex shrink gap="xxxs">
              <Text adjustsFontSizeToFit fontWeight="500" numberOfLines={2} variant="mediumLabel">
                {title}
              </Text>
              <Text color="textSecondary" variant="badge">
                {caption}
              </Text>
            </Flex>
          </Flex>
          {inProgress ? (
            <SpinningLoader size={LOADING_SPINNER_SIZE} />
          ) : showRetry ? (
            <PrimaryButton
              label="Retry"
              px="none"
              py="none"
              style={{ borderWidth: theme.spacing.none }}
              textColor="accentAction"
              textVariant="subhead"
              variant="transparent"
              onPress={onRetrySwap}
            />
          ) : balanceUpdate ? (
            <Flex alignItems="flex-end" gap="xxxs">
              <Text adjustsFontSizeToFit numberOfLines={1} variant="body">
                {balanceUpdate.assetIncrease}
              </Text>
              {balanceUpdate.usdIncrease && (
                <Text adjustsFontSizeToFit color="textSecondary" numberOfLines={1} variant="badge">
                  {balanceUpdate.usdIncrease}
                </Text>
              )}
            </Flex>
          ) : null}
        </Flex>
      </Button>
      <TransactionActionsModal
        hash={hash}
        isVisible={showActionsModal}
        msTimestampAdded={msTimestampAdded}
        showCancelButton={status === TransactionStatus.Pending && !readonly}
        transactionDetails={fullDetails}
        onClose={() => {
          setShowActionsModal(false)
        }}
        onExplore={() => openTransactionLink(hash, chainId)}
      />
    </>
  )
}

export default memo(TransactionSummaryItem)
