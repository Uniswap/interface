import { BigNumber } from '@ethersproject/bignumber'
import { useState } from 'react'
import { capitalize } from 'tsafe'
import { Flex, LabeledCheckbox, Text, styled } from 'ui/src'
import { BlockaidLogo } from 'ui/src/components/logos/BlockaidLogo'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ExplorerView } from 'uniswap/src/features/address/ExplorerView'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import DeprecatedTokenWarningModal from 'uniswap/src/features/tokens/DeprecatedTokenWarningModal'
import {
  TokenWarningDesignTreatment,
  getIsFeeRelatedWarning,
  getShouldHavePluralTreatment,
  getTokenWarningDesignTreatment,
  useModalHeaderText,
  useModalSubtitleText,
} from 'uniswap/src/features/tokens/safetyUtils'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'

interface Props {
  isVisible: boolean
  currencyInfo0: CurrencyInfo
  currencyInfo1?: CurrencyInfo
  disableAccept?: boolean // only show message and close button
  onClose: () => void
  onAccept: () => void
}

/**
 * Warning speedbump for selecting certain tokens.
 */
export default function TokenWarningModal({
  isVisible,
  currencyInfo0,
  currencyInfo1,
  disableAccept,
  onClose,
  onAccept,
}: Props): JSX.Element | null {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)
  const { t } = useTranslation()
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false) // TODO(WALL-4596): implement dismissedTokenWarnings redux

  const designTreatment = getTokenWarningDesignTreatment(currencyInfo0.currency, currencyInfo0.safetyInfo)
  const isFeeRelatedWarning = getIsFeeRelatedWarning(currencyInfo0.currency, currencyInfo0.safetyInfo)

  const mockWarningSeverity = WarningSeverity.Medium // FIXME(WALL-4686): temp mock var; need to dedupe warning severity usage with TokenWarningDesignTreatment

  const plural = getShouldHavePluralTreatment(
    currencyInfo0.currency,
    currencyInfo0.safetyInfo,
    currencyInfo1?.currency,
    currencyInfo1?.safetyInfo,
  )

  const titleText = useModalHeaderText(
    currencyInfo0.currency,
    currencyInfo0.safetyInfo,
    plural ? currencyInfo1?.currency : undefined,
    plural ? currencyInfo1?.safetyInfo : undefined,
  )
  const subtitleText = useModalSubtitleText(
    currencyInfo0.currency,
    currencyInfo0.safetyInfo,
    plural ? currencyInfo1?.currency : undefined,
    plural ? currencyInfo1?.safetyInfo : undefined,
  )

  if (designTreatment === TokenWarningDesignTreatment.None) {
    return null
  }

  const showActionButton = !disableAccept && designTreatment !== TokenWarningDesignTreatment.Blocked

  return tokenProtectionEnabled ? (
    <WarningModal
      backgroundIconColor={getAlertColor(mockWarningSeverity).background}
      captionComponent={
        <Flex centered gap="$spacing12">
          <Text color="$neutral2" textAlign="center" variant="body2">
            {subtitleText}
          </Text>
          <LearnMoreLink textColor="$neutral1" url={uniswapUrls.helpArticleUrls.tokenWarning} />
        </Flex>
      }
      closeText={
        designTreatment === TokenWarningDesignTreatment.Blocked ? t('common.button.close') : t('common.button.back')
      }
      confirmText={showActionButton ? t('common.button.continue') : undefined}
      icon={<WarningIcon safetyLevel={currencyInfo0.safetyLevel} size="$icon.24" />} // TODO(WEB-4883): re-work WarningIcon according to severity, not safety level
      isOpen={isVisible}
      modalName={ModalName.TokenWarningModal}
      severity={mockWarningSeverity}
      titleComponent={
        <Text color={getAlertColor(mockWarningSeverity).text} variant="subheading1">
          {titleText}
        </Text>
      }
      onCancel={onClose}
      onClose={onClose}
      onConfirm={onAccept}
    >
      {currencyInfo0.currency.isToken && (currencyInfo0.currency.sellFeeBps || currencyInfo0.currency.buyFeeBps) ? (
        <FeeDisplayTable buyFeeBps={currencyInfo0.currency.buyFeeBps} sellFeeBps={currencyInfo0.currency.sellFeeBps} />
      ) : (
        <>
          <ExplorerView currency={currencyInfo0.currency} modalName={ModalName.TokenWarningModal} />
          {plural && currencyInfo1 && (
            <ExplorerView currency={currencyInfo1.currency} modalName={ModalName.TokenWarningModal} />
          )}
        </>
      )}

      {!isFeeRelatedWarning && (
        <Flex row centered>
          <Text variant="body3" color="$neutral3">
            <Trans
              i18nKey="common.poweredBy"
              components={{ name: <BlockaidLogo minHeight={10} minWidth={50} color="$neutral3" /> }}
            />
          </Text>
        </Flex>
      )}

      {showActionButton && designTreatment === TokenWarningDesignTreatment.Low && (
        <LabeledCheckbox
          checked={dontShowAgain}
          checkedColor="$neutral1"
          text={
            <Text color="$neutral2" variant="buttonLabel3">
              {t('token.safety.warning.dontShowWarningAgain')}
            </Text>
          }
          size="$icon.16"
          gap="$spacing8"
          onCheckPressed={() => setDontShowAgain((s: boolean) => !s)}
        />
      )}
    </WarningModal>
  ) : (
    <DeprecatedTokenWarningModal
      currencyId={currencyId(currencyInfo0.currency)}
      disableAccept={disableAccept}
      isVisible={isVisible}
      safetyLevel={currencyInfo0.safetyLevel}
      tokenLogoUrl={currencyInfo0?.logoUrl}
      onAccept={onAccept}
      onClose={onClose}
    />
  )
}

export const WarningModalInfoContainer = styled(Flex, {
  width: '100%',
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  px: '$spacing16',
  py: '$spacing12',
  alignItems: 'center',
  overflow: 'hidden',
  flexWrap: 'nowrap',
})

function FeeRow({ feeType, feeBps }: { feeType: 'buy' | 'sell'; feeBps?: BigNumber }): JSX.Element {
  const { t } = useTranslation()
  const textColor = getAlertColor(WarningSeverity.Medium) // FIXME(WALL-4686): need to dedupe warning severity usage with TokenWarningDesignTreatment
  const { formatNumberOrString } = useLocalizationContext()
  const fee: string = feeBps
    ? formatNumberOrString({ value: feeBps.toNumber() / 10_000, type: NumberType.Percentage })
    : '0%'
  return (
    <Flex row width="100%" justifyContent="space-between" gap="$spacing4">
      <Text variant="body2" color="$neutral2">
        {feeType === 'buy' ? capitalize(t('token.fee.buy.label')) : capitalize(t('token.fee.sell.label'))}
      </Text>
      <Text color={textColor.text}>{fee}</Text>
    </Flex>
  )
}

function FeeDisplayTable({ buyFeeBps, sellFeeBps }: { buyFeeBps?: BigNumber; sellFeeBps?: BigNumber }): JSX.Element {
  return (
    <WarningModalInfoContainer>
      <FeeRow feeBps={buyFeeBps} feeType="buy" />
      <FeeRow feeBps={sellFeeBps} feeType="sell" />
    </WarningModalInfoContainer>
  )
}
