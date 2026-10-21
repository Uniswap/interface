import { Flex, Text, TouchableArea, useIsTouchDevice, WebBottomSheet } from '@universe/mycelium'
import { MoreHorizontal } from '@universe/mycelium/icons/MoreHorizontal'
import { TestID } from '@universe/test'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import { ActionButtonStyle } from '~/components/StickyCollapsibleHeader/HeaderActions/ActionButtonStyle'
import {
  DROPDOWN_MIN_WIDTH,
  HeaderActionDropdownRow,
  HeaderActionRowContent,
} from '~/components/StickyCollapsibleHeader/HeaderActions/HeaderActionRowContent'
import {
  HeaderAction,
  type HeaderActionSection,
  isHeaderActionWithDropdown,
} from '~/components/StickyCollapsibleHeader/HeaderActions/types'
import { openExternalLink } from '~/utils/openExternalLink'

interface MobileHeaderActionsProps {
  actionSections: HeaderActionSection[]
  presentation?: 'dropdown' | 'sheet'
}

export function MobileHeaderActions({
  actionSections,
  presentation = 'dropdown',
}: MobileHeaderActionsProps): JSX.Element {
  const { value: isOpen, setTrue: open, setFalse: close, setValue: setIsOpen } = useBooleanState(false)
  const isTouchDevice = useIsTouchDevice()
  const isSheet = presentation === 'sheet'
  const handleOnPress = (action: HeaderAction) => {
    close()
    if (action.href) {
      openExternalLink(action.href)
    } else {
      action.onPress?.()
    }
  }

  const sections = actionSections.map((section) => {
    const items = section.actions.map((action) => {
      if (!action.show || isHeaderActionWithDropdown(action)) {
        return null
      }
      const hasHref = 'href' in action && action.href
      const rowContent = (
        <HeaderActionRowContent
          title={action.title}
          textColor={action.textColor}
          icon={action.icon}
          subtitle={action.subtitle}
          trailingIcon={action.trailingIcon}
        />
      )
      return isSheet ? (
        <TouchableArea
          key={action.title}
          width="100%"
          hoverStyle={isTouchDevice ? { backgroundColor: '$surface3' } : undefined}
          borderRadius="$rounded8"
          {...(hasHref && { tag: 'a' })}
          onPress={() => handleOnPress(action)}
        >
          {rowContent}
        </TouchableArea>
      ) : (
        <HeaderActionDropdownRow key={action.title} isLink={!!hasHref} onPress={() => handleOnPress(action)}>
          {rowContent}
        </HeaderActionDropdownRow>
      )
    })

    return (
      <Flex key={section.title} gap={isSheet ? '$spacing12' : '$spacing4'}>
        <Text variant="body3" color="$neutral2" px={isSheet ? undefined : '$spacing8'}>
          {section.title}
        </Text>
        <Flex gap={isSheet ? '$spacing12' : undefined}>{items}</Flex>
      </Flex>
    )
  })

  const moreIcon = <MoreHorizontal size="$icon.20" color="$neutral2" />

  if (!isSheet) {
    return (
      <Dropdown
        isOpen={isOpen}
        toggleOpen={setIsOpen}
        menuLabel={moreIcon}
        dataTestId={TestID.HeaderActionsMoreButton}
        dropdownTestId={TestID.HeaderActionsMenu}
        hideChevron
        buttonStyle={ActionButtonStyle}
        dropdownStyle={{ width: 'max-content', minWidth: DROPDOWN_MIN_WIDTH }}
        alignRight
        positionFixed
      >
        <Flex gap="$spacing12">{sections}</Flex>
      </Dropdown>
    )
  }

  return (
    <Flex>
      <TouchableArea
        {...ActionButtonStyle}
        testID={TestID.HeaderActionsMoreButton}
        onPress={open}
        justifyContent="center"
      >
        {moreIcon}
      </TouchableArea>
      <WebBottomSheet isOpen={isOpen} onClose={close}>
        <Flex gap="$spacing24" mx="$spacing24" mb="$spacing24">
          {sections}
        </Flex>
      </WebBottomSheet>
    </Flex>
  )
}
