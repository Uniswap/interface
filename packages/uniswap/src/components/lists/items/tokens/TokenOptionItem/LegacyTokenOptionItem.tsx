import { isWebApp, isWebPlatform } from '@universe/environment'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { withSporeCurve } from '@universe/tailwind/animations/reanimated'
import { memo, useCallback, useState } from 'react'
import { useAnimatedStyle } from 'react-native-reanimated'
import { Check } from 'ui/src/components/icons/Check'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CONTEXT_MENU_ACTIONS } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/contextMenuActions'
import {
  type LegacyTokenOptionItemProps,
  TokenContextMenuVariant,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/types'
import { TokenOptionItemContextMenu } from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import { TokenOptionWarningBadge } from 'uniswap/src/components/lists/items/tokens/TokenOptionWarningBadge'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const LegacyBaseTokenOptionItem = memo(function LegacyBaseTokenOptionItem({
  option,
  showTokenAddress,
  balance,
  quantity,
  quantityFormatted,
  isSelected,
}: LegacyTokenOptionItemProps): JSX.Element {
  const { currencyInfo } = option
  const { currency } = currencyInfo

  const severity = getTokenWarningSeverity(currencyInfo)
  // in token selector, we only show the warning icon if token is >=Medium severity
  const { colorSecondary: warningIconColor } = getWarningIconColors(severity)

  return (
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
              <TokenOptionWarningBadge
                currencyInfo={currencyInfo}
                severity={severity}
                strokeColorOverride={warningIconColor}
              />
            )}
          </Flex>
          <Flex row alignItems="center" gap="$spacing8">
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {getSymbolDisplayText(currency.symbol)}
            </Text>
            {!currency.isNative && showTokenAddress && (
              <Flex shrink>
                <Text color="$neutral3" numberOfLines={1} variant="body3">
                  {shortenAddress({ address: currency.address })}
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Flex>

      {isSelected && (
        <Flex grow alignItems="flex-end" justifyContent="center">
          <Check color="$accent1" size="$icon.20" />
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
  )
})

export function LegacyTokenOptionItem(props: LegacyTokenOptionItemProps): JSX.Element {
  const { option, showWarnings, onPress, tokenWarningDismissed, isKeyboardOpen } = props
  const { currencyInfo, isUnsupported } = option
  const { currency } = currencyInfo
  const [showWarningModal, setShowWarningModal] = useState(false)

  const severity = getTokenWarningSeverity(currencyInfo)
  const isBlocked = severity === WarningSeverity.Blocked

  const shouldShowWarningModalOnPress = isBlocked || (severity !== WarningSeverity.None && !tokenWarningDismissed)

  const handleShowWarningModal = useCallback((): void => {
    dismissNativeKeyboard()
    setShowWarningModal(true)
  }, [])

  const { value: isContextMenuOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)
  const { hapticFeedback } = useHapticFeedback()

  // Reanimated leg (native) of the legacy Tamagui '300ms' opacity dim, tracked continuously as the
  // blocked/unsupported state changes (not a mount fade: no enterStyle on the legacy node).
  // withSporeCurve is native-only (see its docstring), so on web this style is never applied — the
  // isWebPlatform branch below restores the literal Tamagui opacity/animation props instead.
  const targetOpacity = (showWarnings && severity === WarningSeverity.Blocked) || isUnsupported ? 0.5 : 1
  const dimAnimatedStyle = useAnimatedStyle(
    () => ({ opacity: withSporeCurve('300ms', targetOpacity) }),
    [targetOpacity],
  )

  const onPressTokenOption = useCallback(() => {
    if (showWarnings && shouldShowWarningModalOnPress) {
      // On mobile web we need to wait for the keyboard to hide
      // before showing the modal to avoid height issues
      if (isKeyboardOpen && isWebApp) {
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
    setShowWarningModal(false)
    onPress()
  }, [onPress])

  return (
    <TokenOptionItemContextMenu
      actions={CONTEXT_MENU_ACTIONS[TokenContextMenuVariant.TokenSelector]}
      currency={currency}
      isOpen={isContextMenuOpen}
      closeMenu={closeContextMenu}
    >
      <AnimatedFlex
        width="100%"
        style={isWebPlatform ? undefined : dimAnimatedStyle}
        {...(isWebPlatform && { animation: '300ms' as const, animateOnly: ['opacity'], opacity: targetOpacity })}
      >
        <TouchableArea
          hoverStyle={{ backgroundColor: '$surface1Hovered' }}
          onPress={onPressTokenOption}
          onLongPress={async (): Promise<void> => {
            await hapticFeedback.success()
            dismissNativeKeyboard()
            openContextMenu()
          }}
        >
          {isWebPlatform ? (
            // oxlint-disable-next-line react/forbid-elements -- needed here
            <div onContextMenu={openContextMenu}>
              <LegacyBaseTokenOptionItem {...props} />
            </div>
          ) : (
            <LegacyBaseTokenOptionItem {...props} />
          )}
        </TouchableArea>
      </AnimatedFlex>

      <TokenWarningModal
        currencyInfo0={currencyInfo}
        isVisible={showWarningModal}
        closeModalOnly={(): void => setShowWarningModal(false)}
        onAcknowledge={onAcceptTokenWarning}
      />
    </TokenOptionItemContextMenu>
  )
}
