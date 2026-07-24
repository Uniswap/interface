import Portal from '@reach/portal'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Popover, Text, TouchableArea } from 'ui/src'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { Trash } from 'ui/src/components/icons/Trash'
import { zIndexes } from 'ui/src/theme'
import { useEvent } from 'utilities/src/react/hooks'

// Uses Tamagui Popover directly (not the shared ContextMenu) because this row
// can live inside the AccountDrawer's mweb bottom sheet, whose scroll/transform
// ancestors clip ContextMenu's `strategy="absolute"` popover. `strategy="fixed"`
// + an explicit z-index above the sheet keeps the menu visible everywhere.
export function OverflowMenu({ onRemove, testID }: { onRemove: () => void; testID?: string }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const handleRemove = useEvent(() => {
    setIsOpen(false)
    onRemove()
  })

  return (
    <Flex ml="auto">
      <Popover open={isOpen} onOpenChange={setIsOpen} placement="bottom-end" allowFlip strategy="fixed" offset={4}>
        <Popover.Trigger asChild>
          <TouchableArea testID={testID} onPress={() => setIsOpen((v) => !v)}>
            <MoreHorizontal size="$icon.20" color="$neutral2" />
          </TouchableArea>
        </Popover.Trigger>
        <Portal>
          <Popover.Content
            zIndex={zIndexes.tooltip}
            elevate
            padding="$spacing4"
            backgroundColor="$surface1"
            borderRadius="$rounded16"
            borderWidth="$spacing1"
            borderColor="$surface3"
            minWidth={200}
            alignItems="stretch"
            enterStyle={{ opacity: 0, scale: 0.95 }}
            exitStyle={{ opacity: 0, scale: 0.95 }}
            animation="100ms"
            // Exclude color props: animating $-prefixed color tokens flashes on
            // light/dark mode toggle. Only opacity + scale are animated here.
            animateOnly={['transform', 'opacity']}
          >
            <TouchableArea
              row
              alignItems="center"
              justifyContent="flex-start"
              gap="$spacing8"
              px="$spacing8"
              py="$spacing8"
              borderRadius="$rounded12"
              hoverStyle={{ backgroundColor: '$surface2' }}
              onPress={handleRemove}
            >
              <Trash size="$icon.16" color="$statusCritical" />
              <Text variant="body3" color="$statusCritical">
                {t('common.button.remove')}
              </Text>
            </TouchableArea>
          </Popover.Content>
        </Portal>
      </Popover>
    </Flex>
  )
}
