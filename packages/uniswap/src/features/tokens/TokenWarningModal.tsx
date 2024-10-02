import { BigNumber } from '@ethersproject/bignumber'
import { useState } from 'react'
import { Trans } from 'react-i18next'
import { capitalize } from 'tsafe'
import { AnimateTransition, Flex, LabeledCheckbox, Text, TouchableArea, styled, useSporeColors } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { BlockaidLogo } from 'ui/src/components/logos/BlockaidLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningModalContent } from 'uniswap/src/components/modals/WarningModal/WarningModal'
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
  getShouldHaveCombinedPluralTreatment,
  getTokenWarningDesignTreatment,
  useModalHeaderText,
  useModalSubtitleText,
} from 'uniswap/src/features/tokens/safetyUtils'
import { useTranslation } from 'uniswap/src/i18n'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'

interface TokenWarningProps {
  currencyInfo0: CurrencyInfo // required, primary currency
  currencyInfo1?: CurrencyInfo // defined in case of 2-token warnings; i.e. possible on the web's Pool Details Page or prefilled via /swap?inputAddress=0x...&outputAddress=0x...
  isInfoOnlyWarning?: boolean // if this is an informational-only warning. Hides the Reject button
  shouldBeCombinedPlural?: boolean // some 2-token warnings will be combined into one plural modal (see `getShouldHaveCombinedPluralTreatment`)
  hasSecondWarning?: boolean // true if this is a 2-token warning with two separate warning screens
}

interface TokenWarningModalContentProps extends TokenWarningProps {
  onRejectButton: () => void
  onAcknowledgeButton: () => void
}
interface TokenWarningModalProps extends TokenWarningProps {
  isVisible: boolean
  onReject?: () => void // callback on user rejecting warning (i.e., may close the modal & clear all inputs)
  onToken0BlockAcknowledged?: () => void // callback containing custom behavior for a blocked token
  onToken1BlockAcknowledged?: () => void
  closeModalOnly: () => void // callback that purely just closes the modal
  onAcknowledge: () => void
}

