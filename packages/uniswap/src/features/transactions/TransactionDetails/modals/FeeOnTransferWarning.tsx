import { PropsWithChildren, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { capitalize } from 'tsafe'
import { Flex, Text, TouchableArea } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getFeeColor, useModalHeaderText, useModalSubtitleText } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { WarningModalInfoContainer } from 'uniswap/src/features/tokens/warnings/WarningInfoModalContainer'
import { FoTFeeType, TokenFeeInfo } from 'uniswap/src/features/transactions/TransactionDetails/types'
import { getFeeSeverity } from 'uniswap/src/features/transactions/TransactionDetails/utils/getFeeSeverity'
import { isWebApp } from 'utilities/src/platform'

export function FeeOnTransferWarning({
  children,
  feeInfo,
  feeType,
}: PropsWithChildren<{ feeInfo: TokenFeeInfo; feeType: FoTFeeType }>): JSX.Element {
  const [showModal, setShowModal] = useState(false)

  const { fee, tokenSymbol } = feeInfo
  const feePercent = parseFloat(fee.toFixed())

  const { tokenProtectionWarning } = getFeeSeverity(feeInfo.fee)
  const title = useModalHeaderText({ tokenProtectionWarning, tokenSymbol0: tokenSymbol }) ?? ''
  const subtitle =
    useModalSubtitleText({
      tokenProtectionWarning,
      tokenSymbol,
      buyFeePercent: feeType === 'buy' ? feePercent : undefined,
      sellFeePercent: feeType === 'sell' ? feePercent : undefined,
    }) ?? ''

  if (isWebApp) {
    return (
      <InfoTooltip
        {...{
          text: subtitle,
          title,
          placement: 'top',
        }}
        button={
          <WarningModalInfoContainer>
            <FeeRow feePercent={feePercent} feeType={feeType} />
          </WarningModalInfoContainer>
        }
        trigger={<InfoCircle color="$neutral3" size="$icon.12" />}
        triggerPlacement="end"
      >
        {children}
      </InfoTooltip>
    )
  }

  const onPress = (): void => {
    setShowModal(true)
  }

  const onClose = (): void => {
    setShowModal(false)
  }

  return (
    <>
      <TouchableArea flexShrink={1} onPress={onPress}>
        <Flex row shrink alignItems="center" gap="$spacing4">
          {children}
          <InfoCircle color="$neutral3" size="$icon.16" />
        </Flex>
      </TouchableArea>
      {feeInfo.currencyInfo && (
        <TokenWarningModal
          isInfoOnlyWarning
          isVisible={showModal}
          currencyInfo0={feeInfo.currencyInfo}
          feeOnTransferOverride={{
            buyFeePercent: feeType === 'buy' ? feePercent : undefined,
            sellFeePercent: feeType === 'sell' ? feePercent : undefined,
          }}
          closeModalOnly={onClose}
          onAcknowledge={onClose}
        />
      )}
    </>
  )
}

// feePercent is the percentage as an integer. I.e. feePercent = 5 means 5%
function FeeRow({ feeType, feePercent = 0 }: { feeType: 'buy' | 'sell'; feePercent?: number }): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const textColor = getFeeColor(feePercent)
  return (
    <Flex row width="100%" justifyContent="space-between" gap="$spacing4">
      <Text variant="body3" color="$neutral2">
        {feeType === 'buy' ? capitalize(t('token.fee.buy.label')) : capitalize(t('token.fee.sell.label'))}
      </Text>
      <Text variant="body3" color={textColor}>
        {formatPercent(feePercent)}
      </Text>
    </Flex>
  )
}
