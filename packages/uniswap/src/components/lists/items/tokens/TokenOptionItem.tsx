import { memo, useCallback, useState } from 'react'
import { Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import Check from 'ui/src/assets/icons/check.svg'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { OptionItem, OptionItemProps } from 'uniswap/src/components/lists/items/OptionItem'
import { TokenOptionItemContextMenu } from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import { TokenOption } from 'uniswap/src/components/lists/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isInterface, isWeb } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

// @deprecated
interface LegacyTokenOptionItemProps {
  option: TokenOption
  showWarnings: boolean
  onPress: () => void
  showTokenAddress?: boolean
  tokenWarningDismissed: boolean
  quantity: number | null
  // TODO(WEB-4731): Remove isKeyboardOpen dependency
  isKeyboardOpen?: boolean
  // TODO(WEB-3643): Share localization context with WEB
  // (balance, quantityFormatted)
  balance: string
  quantityFormatted?: string
  isSelected?: boolean
}

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
  const colors = useSporeColors()

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
          <Check color={colors.accent1.get()} height={iconSizes.icon20} width={iconSizes.icon20} />
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

function _LegacyTokenOptionItem(props: LegacyTokenOptionItemProps): JSX.Element {
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
  }, [setShowWarningModal])

  const { value: isContextMenuOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)

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
    setShowWarningModal(false)
    onPress()
  }, [onPress])

  return (
    <TokenOptionItemContextMenu currency={currency} isOpen={isContextMenuOpen} closeMenu={closeContextMenu}>
      <TouchableArea
        animation="300ms"
        width="100%"
        opacity={(showWarnings && severity === WarningSeverity.Blocked) || isUnsupported ? 0.5 : 1}
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
        onPress={onPressTokenOption}
        onLongPress={openContextMenu}
      >
        {isWeb ? (
          // eslint-disable-next-line react/forbid-elements
          <div onContextMenu={openContextMenu}>
            <LegacyBaseTokenOptionItem {...props} />
          </div>
        ) : (
          <LegacyBaseTokenOptionItem {...props} />
        )}
      </TouchableArea>

      <TokenWarningModal
        currencyInfo0={currencyInfo}
        isVisible={showWarningModal}
        closeModalOnly={(): void => setShowWarningModal(false)}
        onAcknowledge={onAcceptTokenWarning}
      />
    </TokenOptionItemContextMenu>
  )
}

export interface TokenOptionItemProps {
  option: TokenOption
  onPress: () => void
  showTokenAddress?: boolean
  rightElement?: JSX.Element
  showDisabled?: boolean
  modalInfo?: OptionItemProps['modalInfo']
}

function isLegacyTokenOptionItemProps(
  props: TokenOptionItemProps | LegacyTokenOptionItemProps,
): props is LegacyTokenOptionItemProps {
  return 'balance' in props
}

const BaseTokenOptionItem = memo(function _BaseTokenOptionItem(
  props: TokenOptionItemProps & { openContextMenu?: () => void },
): JSX.Element {
  const { option, onPress, showTokenAddress, rightElement, showDisabled, modalInfo, openContextMenu } = props
  const { currencyInfo } = option
  const { currency } = currencyInfo

  // in lists like token selector & search, we only show the warning icon if token is >=Medium severity
  const severity = getTokenWarningSeverity(currencyInfo)
  const { colorSecondary: warningIconColor } = getWarningIconColors(severity)

  return (
    <OptionItem
      image={
        <TokenLogo
          chainId={currency.chainId}
          name={currency.name}
          symbol={currency.symbol}
          url={currencyInfo.logoUrl ?? undefined}
        />
      }
      title={currency.name ?? currency.symbol ?? ''}
      subtitle={
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
      }
      badge={
        warningIconColor ? (
          <Flex>
            <WarningIcon severity={severity} size="$icon.16" strokeColorOverride={warningIconColor} />
          </Flex>
        ) : undefined
      }
      rightElement={rightElement}
      disabled={showDisabled}
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      modalInfo={modalInfo}
      onPress={onPress}
      onLongPress={openContextMenu}
    />
  )
})

export const TokenOptionItem = memo(function _TokenOptionItem(
  props: TokenOptionItemProps | LegacyTokenOptionItemProps,
): JSX.Element {
  const { value: isContextMenuOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)

  if (!isLegacyTokenOptionItemProps(props)) {
    return (
      <TokenOptionItemContextMenu
        currency={props.option.currencyInfo.currency}
        isOpen={isContextMenuOpen}
        closeMenu={closeContextMenu}
      >
        {isWeb ? (
          // eslint-disable-next-line react/forbid-elements
          <div onContextMenu={openContextMenu}>
            <BaseTokenOptionItem {...props} />
          </div>
        ) : (
          <BaseTokenOptionItem {...props} openContextMenu={openContextMenu} />
        )}
      </TokenOptionItemContextMenu>
    )
  }

  return <_LegacyTokenOptionItem {...props} />
})
