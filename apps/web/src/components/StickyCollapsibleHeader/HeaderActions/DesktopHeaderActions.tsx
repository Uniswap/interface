import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { useState } from 'react'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import { ActionButtonStyle } from '~/components/StickyCollapsibleHeader/HeaderActions/ActionButtonStyle'
import {
  DROPDOWN_MIN_WIDTH,
  HeaderActionDropdownRow,
  HeaderActionRowContent,
} from '~/components/StickyCollapsibleHeader/HeaderActions/HeaderActionRowContent'
import {
  type HeaderAction,
  type HeaderActionWithDropdown,
  isHeaderActionWithDropdown,
} from '~/components/StickyCollapsibleHeader/HeaderActions/types'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { openExternalLink } from '~/utils/openExternalLink'

interface DesktopHeaderActionsProps {
  actions: HeaderAction[]
}

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
        <HeaderActionDropdownRow
          key={item.title}
          isLink={!!item.href}
          onPress={item.href ? () => openExternalLink(item.href!) : item.onPress}
        >
          <HeaderActionRowContent
            title={item.title}
            textColor={item.textColor}
            icon={item.icon}
            subtitle={item.subtitle}
            trailingIcon={item.trailingIcon}
          />
        </HeaderActionDropdownRow>
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
                <Text color={action.textColor ?? '$neutral1'} lineHeight={0}>
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
