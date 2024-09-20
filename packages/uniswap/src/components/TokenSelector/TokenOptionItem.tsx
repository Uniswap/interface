import React, { useCallback, useState } from 'react'
import { Flex, ImpactFeedbackStyle, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/TokenSelector/types'
import WarningIcon from 'uniswap/src/components/icons/WarningIcon'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { shortenAddress } from 'uniswap/src/utils/addresses'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { isInterface } from 'utilities/src/platform'

interface OptionProps {
  option: TokenOption
  showWarnings: boolean
  onDismiss?: () => void
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
  quantityFormatted: string
  isSelected?: boolean
}

function _TokenOptionItem({
  option,
  showWarnings,
  onDismiss,
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
  const { currency, safetyLevel } = currencyInfo
  const [showWarningModal, setShowWarningModal] = useState(false)

  const handleShowWarningModal = useCallback((): void => {
    onDismiss?.()
    setShowWarningModal(true)
  }, [onDismiss, setShowWarningModal])

  const onPressTokenOption = useCallback(() => {
    if (
      showWarnings &&
      (safetyLevel === SafetyLevel.Blocked ||
        ((safetyLevel === SafetyLevel.MediumWarning || safetyLevel === SafetyLevel.StrongWarning) &&
          !tokenWarningDismissed))
    ) {
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
  }, [showWarnings, safetyLevel, isKeyboardOpen, tokenWarningDismissed, handleShowWarningModal, onPress])

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
        opacity={(showWarnings && safetyLevel === SafetyLevel.Blocked) || isUnsupported ? 0.5 : 1}
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
                {(safetyLevel === SafetyLevel.Blocked || safetyLevel === SafetyLevel.StrongWarning) && (
                  <Flex>
                    <WarningIcon safetyLevel={safetyLevel} size="$icon.16" strokeColorOverride="neutral3" />
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
              <Text color="$neutral2" variant="body3">
                {quantityFormatted}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </TouchableArea>

      <TokenWarningModal
        currencyInfo0={currencyInfo}
        isVisible={showWarningModal}
        onAccept={onAcceptTokenWarning}
        onClose={(): void => setShowWarningModal(false)}
      />
    </>
  )
}

export const TokenOptionItem = React.memo(_TokenOptionItem)
