import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutChangeEvent } from 'react-native'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Button, ColorTokens, Flex, GeneratedIcon, getContrastPassingTextColor, useDynamicFontSizing } from 'ui/src'
import { IconButton } from 'ui/src/components/buttons/IconButton/IconButton'
import { GridView, X } from 'ui/src/components/icons'
import { opacify, validColor, fonts } from 'ui/src/theme'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { ElementName, MobileEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID, TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const CTA_MAX_LABEL_FONT_SIZE = fonts.buttonLabel1.fontSize
const CTA_MIN_LABEL_FONT_SIZE = fonts.buttonLabel4.fontSize
const CTA_MAX_CHAR_WIDTH_AT_MAX_FONT_SIZE = 10

const FadeProps = (ready: boolean, onLayout?: (event: LayoutChangeEvent) => void) => ({
  animation: 'quicker' as const,
  animateOnly: ['opacity'] as string[],
  opacity: ready ? 1 : 0,
  onLayout,
})

function CTAButton({
  title,
  element,
  onPress,
  onPressDisabled,
  testID,
  tokenColor,
  disabled,
  icon: Icon,
  onLayout,
  onIconLayout,
  labelFontSize,
  showLabel = true,
}: {
  title: string
  element: ElementName
  onPress: () => void
  onPressDisabled?: () => void
  testID?: TestIDType
  tokenColor?: string | null
  disabled?: boolean
  icon?: GeneratedIcon
  onLayout?: (event: LayoutChangeEvent) => void
  onIconLayout?: (event: LayoutChangeEvent) => void
  labelFontSize?: number
  showLabel?: boolean
}): JSX.Element {
  const usesDynamicFontSizing = Boolean(onLayout || onIconLayout)
  const iconColor = tokenColor ? getContrastPassingTextColor(tokenColor) : '$white'

  const buttonIcon = useMemo(() => {
    if (!Icon) {
      return undefined
    }

    if (!usesDynamicFontSizing) {
      return <Icon color={iconColor} />
    }

    return (
      <Flex {...FadeProps(showLabel, onIconLayout)}>
        <Icon size="$icon.24" color={iconColor} />
      </Flex>
    )
  }, [usesDynamicFontSizing, onIconLayout, Icon, showLabel, iconColor])

  return (
    <Trace logPress element={element} section={SectionName.TokenDetails}>
      <Button
        variant="branded"
        opacity={disabled ? 0.5 : undefined}
        icon={buttonIcon}
        backgroundColor={validColor(tokenColor)}
        size="large"
        testID={testID}
        onPress={disabled ? onPressDisabled : onPress}
      >
        {usesDynamicFontSizing ? (
          <Flex fill={!showLabel} {...FadeProps(showLabel, onLayout)}>
            <Button.Text fontSize={labelFontSize}>{title}</Button.Text>
          </Flex>
        ) : (
          title
        )}
      </Button>
    </Trace>
  )
}

interface ActionButtonState {
  tokenColor: string | null
  disabled: boolean
  validTokenColor: ColorTokens | undefined
  lightTokenColor: ColorTokens | undefined
  actionsWithIcons: MenuOptionItem[]
  actionMenuOpen: boolean
  closeActionMenu: () => void
  toggleActionMenu: () => void
}

function useActionButtonState(actionMenuOptions: MenuOptionItem[]): ActionButtonState {
  const { currencyInfo, isChainEnabled, tokenColor } = useTokenDetailsContext()
  const { value: actionMenuOpen, setFalse: closeActionMenu, toggle: toggleActionMenu } = useBooleanState(false)

  const isBlocked = currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked
  const disabled = isBlocked || !isChainEnabled

  const validTokenColor = validColor(tokenColor)
  const lightTokenColor = validTokenColor ? opacify(12, validTokenColor) : undefined

  const actionsWithIcons = useMemo(() => {
    return actionMenuOptions.map(
      (action): MenuOptionItem => ({
        ...action,
        iconColor: tokenColor,
      }),
    )
  }, [actionMenuOptions, tokenColor])

  return {
    tokenColor,
    disabled,
    validTokenColor,
    lightTokenColor,
    actionsWithIcons,
    actionMenuOpen,
    closeActionMenu,
    toggleActionMenu,
  }
}

/** Dedicated Buy and Sell CTAs with a secondary action menu */
export function TokenDetailsBuySellButtons({
  userHasBalance,
  actionMenuOptions,
  buyButtonTitle,
  buyButtonIcon,
  buyButtonDisabled,
  sellButtonDisabled,
  onPressDisabled,
  onPressBuy,
  onPressSell,
}: {
  userHasBalance: boolean
  actionMenuOptions: MenuOptionItem[]
  buyButtonTitle?: string
  buyButtonIcon?: GeneratedIcon
  buyButtonDisabled?: boolean
  sellButtonDisabled?: boolean
  onPressDisabled?: () => void
  onPressBuy: () => void
  onPressSell: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const {
    tokenColor,
    disabled,
    validTokenColor,
    lightTokenColor,
    actionsWithIcons,
    actionMenuOpen,
    closeActionMenu,
    toggleActionMenu,
  } = useActionButtonState(actionMenuOptions)

  const buyLabel = buyButtonTitle ?? t('common.button.buy')
  const sellLabel = t('common.button.sell')

  const [buySized, setBuySized] = useState(false)
  const [sellSized, setSellSized] = useState(false)

  const {
    onLayout: onBuyLayout,
    fontSize: buyLabelFontSize,
    onSetFontSize: onSetBuyLabelFontSize,
    onExtraElementLayout: onBuyIconLayout,
  } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: CTA_MAX_CHAR_WIDTH_AT_MAX_FONT_SIZE,
    maxFontSize: CTA_MAX_LABEL_FONT_SIZE,
    minFontSize: CTA_MIN_LABEL_FONT_SIZE,
  })

  const {
    onLayout: onSellLayout,
    fontSize: sellLabelFontSize,
    onSetFontSize: onSetSellLabelFontSize,
  } = useDynamicFontSizing({
    maxCharWidthAtMaxFontSize: CTA_MAX_CHAR_WIDTH_AT_MAX_FONT_SIZE,
    maxFontSize: CTA_MAX_LABEL_FONT_SIZE,
    minFontSize: CTA_MIN_LABEL_FONT_SIZE,
  })

  const labelsReady = userHasBalance ? buySized && sellSized : buySized

  const handleBuyLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (event.nativeEvent.layout.width === 0) {
        return
      }
      onBuyLayout(event)
      onSetBuyLabelFontSize(buyLabel)
      setBuySized(true)
    },
    [onBuyLayout, buyLabel, onSetBuyLabelFontSize],
  )

  const handleSellLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (event.nativeEvent.layout.width === 0) {
        return
      }
      onSellLayout(event)
      onSetSellLabelFontSize(sellLabel)
      setSellSized(true)
    },
    [onSellLayout, onSetSellLabelFontSize, sellLabel],
  )

  const sharedLabelFontSize = useMemo(() => {
    return userHasBalance ? Math.min(buyLabelFontSize, sellLabelFontSize) : buyLabelFontSize
  }, [buyLabelFontSize, sellLabelFontSize, userHasBalance])

  return (
    <Flex
      row
      backgroundColor="$surface1"
      borderTopColor="$surface3"
      borderTopWidth={1}
      gap="$spacing8"
      p="$spacing16"
      pt="$spacing12"
    >
      <Flex fill row gap="$spacing12">
        <CTAButton
          disabled={disabled || buyButtonDisabled}
          element={ElementName.Buy}
          icon={buyButtonIcon}
          testID={TestID.TokenDetailsBuyButton}
          title={buyLabel}
          tokenColor={tokenColor}
          labelFontSize={sharedLabelFontSize}
          showLabel={labelsReady}
          onLayout={handleBuyLayout}
          onIconLayout={onBuyIconLayout}
          onPress={onPressBuy}
          onPressDisabled={onPressDisabled}
        />
        {userHasBalance && (
          <CTAButton
            disabled={disabled || sellButtonDisabled}
            element={ElementName.Sell}
            testID={TestID.TokenDetailsSellButton}
            title={sellLabel}
            tokenColor={tokenColor}
            labelFontSize={sharedLabelFontSize}
            showLabel={labelsReady}
            onLayout={handleSellLayout}
            onPress={onPressSell}
            onPressDisabled={onPressDisabled}
          />
        )}
        {/* Alternate buy titles normally appear only in no-balance states (see useMultichainBuyVariant).
            The geo-blocked override sets a title even for holders, who still need Send/Receive from the
            menu — so a balance keeps it visible. */}
        {(!buyButtonTitle || userHasBalance) && !disabled && (
          <ContextMenu
            isPlacementAbove
            closeMenu={closeActionMenu}
            isOpen={actionMenuOpen}
            menuItems={actionsWithIcons}
            offsetY={20}
            triggerMode={ContextMenuTriggerMode.Primary}
            onPressAny={(e) => {
              sendAnalyticsEvent(MobileEventName.TokenDetailsContextMenuAction, {
                action: e.name,
              })
            }}
          >
            <Trace logPress element={ElementName.TDPActionMenuButton} section={SectionName.TokenDetails}>
              <IconButton
                emphasis="primary"
                variant="branded"
                backgroundColor={lightTokenColor}
                borderColor="$transparent"
                icon={actionMenuOpen ? <X color={validTokenColor} /> : <GridView color={validTokenColor} />}
                size="large"
                testID={TestID.TokenDetailsActionButton}
                onPress={toggleActionMenu}
              />
            </Trace>
          </ContextMenu>
        )}
      </Flex>
    </Flex>
  )
}
