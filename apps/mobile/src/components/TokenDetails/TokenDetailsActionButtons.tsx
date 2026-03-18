import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Button, ColorTokens, Flex, GeneratedIcon, getContrastPassingTextColor } from 'ui/src'
import { IconButton } from 'ui/src/components/buttons/IconButton/IconButton'
import { GridView, X } from 'ui/src/components/icons'
import { opacify, validColor } from 'ui/src/theme'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { ElementName, MobileEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID, TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

function CTAButton({
  title,
  element,
  onPress,
  onPressDisabled,
  testID,
  tokenColor,
  disabled,
  icon: Icon,
}: {
  title: string
  element: ElementName
  onPress: () => void
  onPressDisabled?: () => void
  testID?: TestIDType
  tokenColor?: string | null
  disabled?: boolean
  icon?: GeneratedIcon
}): JSX.Element {
  return (
    <Trace logPress element={element} section={SectionName.TokenDetails}>
      <Button
        variant="branded"
        opacity={disabled ? 0.5 : undefined}
        icon={Icon ? <Icon color={tokenColor ? getContrastPassingTextColor(tokenColor) : '$white'} /> : undefined}
        backgroundColor={validColor(tokenColor)}
        size="large"
        testID={testID}
        onPress={disabled ? onPressDisabled : onPress}
      >
        {title}
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

/** Single contextual CTA (Swap/Buy/Get) with an overflow action menu */
export function TokenDetailsSwapButtons({
  ctaButton,
  userHasBalance,
  actionMenuOptions,
  onPressDisabled,
}: {
  ctaButton: {
    title: string
    icon?: GeneratedIcon
    onPress: () => void
  }
  userHasBalance: boolean
  actionMenuOptions: MenuOptionItem[]
  onPressDisabled?: () => void
}): JSX.Element {
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
          disabled={disabled}
          element={ElementName.Swap}
          icon={ctaButton.icon}
          testID={TestID.TokenDetailsSwapButton}
          title={ctaButton.title}
          tokenColor={tokenColor}
          onPress={ctaButton.onPress}
          onPressDisabled={onPressDisabled}
        />
        {userHasBalance && !disabled && (
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

/** Dedicated Buy and Sell CTAs with a secondary action menu */
export function TokenDetailsBuySellButtons({
  userHasBalance,
  actionMenuOptions,
  onPressDisabled,
  onPressBuy,
  onPressSell,
}: {
  userHasBalance: boolean
  actionMenuOptions: MenuOptionItem[]
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
        <Flex flex={1}>
          <CTAButton
            disabled={disabled}
            element={ElementName.Buy}
            testID={TestID.TokenDetailsBuyButton}
            title={t('common.button.buy')}
            tokenColor={tokenColor}
            onPress={onPressBuy}
            onPressDisabled={onPressDisabled}
          />
        </Flex>
        {userHasBalance && (
          <Flex flex={1}>
            <CTAButton
              disabled={disabled}
              element={ElementName.Sell}
              testID={TestID.TokenDetailsSellButton}
              title={t('common.button.sell')}
              tokenColor={tokenColor}
              onPress={onPressSell}
              onPressDisabled={onPressDisabled}
            />
          </Flex>
        )}
        {!disabled && (
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