function TokenWarningModalContent({
  currencyInfo0,
  currencyInfo1,
  isInfoOnlyWarning,
  onRejectButton,
  onAcknowledgeButton,
  shouldBeCombinedPlural,
  hasSecondWarning,
}: TokenWarningModalContentProps): JSX.Element | null {
  const { t } = useTranslation()
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false) // TODO(WALL-4596): implement dismissedTokenWarnings redux

  const designTreatment = getTokenWarningDesignTreatment(currencyInfo0.currency, currencyInfo0.safetyInfo)
  const isFeeRelatedWarning = getIsFeeRelatedWarning(currencyInfo0.currency, currencyInfo0.safetyInfo)

  const mockWarningSeverity = WarningSeverity.Medium // FIXME(WALL-4686): temp mock var; need to dedupe warning severity usage with TokenWarningDesignTreatment

  const titleText = useModalHeaderText(
    currencyInfo0.currency,
    currencyInfo0.safetyInfo,
    shouldBeCombinedPlural ? currencyInfo1?.currency : undefined,
    shouldBeCombinedPlural ? currencyInfo1?.safetyInfo : undefined,
  )
  const subtitleText = useModalSubtitleText(
    currencyInfo0.currency,
    currencyInfo0.safetyInfo,
    shouldBeCombinedPlural ? currencyInfo1?.currency : undefined,
    shouldBeCombinedPlural ? currencyInfo1?.safetyInfo : undefined,
  )

  if (designTreatment === TokenWarningDesignTreatment.None) {
    return null
  }

  const { background: backgroundIconColor, text: titleTextColor } = getAlertColor(mockWarningSeverity)

  return (
    <Flex>
      <WarningModalContent
        backgroundIconColor={backgroundIconColor}
        captionComponent={
          <Flex centered gap="$spacing12">
            <Text color="$neutral2" textAlign="center" variant="body2">
              {subtitleText}
            </Text>
            <LearnMoreLink textColor="$neutral1" url={uniswapUrls.helpArticleUrls.tokenWarning} />
          </Flex>
        }
        rejectText={
          // if this is an informational-only warning or a 2-token warning, we should always show the Reject / back button
          // or, if a token is blocked, it should not have a Reject button, only an Acknowledge button
          isInfoOnlyWarning || hasSecondWarning || designTreatment !== TokenWarningDesignTreatment.Blocked
            ? t('common.button.back')
            : undefined
        }
        acknowledgeText={
          // if this is an informational-only warning, we don't show the Acknowledge button at all
          isInfoOnlyWarning
            ? undefined
            : // if a token is blocked & is not part of a 2-token warning, the Acknowledge button should say "Close"
              designTreatment === TokenWarningDesignTreatment.Blocked && !hasSecondWarning
              ? t('common.button.close')
              : // otherwise, Acknowledge button should say "Continue"
                t('common.button.continue')
        }
        icon={<WarningIcon safetyLevel={currencyInfo0.safetyLevel} size="$icon.24" />} // TODO(WEB-4883): re-work WarningIcon according to severity, not safety level
        severity={mockWarningSeverity}
        titleComponent={
          <Text color={titleTextColor} variant="subheading1">
            {titleText}
          </Text>
        }
        onReject={onRejectButton}
        onClose={onRejectButton}
        onAcknowledge={onAcknowledgeButton}
      >
        {isFeeRelatedWarning && currencyInfo0.currency.isToken ? (
          <FeeDisplayTable
            buyFeeBps={currencyInfo0.currency.buyFeeBps}
            sellFeeBps={currencyInfo0.currency.sellFeeBps}
          />
        ) : (
          <>
            <ExplorerView currency={currencyInfo0.currency} modalName={ModalName.TokenWarningModal} />
            {shouldBeCombinedPlural && currencyInfo1 && (
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

        {!isInfoOnlyWarning && designTreatment === TokenWarningDesignTreatment.Low && (
          // only show "Don't show this warning again" checkbox if this is an actionable modal & the token is low-severity
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
      </WarningModalContent>
    </Flex>
  )
}

/**
 * Warning speedbump for selecting certain tokens.
 */
export default function TokenWarningModal({
  isVisible,
  currencyInfo0,
  currencyInfo1,
  isInfoOnlyWarning,
  onReject,
  onToken0BlockAcknowledged,
  onToken1BlockAcknowledged,
  onAcknowledge,
  closeModalOnly,
}: TokenWarningModalProps): JSX.Element | null {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)
  const colors = useSporeColors()

  // If BOTH tokens are blocked or BOTH are low-severity, they'll be combined into one plural modal
  const combinedPlural = getShouldHaveCombinedPluralTreatment(
    currencyInfo0.currency,
    currencyInfo0.safetyInfo,
    currencyInfo1?.currency,
    currencyInfo1?.safetyInfo,
  )
  const isBlocked0 =
    getTokenWarningDesignTreatment(currencyInfo0.currency, currencyInfo0.safetyInfo) ===
    TokenWarningDesignTreatment.Blocked
  const isBlocked1 =
    getTokenWarningDesignTreatment(currencyInfo1?.currency, currencyInfo1?.safetyInfo) ===
    TokenWarningDesignTreatment.Blocked

  const [warningIndex, setWarningIndex] = useState<0 | 1>(0)
  const hasSecondWarning = Boolean(!combinedPlural && currencyInfo1)

  return tokenProtectionEnabled ? (
    <Modal
      backgroundColor={colors.surface1.val}
      isModalOpen={isVisible}
      name={ModalName.TokenWarningModal}
      onClose={onReject ?? closeModalOnly}
    >
      <Flex row justifyContent="space-between">
        {hasSecondWarning && (
          <Flex row $sm={{ position: 'absolute', top: -16 }}>
            <Text variant="body2">{warningIndex + 1}</Text>
            <Text color="$neutral2" variant="body2">
              {' '}
              / 2
            </Text>
          </Flex>
        )}
        <Flex $sm={{ display: 'none' }} justifyContent="flex-end">
          <TouchableArea onPress={onReject ?? closeModalOnly}>
            <X size="$icon.24" color="$neutral2" />
          </TouchableArea>
        </Flex>
      </Flex>
      <AnimateTransition currentIndex={warningIndex} animationType={warningIndex === 0 ? 'forward' : 'backward'}>
        <TokenWarningModalContent
          currencyInfo0={currencyInfo0}
          currencyInfo1={currencyInfo1}
          isInfoOnlyWarning={!hasSecondWarning && isInfoOnlyWarning} // modal should be actionable if it is a 2-token warning (go to next token)
          hasSecondWarning={hasSecondWarning}
          shouldBeCombinedPlural={combinedPlural}
          onRejectButton={onReject ?? closeModalOnly}
          onAcknowledgeButton={() => {
            if (hasSecondWarning) {
              setWarningIndex(1)
            } else if (isBlocked0) {
              // If both tokens are blocked, they'll be combined into one plural modal. See `getShouldHaveCombinedPluralTreatment`.
              combinedPlural && isBlocked1 && onToken1BlockAcknowledged?.()
              onToken0BlockAcknowledged?.()
              closeModalOnly()
            } else {
              onAcknowledge()
            }
          }}
        />
        {hasSecondWarning && currencyInfo1 && (
          <TokenWarningModalContent
            hasSecondWarning
            currencyInfo0={currencyInfo1}
            onRejectButton={() => {
              setWarningIndex(0)
            }}
            onAcknowledgeButton={() => {
              if (isBlocked0 || isBlocked1) {
                isBlocked0 && onToken0BlockAcknowledged?.()
                isBlocked1 && onToken1BlockAcknowledged?.()
                closeModalOnly()
              } else {
                onAcknowledge()
              }
            }}
          />
        )}
      </AnimateTransition>
    </Modal>
  ) : (
    <DeprecatedTokenWarningModal
      currencyId={currencyId(currencyInfo0.currency)}
      disableAccept={isInfoOnlyWarning}
      isVisible={isVisible}
      safetyLevel={currencyInfo0.safetyLevel}
      tokenLogoUrl={currencyInfo0?.logoUrl}
      onAccept={onAcknowledge}
      onClose={closeModalOnly}
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
  py: isMobileApp ? '$spacing8' : '$spacing12',
  alignItems: 'center',
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
