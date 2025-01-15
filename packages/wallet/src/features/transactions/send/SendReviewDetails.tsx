/* eslint-disable complexity */
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Flex, Separator, Text, TouchableArea, isWeb, useSporeColors } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { BackArrow, X } from 'ui/src/components/icons'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { AuthTrigger } from 'uniswap/src/features/auth/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import { TransactionModalFooterContainer } from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { NFTTransfer } from 'wallet/src/components/nfts/NFTTransfer'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useSendContext } from 'wallet/src/features/transactions/contexts/SendContext'
import { useSendERC20Callback, useSendNFTCallback } from 'wallet/src/features/transactions/send/hooks/useSendCallback'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

export function SendReviewDetails({
  authTrigger,
  ButtonAuthIcon,
  onCloseModal,
  onSubmitSend,
}: {
  authTrigger?: AuthTrigger
  ButtonAuthIcon?: JSX.Element | null
  onCloseModal?: () => void
  onSubmitSend?: () => void
}): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const { fullHeight } = useDeviceDimensions()
  const account = useActiveAccountWithThrow()

  const { formatCurrencyAmount, formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { navigateToAccountActivityList } = useWalletNavigation()

  const { setScreen } = useTransactionModalContext()
  const { derivedSendInfo, warnings, txRequest, gasFee, isFiatInput, fiatOffRampMetaData } = useSendContext()
  const { txId, chainId, recipient, currencyInInfo, currencyAmounts, nftIn, exactAmountFiat } = derivedSendInfo

  const { avatar } = useAvatar(recipient)

  const currency = useAppFiatCurrencyInfo()
  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])
  const currencyAmountUSD = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const triggerTransferPendingNotification = useCallback(() => {
    if (!currencyInInfo) {
      // This should never happen. Just keeping TS happy.
      logger.error(new Error('Missing `currencyInInfo` when triggering transfer pending notification'), {
        tags: { file: 'SendReviewDetails.tsx', function: 'triggerTransferPendingNotification' },
      })
    } else {
      dispatch(
        pushNotification({
          type: AppNotificationType.TransferCurrencyPending,
          currencyInfo: currencyInInfo,
        }),
      )
    }
  }, [currencyInInfo, dispatch])

  const onNext = useCallback((): void => {
    onCloseModal?.()
    triggerTransferPendingNotification()
    navigateToAccountActivityList()
  }, [navigateToAccountActivityList, onCloseModal, triggerTransferPendingNotification])

  const transferERC20Callback = useSendERC20Callback(
    txId,
    chainId as UniverseChainId,
    recipient,
    currencyInInfo ? currencyAddress(currencyInInfo.currency) : undefined,
    currencyAmounts[CurrencyField.INPUT]?.quotient.toString(),
    txRequest,
    onNext,
    currencyAmountUSD,
    gasFee.gasEstimates,
  )

  const transferNFTCallback = useSendNFTCallback(
    txId,
    chainId as UniverseChainId,
    recipient,
    nftIn?.nftContract?.address,
    nftIn?.tokenId,
    txRequest,
    onNext,
    gasFee.gasEstimates,
  )

  const submitTranaction = useCallback(() => {
    if (nftIn) {
      transferNFTCallback?.()
    } else {
      transferERC20Callback?.()
    }
  }, [nftIn, transferERC20Callback, transferNFTCallback])

  const onSubmitButtonPress = useCallback(async () => {
    if (authTrigger) {
      await authTrigger({
        successCallback: submitTranaction,
        failureCallback: () => {
          setScreen(TransactionScreen.Form)
        },
      })
    } else {
      submitTranaction()
    }

    await onSubmitSend?.()
  }, [authTrigger, setScreen, submitTranaction, onSubmitSend])

  const { blockingWarning } = warnings
  const transferWarning = warnings.warnings.find((warning) => warning.severity >= WarningSeverity.Medium)

  const [showWarningModal, setShowWarningModal] = useState(false)
  const onShowWarning = (): void => {
    setShowWarningModal(true)
  }
  const onCloseWarning = (): void => {
    setShowWarningModal(false)
  }

  const actionButtonDisabled =
    !!blockingWarning || !gasFee.value || !!gasFee.error || !txRequest || account.type === AccountType.Readonly

  const actionButtonProps = {
    disabled: actionButtonDisabled,
    label: t('send.review.summary.button.title'),
    name: ElementName.Send,
    onPress: onSubmitButtonPress,
  }

  const formattedCurrencyAmount = formatCurrencyAmount({
    value: currencyAmounts[CurrencyField.INPUT],
    type: NumberType.TokenTx,
  })
  const formattedAmountIn = isFiatInput
    ? formatNumberOrString({
        value: exactAmountFiat,
        type: NumberType.FiatTokenQuantity,
        currencyCode: currency.code,
      })
    : formattedCurrencyAmount

  const formattedInputFiatValue = convertFiatAmountFormatted(
    inputCurrencyUSDValue?.toExact(),
    NumberType.FiatTokenQuantity,
  )

  const { navigateToFiatOnRamp } = useWalletNavigation()

  const onPrev = (): void => {
    if (fiatOffRampMetaData) {
      onCloseModal?.()
      navigateToFiatOnRamp({
        prefilledCurrency: {
          currencyInfo: currencyInInfo,
          moonpayCurrencyCode: fiatOffRampMetaData.moonpayCurrencyCode,
          meldCurrencyCode: fiatOffRampMetaData.meldCurrencyCode,
        },
      })
    }
    setScreen(TransactionScreen.Form)
  }

  if (!recipient) {
    throw new Error('Invalid render of SendDetails with no recipient')
  }

  return (
    <Trace logImpression section={SectionName.SendReview}>
      {transferWarning?.title && (
        <WarningModal
          caption={transferWarning.message}
          rejectText={blockingWarning ? undefined : t('send.warning.modal.button.cta.cancel')}
          acknowledgeText={
            blockingWarning ? t('send.warning.modal.button.cta.blocking') : t('send.warning.modal.button.cta.confirm')
          }
          isOpen={showWarningModal}
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onReject={onCloseWarning}
          onClose={onCloseWarning}
          onAcknowledge={onCloseWarning}
        />
      )}
      <Flex gap="$spacing16" px="$spacing8">
        <Flex centered row justifyContent="space-between">
          <Text color="$neutral2" variant="body2">
            {t('send.review.modal.title')}
          </Text>
          {isWeb && (
            <TouchableArea onPress={onPrev}>
              <X color="$neutral2" size="$icon.20" />
            </TouchableArea>
          )}
        </Flex>
        {currencyInInfo ? (
          <Flex row alignItems="center">
            <Flex fill>
              <Flex centered row justifyContent="space-between">
                <Text color="$neutral1" variant="heading3">
                  {formattedAmountIn} {!isFiatInput ? currencyInInfo.currency.symbol : ''}
                </Text>
              </Flex>
              {isFiatInput ? (
                <Text color="$neutral2" variant="body3">
                  {formattedCurrencyAmount} {currencyInInfo.currency.symbol}
                </Text>
              ) : (
                inputCurrencyUSDValue && (
                  <Text color="$neutral2" variant="body3">
                    {formattedInputFiatValue}
                  </Text>
                )
              )}
            </Flex>
            <CurrencyLogo currencyInfo={currencyInInfo} size={iconSizes.icon40} />
          </Flex>
        ) : (
          nftIn && (
            <Flex mt="$spacing60">
              <NFTTransfer asset={nftIn} nftSize={fullHeight / 5} />
            </Flex>
          )
        )}
        <Flex alignItems="flex-start">
          <Arrow color={colors.neutral3.val} direction="s" />
        </Flex>
        {recipient && (
          <Flex centered row justifyContent="space-between">
            {fiatOffRampMetaData ? (
              <Flex>
                <Text color="$neutral1" variant="heading3">
                  {fiatOffRampMetaData.name}
                </Text>
                <Text color="$neutral2" variant="body4">
                  {shortenAddress(recipient)}
                </Text>
              </Flex>
            ) : (
              <AddressDisplay
                address={recipient}
                captionVariant="body3"
                showAccountIcon={false}
                textAlign="flex-start"
                variant="heading3"
              />
            )}
            <AccountIcon
              address={recipient}
              avatarUri={fiatOffRampMetaData?.logoUrl || avatar}
              size={iconSizes.icon40}
            />
          </Flex>
        )}
      </Flex>
      <Separator backgroundColor="$surface3" mx="$spacing8" my="$spacing16" />
      <TransactionDetails
        AccountDetails={
          <Flex row alignItems="center" justifyContent="space-between">
            <Text color="$neutral2" variant="body3">
              {t('common.wallet.label')}
            </Text>
            <AddressDisplay
              disableForcedWidth
              address={account.address}
              hideAddressInSubtitle={true}
              horizontalGap="$spacing4"
              size={iconSizes.icon16}
              variant="body3"
            />
          </Flex>
        }
        chainId={chainId as UniverseChainId}
        gasFee={gasFee}
        showWarning={Boolean(transferWarning)}
        warning={transferWarning}
        onShowWarning={onShowWarning}
      />

      <TransactionModalFooterContainer>
        <Flex row gap="$spacing8">
          {!isWeb && <Button icon={<BackArrow />} size="large" theme="tertiary" onPress={onPrev} />}
          <Button
            fill
            disabled={actionButtonProps.disabled}
            icon={ButtonAuthIcon}
            size="medium"
            testID={actionButtonProps.name}
            onPress={actionButtonProps.onPress}
          >
            {actionButtonProps.label}
          </Button>
        </Flex>
      </TransactionModalFooterContainer>
    </Trace>
  )
}
