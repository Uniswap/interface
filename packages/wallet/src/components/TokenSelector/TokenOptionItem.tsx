import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { Keyboard } from 'react-native'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NumberType } from 'utilities/src/format/types'
import { TokenLogo } from 'wallet/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'wallet/src/components/TokenSelector/types'
import WarningIcon from 'wallet/src/components/icons/WarningIcon'
import { InlineNetworkPill } from 'wallet/src/components/network/NetworkPill'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import TokenWarningModal from 'wallet/src/features/tokens/TokenWarningModal'
import { useTokenWarningDismissed } from 'wallet/src/features/tokens/safetyHooks'
import { shortenAddress } from 'wallet/src/utils/addresses'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

interface OptionProps {
  option: TokenOption
  showNetworkPill: boolean
  showWarnings: boolean
  onPress: () => void
  showTokenAddress?: boolean
}

function _TokenOptionItem({
  option,
  showNetworkPill,
  showWarnings,
  onPress,
  showTokenAddress,
}: OptionProps): JSX.Element {
  const { currencyInfo, quantity, balanceUSD } = option
  const { currency, currencyId, safetyLevel, logoUrl } = currencyInfo

  const [showWarningModal, setShowWarningModal] = useState(false)
  const { tokenWarningDismissed, dismissWarningCallback } = useTokenWarningDismissed(currencyId)
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const balance = convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenPrice)

  const onPressTokenOption = useCallback(() => {
    if (
      showWarnings &&
      (safetyLevel === SafetyLevel.Blocked ||
        ((safetyLevel === SafetyLevel.MediumWarning || safetyLevel === SafetyLevel.StrongWarning) &&
          !tokenWarningDismissed))
    ) {
      Keyboard.dismiss()
      setShowWarningModal(true)
      return
    }

    onPress()
  }, [showWarnings, safetyLevel, tokenWarningDismissed, onPress])

  const onAcceptTokenWarning = useCallback(() => {
    dismissWarningCallback()
    setShowWarningModal(false)
    onPress()
  }, [dismissWarningCallback, onPress])

  return (
    <>
      <TouchableArea
        hapticFeedback
        hapticStyle={ImpactFeedbackStyle.Light}
        opacity={showWarnings && safetyLevel === SafetyLevel.Blocked ? 0.5 : 1}
        testID={`token-option-${currency.chainId}-${currency.symbol}`}
        width="100%"
        onPress={onPressTokenOption}>
        <Flex
          row
          alignItems="center"
          gap="$spacing8"
          justifyContent="space-between"
          py="$spacing12">
          <Flex row shrink alignItems="center" gap="$spacing12">
            <TokenLogo
              chainId={currency.chainId}
              name={currency.name}
              symbol={currency.symbol}
              url={currencyInfo.logoUrl ?? undefined}
            />
            <Flex shrink alignItems="flex-start">
              <Flex centered row gap="$spacing8">
                <Flex shrink>
                  <Text color="$neutral1" numberOfLines={1} variant="body1">
                    {currency.name}
                  </Text>
                </Flex>
                {(safetyLevel === SafetyLevel.Blocked ||
                  safetyLevel === SafetyLevel.StrongWarning) && (
                  <WarningIcon
                    height={iconSizes.icon16}
                    safetyLevel={safetyLevel}
                    strokeColorOverride="neutral3"
                    width={iconSizes.icon16}
                  />
                )}
              </Flex>
              <Flex centered row gap="$spacing8">
                <Text color="$neutral2" numberOfLines={1} variant="subheading2">
                  {getSymbolDisplayText(currency.symbol)}
                </Text>
                {!currency.isNative && showTokenAddress && (
                  <Flex shrink>
                    <Text color="$neutral3" numberOfLines={1} variant="subheading2">
                      {shortenAddress(currency.address)}
                    </Text>
                  </Flex>
                )}
                {showNetworkPill && <InlineNetworkPill chainId={currency.chainId} />}
              </Flex>
            </Flex>
          </Flex>

          {quantity && quantity !== 0 ? (
            <Flex alignItems="flex-end">
              <Text variant="body1">
                {formatNumberOrString({ value: quantity, type: NumberType.TokenTx })}
              </Text>
              <Text color="$neutral2" variant="subheading2">
                {balance}
              </Text>
            </Flex>
          ) : null}
        </Flex>
      </TouchableArea>

      {showWarningModal ? (
        <TokenWarningModal
          isVisible
          currencyId={currencyId}
          safetyLevel={safetyLevel}
          tokenLogoUrl={logoUrl}
          onAccept={onAcceptTokenWarning}
          onClose={(): void => setShowWarningModal(false)}
        />
      ) : null}
    </>
  )
}

export const TokenOptionItem = React.memo(_TokenOptionItem)
