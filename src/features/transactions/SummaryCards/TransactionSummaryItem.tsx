import { default as React, memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import SlashCircleIcon from 'src/assets/icons/slash-circle.svg'
import { Button, ButtonProps } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { LogoWithTxStatus } from 'src/components/CurrencyLogo/LogoWithTxStatus'
import { Box } from 'src/components/layout/Box'
import { Flex } from 'src/components/layout/Flex'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { InlineNetworkPill } from 'src/components/Network/NetworkPill'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'
import { useSpotPrices } from 'src/features/dataApi/prices'
import { openModal } from 'src/features/modals/modalSlice'
import { createBalanceUpdate } from 'src/features/notifications/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { useLowestPendingNonce } from 'src/features/transactions/hooks'
import { cancelTransaction } from 'src/features/transactions/slice'
import AlertBanner, { FailedCancelBadge } from 'src/features/transactions/SummaryCards/AlertBanner'
import { CancelConfirmationView } from 'src/features/transactions/SummaryCards/CancelConfirmationView'
import TransactionActionsModal from 'src/features/transactions/SummaryCards/TransactionActionsModal'
import {
  getNftUpdateInfo,
  getTransactionSummaryCaption,
  getTransactionSummaryTitle,
} from 'src/features/transactions/SummaryCards/utils'
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
const LOADING_SPINNER_SIZE = 20

// Key values needed for rendering transaction history item.
export interface TransactionSummaryInfo {
  type: TransactionType
  hash: string
  chainId: ChainId
  assetType: AssetType
  msTimestampAdded: number
  status: TransactionStatus
  tokenAddress?: string
  amountRaw?: string
  otherTokenAddress?: string // for swaps
  otherAmountRaw?: string // for swaps
  to?: string | undefined
  from?: string | undefined
  nftMetaData?: {
    name: string
    collectionName: string
    imageURL: string
  }
  fullDetails?: TransactionDetails // for resubmission or canceling
}

function TransactionSummaryItem({
  readonly,
  transactionSummaryInfo,
  showInlineWarning,
  bg,
  ...rest
}: {
  readonly: boolean
  transactionSummaryInfo: TransactionSummaryInfo
  showInlineWarning?: boolean // Show warning inline and not as header banner.
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
  const { t } = useTranslation()

  const [showActionsModal, setShowActionsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const dispatch = useAppDispatch()

  const currencyId = buildCurrencyId(chainId, tokenAddress ?? '')
  const otherCurrencyId = buildCurrencyId(chainId, otherTokenAddress ?? '')
  const currency = useCurrency(currencyId)
  const otherCurrency = useCurrency(otherCurrencyId)

  const spotPricesInput = useMemo(() => [currency], [currency])
  const { spotPrices } = useSpotPrices(spotPricesInput)

  // Monitor latest nonce to identify queued transactions.
  const lowestPendingNonce = useLowestPendingNonce()
  const nonce = fullDetails?.options?.request?.nonce
  const queued = nonce && lowestPendingNonce ? nonce > lowestPendingNonce : false

  const failed = status === TransactionStatus.Failed
  const canceled = status === TransactionStatus.Cancelled
  const cancelling = status === TransactionStatus.Cancelling
  const failedCancel = status === TransactionStatus.FailedCancel
  const inProgress = status === TransactionStatus.Cancelling || status === TransactionStatus.Pending
  const showRetry =
    fullDetails?.typeInfo.type === TransactionType.Swap &&
    fullDetails.status === TransactionStatus.Failed

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

  const nftUpdateInfo = getNftUpdateInfo(nftMetaData)

  let title = getTransactionSummaryTitle({
    transactionSummaryInfo,
    t,
    showInlineWarning,
  })
  const caption = getTransactionSummaryCaption({
    transactionSummaryInfo,
    currency,
    otherCurrency,
  })

  function handleCancel() {
    if (!fullDetails) return
    dispatch(
      cancelTransaction({
        chainId: fullDetails.chainId,
        id: fullDetails.id,
        address: fullDetails.from,
      })
    )
    setShowCancelModal(false)
  }

  const icon = useMemo(() => {
    return type === TransactionType.Swap && !failed && assetType === AssetType.Currency ? (
      <>
        <Box left={2} position="absolute" testID="swap-success-toast" top={2}>
          <CurrencyLogoOrPlaceholder currency={currency} size={TXN_HISTORY_SIZING.primaryImage} />
        </Box>
        <Box
          bottom={canceled && showInlineWarning ? 5 : 0}
          position="absolute"
          right={canceled && showInlineWarning ? 5 : 0}>
          {canceled && showInlineWarning ? (
            <SlashCircleIcon
              color={theme.colors.backgroundOutline}
              fillOpacity={1}
              height={TXN_HISTORY_SIZING.secondaryImage}
              width={TXN_HISTORY_SIZING.secondaryImage}
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
    nftMetaData?.imageURL,
    otherCurrency,
    status,
    theme.colors.backgroundOutline,
    type,
    showInlineWarning,
  ])

  return (
    <>
      <Button overflow="hidden" onPress={() => setShowActionsModal(true)} {...rest}>
        {(canceled || cancelling || failedCancel) && !showInlineWarning && (
          <AlertBanner status={status} />
        )}
        <Flex
          row
          alignItems="flex-start"
          bg={bg ?? 'backgroundContainer'}
          gap="xs"
          justifyContent="space-between"
          px="md"
          py="sm">
          <Flex row shrink alignItems="center" flexGrow={1} gap="xs" justifyContent="flex-start">
            {icon && (
              <Flex centered height={TXN_HISTORY_ICON_SIZE} width={TXN_HISTORY_ICON_SIZE}>
                {icon}
              </Flex>
            )}
            <Flex grow gap="xxxs">
              <Flex row alignItems="center" gap="xxs">
                <Text fontWeight="500" numberOfLines={1} variant="mediumLabel">
                  {title}
                </Text>
                {chainId !== ChainId.Mainnet && <InlineNetworkPill chainId={chainId} />}
                {status === TransactionStatus.FailedCancel && showInlineWarning && (
                  <FailedCancelBadge />
                )}
              </Flex>
              {caption && (
                <Text color="textSecondary" variant="caption">
                  {caption}
                </Text>
              )}
            </Flex>
          </Flex>
          {inProgress ? (
            <Flex alignItems="flex-end" gap="xxxs">
              <SpinningLoader disabled={queued} size={LOADING_SPINNER_SIZE} />
              {queued && (
                <Text color="textSecondary" variant="badge">
                  {t('Queued')}
                </Text>
              )}
            </Flex>
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
                <Text color="textSecondary" numberOfLines={1} variant="caption">
                  {balanceUpdate.usdIncrease}
                </Text>
              )}
            </Flex>
          ) : nftUpdateInfo ? (
            <Flex shrink alignItems="flex-end" gap="xxxs">
              <Text ellipsizeMode="tail" numberOfLines={1} variant="body">
                {nftUpdateInfo.title + nftUpdateInfo.title + nftUpdateInfo.title}
              </Text>
              <Text adjustsFontSizeToFit color="textSecondary" numberOfLines={1} variant="caption">
                {nftUpdateInfo.caption}
              </Text>
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
        onCancel={() => {
          setShowActionsModal(false)
          setShowCancelModal(true)
        }}
        onClose={() => setShowActionsModal(false)}
        onExplore={() => openTransactionLink(hash, chainId)}
      />
      <BottomSheetModal
        hideHandlebar={false}
        isVisible={showCancelModal}
        name={ModalName.TransactionActions}
        onClose={() => setShowCancelModal(false)}>
        {fullDetails && (
          <CancelConfirmationView
            transactionDetails={fullDetails}
            onBack={() => {
              setShowActionsModal(true)
              setShowCancelModal(false)
            }}
            onCancel={handleCancel}
          />
        )}
      </BottomSheetModal>
    </>
  )
}

export default memo(TransactionSummaryItem)
