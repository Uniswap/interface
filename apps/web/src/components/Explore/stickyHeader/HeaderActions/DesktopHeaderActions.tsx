import { useState } from 'react'
import { Flex, styled, Text, TouchableArea } from 'ui/src'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import { ActionButtonStyle } from '~/components/Explore/stickyHeader/HeaderActions/ActionButtonStyle'
import { HeaderActionRowContent } from '~/components/Explore/stickyHeader/HeaderActions/HeaderActionRowContent'
import {
  type HeaderAction,
  type HeaderActionWithDropdown,
  isHeaderActionWithDropdown,
} from '~/components/Explore/stickyHeader/HeaderActions/types'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { openExternalLink } from '~/utils/openExternalLink'

const DropdownAction = styled(TouchableArea, {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: '$spacing8',
  borderRadius: '$rounded8',
  gap: '$gap12',
  height: 40,
  hoverStyle: {
    backgroundColor: '$surface2Hovered',
  },
})

interface DesktopHeaderActionsProps {
  actions: HeaderAction[]
}

const DROPDOWN_MIN_WIDTH = 200

function DropdownHeaderAction({ action }: { action: HeaderActionWithDropdown }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const visibleItems = action.dropdownItems.filter((item) => item.show !== false)

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      menuLabel={action.icon as JSX.Element}
      hideChevron
      buttonStyle={ActionButtonStyle}
      dropdownStyle={{ width: 'max-content', minWidth: DROPDOWN_MIN_WIDTH }}
      alignRight
    >
      {visibleItems.map((item) => (
        <DropdownAction
          key={item.title}
          {...(item.href
            ? {
                tag: 'a',
                onPress: () => openExternalLink(item.href!),
              }
            : { onPress: item.onPress })}
        >
          <HeaderActionRowContent
            title={item.title}
            textColor={item.textColor}
            icon={item.icon}
            subtitle={item.subtitle}
            trailingIcon={item.trailingIcon}
          />
        </DropdownAction>
      ))}
    </Dropdown>
  )
}

export function DesktopHeaderActions({ actions }: DesktopHeaderActionsProps): JSX.Element {
  return (
    <Flex row gap="$gap8" alignItems="center">
      {actions.map((action) =>
        action.show ? (
          isHeaderActionWithDropdown(action) ? (
            <MouseoverTooltip key={action.title} text={action.title} placement="top" size={TooltipSize.Max}>
              <DropdownHeaderAction action={action} />
            </MouseoverTooltip>
          ) : (
            <MouseoverTooltip key={action.title} text={action.title} placement="top" size={TooltipSize.Max}>
              <TouchableArea
                {...(action.href
                  ? {
                      tag: 'a',
                      onPress: () => openExternalLink(action.href!),
                    }
                  : { onPress: action.onPress })}
                {...ActionButtonStyle}
              >
                <Text color={action.textColor ?? 'neutral1'} lineHeight={0}>
                  {action.icon}
                </Text>
              </TouchableArea>
            </MouseoverTooltip>
          )
        ) : null,
      )}
    </Flex>
  )
}
