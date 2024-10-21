import React, { useCallback, useState } from 'react'
import { Flex, ImpactFeedbackStyle, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/TokenSelector/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { getWarningIconColorOverride } from 'uniswap/src/components/warnings/utils'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { shortenAddress } from 'uniswap/src/utils/addresses'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isInterface } from 'utilities/src/platform'

interface OptionProps {
  option: TokenOption
  showWarnings: boolean
  onPress: () => void
  showTokenAddress?: boolean
  tokenWarningDismissed: boolean
  dismissWarningCallback: () => void
  quantity: number | null
  // TODO(WEB-4731): Remove isKeyboardOpen dependency
  isKeyboardOpen?: boolean
  // TODO(WEB-3643): Share localization context with WEB
  // (balance, quantityFormatted)
  balance: string
  quantityFormatted?: string
  isSelected?: boolean
}

function getTokenWarningDetails(currencyInfo: CurrencyInfo): {
  severity: WarningSeverity | undefined
  isWarningSevere: boolean
  isNonDefaultList: boolean
  isBlocked: boolean
} {
  const { safetyLevel, safetyInfo } = currencyInfo
  const severity = getTokenWarningSeverity(currencyInfo)
  const isWarningSevere =
    severity === WarningSeverity.Blocked || severity === WarningSeverity.High || severity === WarningSeverity.Medium
  const isNonDefaultList =
    safetyLevel === SafetyLevel.MediumWarning ||
    safetyLevel === SafetyLevel.StrongWarning ||
    safetyInfo?.tokenList === TokenList.NonDefault
  const isBlocked = severity === WarningSeverity.Blocked || safetyLevel === SafetyLevel.Blocked
  return {
    severity,
    isWarningSevere,
    isNonDefaultList,
    isBlocked,
  }
}

function _TokenOptionItem({
  option,
  showWarnings,
  onPress,
  showTokenAddress,
  tokenWarningDismissed,
  dismissWarningCallback,
  balance,
  quantity,
  quantityFormatted,
  isKeyboardOpen,
  isSelected,
}: OptionProps): JSX.Element {
  const { currencyInfo, isUnsupported } = option
  const { currency } = currencyInfo
  const [showWarningModal, setShowWarningModal] = useState(false)
  const tokenProtectionEnabled = useFeatureFlag(FeatureFlags.TokenProtection)

  const { severity, isBlocked, isNonDefaultList, isWarningSevere } = getTokenWarningDetails(currencyInfo)
  const warningIconColor = getWarningIconColorOverride(severity)
  const shouldShowWarningModalOnPress = !tokenProtectionEnabled
    ? isBlocked || (isNonDefaultList && !tokenWarningDismissed)
    : isWarningSevere && !tokenWarningDismissed

  const handleShowWarningModal = useCallback((): void => {
    dismissNativeKeyboard()
    setShowWarningModal(true)
  }, [setShowWarningModal])

  const onPressTokenOption = useCallback(() => {
    if (showWarnings && shouldShowWarningModalOnPress) {
      // On mobile web we need to wait for the keyboard to hide
      // before showing the modal to avoid height issues
      if (isKeyboardOpen && isInterface) {
        const activeElement = document.activeElement as HTMLElement | null
        activeElement?.blur()
        setTimeout(handleShowWarningModal, 700)
      } else {
        handleShowWarningModal()
      }
      return
    }

    onPress()
  }, [showWarnings, shouldShowWarningModalOnPress, onPress, isKeyboardOpen, handleShowWarningModal])

  const onAcceptTokenWarning = useCallback(() => {
    dismissWarningCallback()
    setShowWarningModal(false)
    onPress()
  }, [dismissWarningCallback, onPress])

  return (
    <>
      <TouchableArea
        hapticFeedback
        animation="300ms"
        hapticStyle={ImpactFeedbackStyle.Light}
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
        opacity={(showWarnings && severity === WarningSeverity.Blocked) || isUnsupported ? 0.5 : 1}
        width="100%"
        onPress={onPressTokenOption}
      >
        <Flex
          row
          alignItems="center"
          gap="$spacing8"
          justifyContent="space-between"
          px="$spacing16"
          py="$spacing12"
          style={{
            pointerEvents: 'auto',
          }}
          testID={`token-option-${currency.chainId}-${currency.symbol}`}
        >
          <Flex row shrink alignItems="center" gap="$spacing12">
            <TokenLogo
              chainId={currency.chainId}
              name={currency.name}
              symbol={currency.symbol}
              url={currencyInfo.logoUrl ?? undefined}
            />
            <Flex shrink>
              <Flex row alignItems="center" gap="$spacing8">
                <Text color="$neutral1" numberOfLines={1} variant="body1">
                  {currency.name}
                </Text>
                {warningIconColor && (
                  <Flex>
                    <WarningIcon severity={severity} size="$icon.16" strokeColorOverride={warningIconColor} />
                  </Flex>
                )}
              </Flex>
              <Flex row alignItems="center" gap="$spacing8">
                <Text color="$neutral2" numberOfLines={1} variant="body3">
                  {getSymbolDisplayText(currency.symbol)}
                </Text>
                {!currency.isNative && showTokenAddress && (
                  <Flex shrink>
                    <Text color="$neutral3" numberOfLines={1} variant="body3">
                      {shortenAddress(currency.address)}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Flex>

          {isSelected && (
            <Flex grow alignItems="flex-end" justifyContent="center">
              <Check color="$accent1" size={iconSizes.icon20} />
            </Flex>
          )}

          {!isSelected && quantity && quantity !== 0 ? (
            <Flex alignItems="flex-end">
              <Text variant="body1">{balance}</Text>
              {quantityFormatted && (
                <Text color="$neutral2" variant="body3">
                  {quantityFormatted}
                </Text>
              )}
            </Flex>
          ) : null}
        </Flex>
      </TouchableArea>

      <TokenWarningModal
        currencyInfo0={currencyInfo}
        isVisible={showWarningModal}
        closeModalOnly={(): void => setShowWarningModal(false)}
        onAcknowledge={onAcceptTokenWarning}
      />
    </>
  )
}

export const TokenOptionItem = React.memo(_TokenOptionItem)
