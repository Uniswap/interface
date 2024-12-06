import { PropsWithChildren, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, TouchableArea } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import TokenWarningModal, { FeeRow } from 'uniswap/src/features/tokens/TokenWarningModal'
import { WarningModalInfoContainer } from 'uniswap/src/features/tokens/WarningInfoModalContainer'
import { getModalHeaderText, getModalSubtitleTokenWarningText } from 'uniswap/src/features/tokens/safetyUtils'
import { FoTFeeType, TokenFeeInfo } from 'uniswap/src/features/transactions/TransactionDetails/types'
import { getFeeSeverity } from 'uniswap/src/features/transactions/TransactionDetails/utils'
import { isInterface } from 'utilities/src/platform'

export function FeeOnTransferWarning({
  children,
  feeInfo,
  feeType,
}: PropsWithChildren<{ feeInfo: TokenFeeInfo; feeType: FoTFeeType }>): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const [showModal, setShowModal] = useState(false)

  const { fee, tokenSymbol } = feeInfo
  const feePercent = parseFloat(fee.toFixed())
  const formattedFeePercent = formatPercent(feePercent)

  const { tokenProtectionWarning } = getFeeSeverity(feeInfo.fee)
  const title = getModalHeaderText({ t, tokenProtectionWarning, tokenSymbol0: tokenSymbol }) ?? ''
  const subtitle =
    getModalSubtitleTokenWarningText({ t, tokenProtectionWarning, tokenSymbol, formattedFeePercent }) ?? ''

  if (isInterface) {
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
        trigger={<InfoCircle color="$neutral3" size="$icon.16" />}
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
            fee: feeInfo.fee,
            feeType,
          }}
          closeModalOnly={onClose}
          onAcknowledge={onClose}
        />
      )}
    </>
  )
}
