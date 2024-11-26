import { BigNumber } from '@ethersproject/bignumber'
import { Percent } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
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
import { useTranslation } from 'uniswap/src/i18n'
import { currencyId, currencyIdToAddress } from 'uniswap/src/utils/currencyId'
import { isMobileApp } from 'utilities/src/platform'

interface TokenWarningProps {
  currencyInfo0: CurrencyInfo // required, primary currency
  currencyInfo1?: CurrencyInfo // defined in case of 2-token warnings; i.e. possible on the web's Pool Details Page or prefilled via /swap?inputAddress=0x...&outputAddress=0x...
  isInfoOnlyWarning?: boolean // if this is an informational-only warning. Hides the Reject button
  shouldBeCombinedPlural?: boolean // some 2-token warnings will be combined into one plural modal (see `getShouldHaveCombinedPluralTreatment`)
  hasSecondWarning?: boolean // true if this is a 2-token warning with two separate warning screens
  feeOnTransferOverride?: { fee: Percent; feeType: 'buy' | 'sell' } // used on SwapReviewScreen to force TokenWarningModal to display FOT content and overrides fee with TradingApi's input/output tax
}

interface TokenWarningModalContentProps extends TokenWarningProps {
  onRejectButton: () => void
  onAcknowledgeButton: () => void
  onDismissTokenWarning0: () => void
  onDismissTokenWarning1?: () => void
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
  feeOnTransferOverride,
  onDismissTokenWarning0,
  onDismissTokenWarning1,
}: TokenWarningModalContentProps): JSX.Element | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  const tokenProtectionWarning = feeOnTransferOverride
    ? getFeeWarning(feeOnTransferOverride.fee)
    : getTokenProtectionWarning(currencyInfo0)
  const severity = getSeverityFromTokenProtectionWarning(tokenProtectionWarning)
  const feePercent = feeOnTransferOverride
    ? parseFloat(feeOnTransferOverride.fee.toFixed())
    : getFeeOnTransfer(currencyInfo0.currency)
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
    tokenList: currencyInfo0.safetyInfo?.tokenList,
    feePercent,
    shouldHavePluralTreatment: shouldBeCombinedPlural,
    formatPercent,
  })
  const { text: titleTextColor } = getAlertColor(severity)

  // Logic for "don't show again" dismissal of warnings
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false)
  const showCheckbox = !isInfoOnlyWarning && severity === WarningSeverity.Low
  const showBlockaidLogo = !isFeeRelatedWarning && severity !== WarningSeverity.Low

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

  return (
    <Flex>
      <WarningModalContent
        modalName={ModalName.TokenWarningModal}
        rejectButtonTheme="tertiary"
        captionComponent={
          <Flex centered gap="$spacing12">
            <Text color="$neutral2" textAlign="center" variant="body2">
              {subtitleText}
            </Text>
            <LearnMoreLink textColor="$neutral1" url={uniswapUrls.helpArticleUrls.tokenWarning} />
          </Flex>
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

// feePercent is the percentage as an integer. I.e. feePercent = 5 means 5%
export function FeeRow({ feeType, feePercent = 0 }: { feeType: 'buy' | 'sell'; feePercent?: number }): JSX.Element {
  const { t } = useTranslation()
  // Convert percentage to basis points (multiply by 100) to get integer values
  const basisPoints = Math.round(feePercent * 100)
  const tokenProtectionWarning = getFeeWarning(new Percent(basisPoints, 10000))
  const severity = getSeverityFromTokenProtectionWarning(tokenProtectionWarning)
  const { headerText: textColor } = getAlertColor(severity)
  const { formatPercent } = useLocalizationContext()
  return (
    <Flex row width="100%" justifyContent="space-between" gap="$spacing4">
      <Text variant="body2" color="$neutral2">
        {feeType === 'buy' ? capitalize(t('token.fee.buy.label')) : capitalize(t('token.fee.sell.label'))}
      </Text>
      <Text color={textColor}>{formatPercent(feePercent)}</Text>
    </Flex>
  )
}

export function FeeDisplayTable({
  buyFeeBps,
  sellFeeBps,
}: {
  buyFeeBps?: BigNumber
  sellFeeBps?: BigNumber
}): JSX.Element {
  const buyFeePercent = buyFeeBps ? buyFeeBps.toNumber() / 100 : undefined
  const sellFeePercent = sellFeeBps ? sellFeeBps.toNumber() / 100 : undefined
  return (
    <WarningModalInfoContainer>
      <FeeRow feePercent={buyFeePercent} feeType="buy" />
      <FeeRow feePercent={sellFeePercent} feeType="sell" />
    </WarningModalInfoContainer>
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
    rejectText: t('common.button.back'),
    acknowledgeText: t('common.button.continue'),
  }
}
