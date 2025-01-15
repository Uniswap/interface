import { TFunction } from 'i18next'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { AnimateTransition, Flex, LabeledCheckbox, Text, useSporeColors } from 'ui/src'
import { BlockaidLogo } from 'ui/src/components/logos/BlockaidLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { WarningModalContent } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { getAlertColor } from 'uniswap/src/components/modals/WarningModal/getAlertColor'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import DeprecatedTokenWarningModal from 'uniswap/src/features/tokens/DeprecatedTokenWarningModal'
import { TokenWarningFlagsTable } from 'uniswap/src/features/tokens/TokenWarningFlagsTable'
import {
  TokenProtectionWarning,
  getFeeOnTransfer,
  getFeeWarning,
  getIsFeeRelatedWarning,
  getModalHeaderText,
  getModalSubtitleText,
  getSeverityFromTokenProtectionWarning,
  getShouldHaveCombinedPluralTreatment,
  getTokenProtectionWarning,
  getTokenWarningSeverity,
} from 'uniswap/src/features/tokens/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'

interface TokenWarningProps {
  currencyInfo0: CurrencyInfo // required, primary currency
  currencyInfo1?: CurrencyInfo // defined in case of 2-token warnings; i.e. possible on the web's Pool Details Page or prefilled via /swap?inputAddress=0x...&outputAddress=0x...
  isInfoOnlyWarning?: boolean // if this is an informational-only warning. Hides the Reject button
  shouldBeCombinedPlural?: boolean // some 2-token warnings will be combined into one plural modal (see `getShouldHaveCombinedPluralTreatment`)
  hasSecondWarning?: boolean // true if this is a 2-token warning with two separate warning screens
  feeOnTransferOverride?: { buyFeePercent?: number; sellFeePercent?: number } // if defined, forces TokenWarningModal to display FOT content over any other warning content & overrides GQL fee info with TradingApi quote's fee info, which is more correct for dynamic FoT fees
}

