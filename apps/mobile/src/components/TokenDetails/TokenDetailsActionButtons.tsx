import React, { useMemo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Button, Flex, GeneratedIcon, getContrastPassingTextColor } from 'ui/src'
import { IconButton } from 'ui/src/components/buttons/IconButton/IconButton'
import { GridView, X } from 'ui/src/components/icons'
import { opacify, validColor } from 'ui/src/theme'
import { ContextMenu, MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { TokenList } from 'uniswap/src/features/dataApi/types'
import { ElementName, MobileEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useShouldShowAztecWarning } from 'uniswap/src/hooks/useShouldShowAztecWarning'
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
  tokenColor?: Maybe<string>
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

export function TokenDetailsActionButtons({
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
  onPressDisabled?: () => void
  userHasBalance: boolean
  actionMenuOptions: MenuOptionItem[]
}): JSX.Element {
  const { currencyInfo, isChainEnabled, tokenColor } = useTokenDetailsContext()
  const { value: actionMenuOpen, setFalse: closeActionMenu, toggle: toggleActionMenu } = useBooleanState(false)
  const showAztecWarning = useShouldShowAztecWarning(
    currencyInfo?.currency.isToken ? currencyInfo.currency.address : '',
  )

  const isBlocked = currencyInfo?.safetyInfo?.tokenList === TokenList.Blocked

  const disabled = isBlocked || showAztecWarning || !isChainEnabled

  const validTokenColor = validColor(tokenColor)
  const lightTokenColor = validTokenColor ? opacify(12, validTokenColor) : undefined

  const actionsWithIcons = useMemo(() => {
    return actionMenuOptions.map((action): MenuOptionItem => {
      return {
        ...action,
        iconColor: tokenColor,
      }
    })
  }, [actionMenuOptions, tokenColor])

  return (
    <Flex
      row
      backgroundColor="$surface1"
      borderTopColor="$surface3"
      borderTopWidth={1}
      gap="$spacing8"
      pb="$spacing16"
      pt="$spacing12"
      px="$spacing16"
    >
      <Flex fill row gap="$spacing12">
        <CTAButton
          disabled={disabled}
          element={ElementName.Swap}
          testID={TestID.TokenDetailsSwapButton}
          title={ctaButton.title}
          tokenColor={tokenColor}
          icon={ctaButton.icon}
          onPress={ctaButton.onPress}
          onPressDisabled={onPressDisabled}
        />
        {userHasBalance && !disabled && (
          <ContextMenu
            isPlacementAbove
            offsetY={20}
            menuItems={actionsWithIcons}
            isOpen={actionMenuOpen}
            triggerMode={ContextMenuTriggerMode.Primary}
            closeMenu={closeActionMenu}
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
                icon={actionMenuOpen ? <X color={validTokenColor} /> : <GridView color={validTokenColor} />}
                backgroundColor={lightTokenColor}
                borderColor="$transparent"
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
