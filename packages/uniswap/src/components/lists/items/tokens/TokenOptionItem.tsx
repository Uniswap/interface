import { memo, useCallback, useState } from 'react'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { FocusedRowControl, OptionItem, OptionItemProps } from 'uniswap/src/components/lists/items/OptionItem'
import {
  TokenContextMenuAction,
  TokenOptionItemContextMenu,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItemContextMenu'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { isWebApp, isWebPlatform } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export enum TokenContextMenuVariant {
  Search = 'search',
  TokenSelector = 'tokenSelector',
}

const CONTEXT_MENU_ACTIONS: Record<TokenContextMenuVariant, TokenContextMenuAction[]> = {
  [TokenContextMenuVariant.Search]: [
    TokenContextMenuAction.CopyAddress,
    ...(isWebPlatform ? [] : [TokenContextMenuAction.Favorite]),
    TokenContextMenuAction.Swap,
    TokenContextMenuAction.Send,
    TokenContextMenuAction.Receive,
    TokenContextMenuAction.Share,
  ],
  [TokenContextMenuVariant.TokenSelector]: [
    TokenContextMenuAction.CopyAddress,
    ...(isWebPlatform ? [] : [TokenContextMenuAction.Favorite]),
    TokenContextMenuAction.ViewDetails,
  ],
}

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
  }, [])

  const { value: isContextMenuOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)
  const { hapticFeedback } = useHapticFeedback()

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
      <TouchableArea
        animation="300ms"
        width="100%"
        opacity={(showWarnings && severity === WarningSeverity.Blocked) || isUnsupported ? 0.5 : 1}
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
        onPress={onPressTokenOption}
        onLongPress={async (): Promise<void> => {
          await hapticFeedback.success()
          dismissNativeKeyboard()
          openContextMenu()
        }}
      >
        {isWebPlatform ? (
          // biome-ignore  lint/correctness/noRestrictedElements: needed here
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
  focusedRowControl?: FocusedRowControl
  contextMenuVariant: TokenContextMenuVariant
}

function isLegacyTokenOptionItemProps(
  props: TokenOptionItemProps | LegacyTokenOptionItemProps,
): props is LegacyTokenOptionItemProps {
  return 'balance' in props
}

const BaseTokenOptionItem = memo(function _BaseTokenOptionItem(
  props: TokenOptionItemProps & { openContextMenu?: () => void },
): JSX.Element {
  const {
    option,
    onPress,
    showTokenAddress,
    rightElement,
    showDisabled,
    modalInfo,
    focusedRowControl,
    openContextMenu,
  } = props
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
                {shortenAddress({ address: currency.address })}
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
      focusedRowControl={focusedRowControl}
      onPress={onPress}
      onLongPress={() => {
        dismissNativeKeyboard()
        openContextMenu?.()
      }}
    />
  )
})

export const TokenOptionItem = memo(function _TokenOptionItem(
  props: TokenOptionItemProps | LegacyTokenOptionItemProps,
): JSX.Element {
  const { value: isContextMenuOpen, setFalse: closeContextMenu, setTrue: openContextMenu } = useBooleanState(false)
  const { hapticFeedback } = useHapticFeedback()

  if (!isLegacyTokenOptionItemProps(props)) {
    return (
      <TokenOptionItemContextMenu
        actions={CONTEXT_MENU_ACTIONS[props.contextMenuVariant]}
        currency={props.option.currencyInfo.currency}
        isOpen={isContextMenuOpen}
        closeMenu={closeContextMenu}
      >
        {isWebPlatform ? (
          // biome-ignore  lint/correctness/noRestrictedElements: needed here
          <div onContextMenu={openContextMenu}>
            <BaseTokenOptionItem {...props} />
          </div>
        ) : (
          <BaseTokenOptionItem
            {...props}
            openContextMenu={async (): Promise<void> => {
              await hapticFeedback.success()
              openContextMenu()
            }}
          />
        )}
      </TokenOptionItemContextMenu>
    )
  }

  return <_LegacyTokenOptionItem {...props} />
})
