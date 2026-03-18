import { Flex, Text, TouchableArea, useIsTouchDevice, WebBottomSheet } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { ActionButtonStyle } from '~/components/Explore/stickyHeader/HeaderActions/ActionButtonStyle'
import { HeaderActionRowContent } from '~/components/Explore/stickyHeader/HeaderActions/HeaderActionRowContent'
import {
  HeaderAction,
  type HeaderActionSection,
  isHeaderActionWithDropdown,
} from '~/components/Explore/stickyHeader/HeaderActions/types'
import { openExternalLink } from '~/utils/openExternalLink'

interface MobileHeaderActionsProps {
  actionSections: HeaderActionSection[]
}

export function MobileHeaderActions({ actionSections }: MobileHeaderActionsProps): JSX.Element {
  const { value: isOpen, setTrue: open, setFalse: close } = useBooleanState(false)
  const isTouchDevice = useIsTouchDevice()
  const handleOnPress = (action: HeaderAction) => {
    close()
    if (action.href) {
      openExternalLink(action.href)
    } else {
      action.onPress?.()
    }
  }

  return (
    <Flex>
      <TouchableArea {...ActionButtonStyle} onPress={open} justifyContent="center">
        <MoreHorizontal size="$icon.20" color="$neutral2" />
      </TouchableArea>
      <WebBottomSheet isOpen={isOpen} onClose={close}>
        <Flex gap="$spacing24" mx="$spacing24" mb="$spacing24">
          {actionSections.map((section) => {
            const items = section.actions.map((action) => {
              if (!action.show || isHeaderActionWithDropdown(action)) {
                return null
              }
              const hasHref = 'href' in action && action.href
              return (
                <TouchableArea
                  key={action.title}
                  width="100%"
                  hoverStyle={isTouchDevice ? { backgroundColor: '$surface3' } : undefined}
                  borderRadius="$rounded8"
                  {...(hasHref && { tag: 'a' })}
                  onPress={() => handleOnPress(action)}
                >
                  <HeaderActionRowContent
                    title={action.title}
                    textColor={action.textColor}
                    icon={action.icon}
                    subtitle={action.subtitle}
                    trailingIcon={action.trailingIcon}
                  />
                </TouchableArea>
              )
            })

            return (
              <Flex key={section.title} gap="$spacing12">
                <Text variant="body3" color="$neutral2">
                  {section.title}
                </Text>
                <Flex gap="$spacing12">{items}</Flex>
              </Flex>
            )
          })}
        </Flex>
      </WebBottomSheet>
    </Flex>
  )
}