interface TokenWarningModalContentProps extends TokenWarningProps {
  onRejectButton: () => void
  onAcknowledgeButton: () => void
  onDismissTokenWarning0: () => void
  onDismissTokenWarning1?: () => void
}
export interface TokenWarningModalProps extends TokenWarningProps {
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
  feeOnTransferOverride,
  onDismissTokenWarning0,
  onDismissTokenWarning1,
}: TokenWarningModalContentProps): JSX.Element | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const tokenProtectionWarning =
    feeOnTransferOverride?.buyFeePercent || feeOnTransferOverride?.sellFeePercent
      ? getFeeWarning(Math.max(feeOnTransferOverride.buyFeePercent ?? 0, feeOnTransferOverride.sellFeePercent ?? 0))
      : getTokenProtectionWarning(currencyInfo0)
  const severity = getSeverityFromTokenProtectionWarning(tokenProtectionWarning)
  const { buyFeePercent, sellFeePercent } = getFeeOnTransfer(currencyInfo0.currency)
  const isFeeRelatedWarning = getIsFeeRelatedWarning(tokenProtectionWarning)
  const tokenSymbol = currencyInfo0.currency.symbol
  const titleText = getModalHeaderText({
    t,
    tokenSymbol0: tokenSymbol,
    tokenSymbol1: currencyInfo1?.currency.symbol,
    tokenProtectionWarning,
    shouldHavePluralTreatment: shouldBeCombinedPlural,
  })
  const subtitleText = getModalSubtitleText({
    t,
    tokenProtectionWarning,
    tokenSymbol,
    buyFeePercent: feeOnTransferOverride?.buyFeePercent ?? buyFeePercent,
    sellFeePercent: feeOnTransferOverride?.sellFeePercent ?? sellFeePercent,
    shouldHavePluralTreatment: shouldBeCombinedPlural,
    formatPercent,
  })
  const { headerText: titleTextColor } = getAlertColor(severity)

  // Logic for "don't show again" dismissal of warnings
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false)
  const showCheckbox = !isInfoOnlyWarning && severity === WarningSeverity.Low
  const showBlockaidLogo =
    !isFeeRelatedWarning && severity !== WarningSeverity.Low && severity !== WarningSeverity.Blocked

  const onAcknowledge = (): void => {
    if (showCheckbox) {
      if (dontShowAgain) {
        onDismissTokenWarning0()
        onDismissTokenWarning1?.()
      }
    }
    onAcknowledgeButton()
  }

  if (severity === WarningSeverity.None) {
    return null
  }

  const { rejectText, acknowledgeText } = getWarningModalButtonTexts(
    t,
    !!isInfoOnlyWarning,
    severity,
    !!hasSecondWarning,
  )

  const analyticsProperties = {
    tokenSymbol,
    tokenAddress: currencyIdToAddress(currencyInfo0.currencyId),
    chainId: currencyInfo0.currency.chainId,
    // if both tokens are low or blocked severities, their warnings are combined into 1 plural screen
    tokenSymbol1: currencyInfo1?.currency.symbol,
    tokenAddress1: currencyInfo1 && currencyIdToAddress(currencyInfo1.currencyId),
    warningSeverity: WarningSeverity[severity],
    tokenProtectionWarning: TokenProtectionWarning[tokenProtectionWarning],
    buyFeePercent: feeOnTransferOverride?.buyFeePercent ?? buyFeePercent,
    sellFeePercent: feeOnTransferOverride?.sellFeePercent ?? sellFeePercent,
    safetyInfo: currencyInfo0.safetyInfo,
    ...(showCheckbox && { dismissTokenWarningCheckbox: dontShowAgain }),
  }

  return (
    <Trace logImpression modal={ModalName.TokenWarningModal} properties={analyticsProperties}>
      <Flex>
        <WarningModalContent
          modalName={ModalName.TokenWarningModal}
          rejectButtonTheme="tertiary"
          captionComponent={
            <Text color="$neutral2" textAlign="center" variant="body3">
              {`${subtitleText} `}
              <LearnMoreLink
                display="inline"
                textColor="$neutral1"
                textVariant="buttonLabel3"
                url={uniswapUrls.helpArticleUrls.tokenWarning}
              />
            </Text>
          }
          rejectText={rejectText}
          acknowledgeText={acknowledgeText}
          icon={<WarningIcon heroIcon severity={severity} size="$icon.24" />}
          backgroundIconColor={false}
          severity={severity}
          titleComponent={
            <Text color={titleTextColor} variant="subheading1">
              {titleText}
            </Text>
          }
          onReject={onRejectButton}
          onClose={onRejectButton}
          onAcknowledge={onAcknowledge}
        >
          {tokenProtectionWarning !== TokenProtectionWarning.NonDefault && (
            <TokenWarningFlagsTable currencyInfo={currencyInfo0} tokenProtectionWarning={tokenProtectionWarning} />
          )}

          {showBlockaidLogo && (
            <Flex row centered>
              <Text variant="body3" color="$neutral3">
                <Trans
                  i18nKey="common.poweredBy"
                  components={{ name: <BlockaidLogo minHeight={10} minWidth={50} color="$neutral3" /> }}
                />
              </Text>
            </Flex>
          )}

          {showCheckbox && (
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
    </Trace>
  )
}

// Handle if user has previously dismissed a warning for either token
function useWarningModalCurrenciesDismissed(
  t0: CurrencyInfo,
  t1: CurrencyInfo | undefined,
  isInfoOnlyWarning?: boolean,
): {
  currencyInfo0: CurrencyInfo
  onDismissTokenWarning0: () => void
  currencyInfo1: CurrencyInfo | undefined
  onDismissTokenWarning1: () => void | undefined
} | null {
  const address0 = currencyIdToAddress(t0.currencyId)
  const address1 = t1 && currencyIdToAddress(t1.currencyId)
  const { tokenWarningDismissed: tokenWarningDismissed0, onDismissTokenWarning: onDismissTokenWarning0 } =
    useDismissedTokenWarnings(t0?.currency.isNative ? undefined : { chainId: t0.currency.chainId, address: address0 })
  const { tokenWarningDismissed: tokenWarningDismissed1, onDismissTokenWarning: onDismissTokenWarning1 } =
    useDismissedTokenWarnings(
      !t1 || !address1 || t1?.currency.isNative ? undefined : { chainId: t1.currency.chainId, address: address1 },
    )
  let currencyInfo0: CurrencyInfo | undefined = t0
  let currencyInfo1: CurrencyInfo | undefined = t1
  if (!isInfoOnlyWarning) {
    if (tokenWarningDismissed0 && tokenWarningDismissed1) {
      // If both tokens are dismissed
      return null
    } else if (tokenWarningDismissed0) {
      // If only the first token is dismissed, we use currencyInfo1 as primary token to show warning
      if (!t1) {
        return null
      }
      currencyInfo0 = t1 ?? undefined
    } else if (tokenWarningDismissed1) {
      // If only the second token is dismissed, we use currencyInfo0 as primary token to show warning
      currencyInfo0 = t0
      currencyInfo1 = undefined
    }
  }
  return { currencyInfo0, onDismissTokenWarning0, currencyInfo1, onDismissTokenWarning1 }
}

/**
 * Warning speedbump for selecting certain tokens.
 */
export default function TokenWarningModal({
  isVisible,
  currencyInfo0: t0,
  currencyInfo1: t1,
  isInfoOnlyWarning,
  feeOnTransferOverride,
  onReject,
  onToken0BlockAcknowledged,
  onToken1BlockAcknowledged,
  onAcknowledge,
  closeModalOnly,
}: TokenWarningModalProps): JSX.Element | null {
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)
  const colors = useSporeColors()
  const [warningIndex, setWarningIndex] = useState<0 | 1>(0)

  // Check for dismissed warnings
  const warningModalCurrencies = useWarningModalCurrenciesDismissed(t0, t1, isInfoOnlyWarning)
  if (!warningModalCurrencies) {
    return null
  }
  const { currencyInfo0, currencyInfo1, onDismissTokenWarning0, onDismissTokenWarning1 } = warningModalCurrencies

  // If BOTH tokens are blocked or BOTH are low-severity, they'll be combined into one plural modal
  const combinedPlural = getShouldHaveCombinedPluralTreatment(currencyInfo0, currencyInfo1)
  const isBlocked0 = getTokenWarningSeverity(currencyInfo0) === WarningSeverity.Blocked
  const isBlocked1 = getTokenWarningSeverity(currencyInfo1) === WarningSeverity.Blocked

  const hasSecondWarning = Boolean(!combinedPlural && getTokenWarningSeverity(currencyInfo1) !== WarningSeverity.None)

  return tokenProtectionEnabled ? (
    <Modal
      backgroundColor={colors.surface1.val}
      isModalOpen={isVisible}
      name={ModalName.TokenWarningModal}
      skipLogImpression={true} // impression trace logged in TokenWarningModalContent instead to handle multi-token warnings
      onClose={onReject ?? closeModalOnly}
    >
      {hasSecondWarning && (
        <Flex row $sm={{ position: 'absolute', top: -16 }}>
          <Text variant="body2">{warningIndex + 1}</Text>
          <Text color="$neutral2" variant="body2">
            {' / 2'}
          </Text>
        </Flex>
      )}
      <AnimateTransition currentIndex={warningIndex} animationType={warningIndex === 0 ? 'forward' : 'backward'}>
        <TokenWarningModalContent
          currencyInfo0={currencyInfo0}
          currencyInfo1={currencyInfo1}
          isInfoOnlyWarning={!hasSecondWarning && isInfoOnlyWarning} // modal should be actionable if it is a 2-token warning (go to next token)
          hasSecondWarning={hasSecondWarning}
          shouldBeCombinedPlural={combinedPlural}
          feeOnTransferOverride={feeOnTransferOverride}
          onRejectButton={onReject ?? closeModalOnly}
          onAcknowledgeButton={() => {
            if (hasSecondWarning) {
              setWarningIndex(1)
            } else if (isBlocked0) {
              // If both tokens are blocked, they'll be combined into one plural modal. See `getShouldHaveCombinedPluralTreatment`.
              combinedPlural && isBlocked1 && onToken1BlockAcknowledged?.()
              onToken0BlockAcknowledged?.()
              closeModalOnly()
            } else if (isInfoOnlyWarning) {
              closeModalOnly()
            } else {
              onAcknowledge()
            }
          }}
          onDismissTokenWarning0={onDismissTokenWarning0}
          onDismissTokenWarning1={onDismissTokenWarning1}
        />
        {hasSecondWarning && currencyInfo1 && (
          <TokenWarningModalContent
            hasSecondWarning
            currencyInfo0={currencyInfo1}
            onDismissTokenWarning0={onDismissTokenWarning1}
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

/*
Logic explanation

Reject button text
- if this is an informational-only warning or a 2-token warning, we should always show the Reject / back button
- or, if a token is blocked, it should not have a Reject button, only an Acknowledge button

Acknowledge button text
- if this is an informational-only warning, we don't show the Acknowledge button at all
- if a token is blocked & is not part of a 2-token warning, the Acknowledge button should say "Close"
- otherwise, Acknowledge button should say "Continue"
*/
export function getWarningModalButtonTexts(
  t: TFunction,
  isInfoOnlyWarning: boolean,
  severity: WarningSeverity,
  hasSecondWarning: boolean,
): {
  rejectText: string | undefined
  acknowledgeText: string | undefined
} {
  if (isInfoOnlyWarning) {
    return {
      rejectText: t('common.button.close'),
      acknowledgeText: undefined,
    }
  }

  if (severity === WarningSeverity.Blocked && !hasSecondWarning) {
    return {
      rejectText: undefined,
      acknowledgeText: t('common.button.close'),
    }
  }

  return {
    rejectText: t('common.button.goBack'),
    acknowledgeText: t('common.button.continue'),
  }
}
