import { providers } from 'ethers'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text, useSporeColors } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { Arrow } from 'wallet/src/components/icons/Arrow'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { NFTTransfer } from 'wallet/src/components/nfts/NFTTransfer'
import { useAppFiatCurrencyInfo } from 'wallet/src/features/fiatCurrency/hooks'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { TransactionDetails } from 'wallet/src/features/transactions/TransactionDetails/TransactionDetails'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ParsedWarnings } from 'wallet/src/features/transactions/hooks/useParsedTransactionWarnings'
import { useUSDCValue } from 'wallet/src/features/transactions/swap/trade/hooks/useUSDCPrice'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { DerivedTransferInfo } from 'wallet/src/features/transactions/transfer/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow, useAvatar } from 'wallet/src/features/wallet/hooks'

interface TransferFormProps {
  derivedTransferInfo: DerivedTransferInfo
  txRequest?: providers.TransactionRequest
  gasFee: GasFeeResult
  onReviewSubmit: () => void
  warnings: ParsedWarnings
}

/**
 * TODO: MOB-2563 https://linear.app/uniswap/issue/MOB-2563/consolidate-all-transfer-logic-ext-mob
 * Re-use this component when implemting shared review UI on mobile, and move to shared package.
 */
export function SendDetails({
  derivedTransferInfo,
  gasFee,
  onReviewSubmit,
  txRequest,
  warnings,
}: TransferFormProps): JSX.Element | null {
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()
  const colors = useSporeColors()

  const { formatCurrencyAmount, formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()

  const account = useActiveAccountWithThrow()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const currency = useAppFiatCurrencyInfo()

  const onShowWarning = (): void => {
    setShowWarningModal(true)
  }

  const onCloseWarning = (): void => {
    setShowWarningModal(false)
  }

  const {
    currencyAmounts,
    recipient,
    isFiatInput = false,
    currencyInInfo,
    nftIn,
    chainId,
    exactAmountFiat,
  } = derivedTransferInfo

  const { avatar } = useAvatar(recipient)

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])

  const { blockingWarning } = warnings

  const actionButtonDisabled =
    !!blockingWarning || !gasFee.value || !!gasFee.error || !txRequest || account.type === AccountType.Readonly

  const actionButtonProps = {
    disabled: actionButtonDisabled,
    label: t('send.review.summary.button.title'),
    name: ElementName.Send,
    onPress: onReviewSubmit,
  }

  const transferWarning = warnings.warnings.find((warning) => warning.severity >= WarningSeverity.Medium)

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

  if (!recipient) {
    throw new Error('Invalid render of SendDetails with no recipient')
  }

  return (
    <>
      {showWarningModal && transferWarning?.title && (
        <WarningModal
          caption={transferWarning.message}
          closeText={blockingWarning ? undefined : t('send.warning.modal.button.cta.cancel')}
          confirmText={
            blockingWarning ? t('send.warning.modal.button.cta.blocking') : t('send.warning.modal.button.cta.confirm')
          }
          modalName={ModalName.SendWarning}
          severity={transferWarning.severity}
          title={transferWarning.title}
          onCancel={onCloseWarning}
          onClose={onCloseWarning}
          onConfirm={onCloseWarning}
        />
      )}
      <Flex gap="$spacing16" px="$spacing8">
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
            <CurrencyLogo currencyInfo={currencyInInfo} size={iconSizes.icon36} />
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
            <AddressDisplay
              address={recipient}
              captionVariant="body3"
              showAccountIcon={false}
              textAlign="flex-start"
              variant="heading3"
            />
            <AccountIcon address={recipient} avatarUri={avatar} size={iconSizes.icon36} />
          </Flex>
        )}
      </Flex>
      <Separator backgroundColor="$surface3" mx="$spacing8" my="$spacing16" />
      <Flex pb="$spacing16">
        <TransactionDetails
          chainId={chainId}
          gasFee={gasFee}
          showWarning={Boolean(transferWarning)}
          warning={transferWarning}
          onShowWarning={onShowWarning}
        />
      </Flex>
      <Button
        fill
        disabled={actionButtonProps.disabled}
        size="medium"
        testID={actionButtonProps.name}
        onPress={actionButtonProps.onPress}
      >
        {actionButtonProps.label}
      </Button>
    </>
  )
}
