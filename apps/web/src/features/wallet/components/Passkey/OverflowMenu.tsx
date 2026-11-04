import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { MoreHorizontal } from '@universe/mycelium/icons/MoreHorizontal'
import { Trash } from '@universe/mycelium/icons/Trash'
import { AdaptiveWebPopoverContentCompat, PopoverCompat as Popover } from '@universe/mycelium/popover-compat'
import { useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEvent } from 'utilities/src/react/hooks'

// Uses the popover primitive directly (not the shared ContextMenu) because this row
// can live inside the AccountDrawer's mweb bottom sheet, whose scroll/transform
// ancestors clip ContextMenu's `strategy="absolute"` popover. `strategy="fixed"`
// + the popover's stacking layer above the sheet keeps the menu visible everywhere.
export function OverflowMenu({ onRemove, testID }: { onRemove: () => void; testID?: string }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const isDarkMode = useIsDarkMode()

  const handleRemove = useEvent(() => {
    setIsOpen(false)
    onRemove()
  })

  return (
    <Flex ml="auto">
      <Popover open={isOpen} onOpenChange={setIsOpen} placement="bottom-end" allowFlip strategy="fixed" offset={4}>
        <Popover.Trigger>
          {/* No onPress here: the compat trigger wires the open interaction onto its
              own wrapper and reports through onOpenChange — a child toggle would be a
              second, coincident write to the same state. */}
          <TouchableArea testID={testID}>
            <MoreHorizontal size="$icon.20" color="$neutral2" />
          </TouchableArea>
        </Popover.Trigger>
        <AdaptiveWebPopoverContentCompat
          isOpen={isOpen}
          // `p`, not `padding`: the compat popup frame's own 8px default (Tamagui
          // PopperContentFrame parity) is keyed as `p`, and the two padding aliases
          // don't collide at the props-merge level — a `padding` value loses to the
          // frame default's later-compiled shorthand class. Same key = caller wins,
          // restoring the legacy 4px.
          p="$spacing4"
          backgroundColor="$surface1"
          borderRadius="$rounded16"
          borderWidth="$spacing1"
          borderColor="$surface3"
          minWidth={200}
          alignItems="stretch"
          // Literal rgba stands in for the legacy `elevate`/`$shadowColor`: a deferred compat token gap (tracked on INFRA-3115)
          shadowColor={isDarkMode ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.15)'}
          shadowOffset={{ width: 0, height: 3 }}
          shadowRadius={6}
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
        </AdaptiveWebPopoverContentCompat>
      </Popover>
    </Flex>
  )
}
