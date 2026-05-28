import { useState } from 'react'
import { animationPresets, Flex, Popover, Text, TouchableArea, useScrollbarStyles } from 'ui/src'
import { Check, RotatableChevron } from 'ui/src/components/icons'
import { iconSizes, zIndexes } from 'ui/src/theme'

type DropdownItem = {
  label: string
  value: unknown
}

export type SettingsDropdownProps = {
  selected: string
  items: DropdownItem[]
  disableDropdown?: boolean
  onSelect: (item: unknown) => void
}

const MAX_DROPDOWN_HEIGHT = 220
const MAX_DROPDOWN_WIDTH = 250

export function SettingsDropdown({ selected, items, disableDropdown, onSelect }: SettingsDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const scrollbarStyles = useScrollbarStyles()

  return (
    <Flex>
      <Popover open={isOpen} stayInFrame={true} onOpenChange={setIsOpen}>
        <Popover.Trigger disabled={disableDropdown}>
          <Flex
            row
            backgroundColor="$surface3"
            borderRadius="$roundedFull"
            cursor="pointer"
            p="$spacing8"
            gap="$gap4"
            alignItems="center"
            pl="$spacing12"
          >
            <Text color="$neutral1" variant="buttonLabel4">
              {selected}
            </Text>
            <RotatableChevron color="$neutral1" direction={isOpen ? 'up' : 'down'} size="$icon.16" />
          </Flex>
        </Popover.Trigger>
        <Popover.Content
          zIndex={zIndexes.popover}
          animation="quicker"
          animateOnly={['transform', 'opacity']}
          backgroundColor="$transparent"
          enableRemoveScroll={true}
          {...animationPresets.fadeInDownOutUp}
        >
          <Flex
            backgroundColor="$surface1"
            borderColor="$surface3"
            borderWidth="$spacing1"
            borderRadius="$rounded16"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 2 }}
            shadowRadius={20}
          >
            <Flex
              backgroundColor="$surface4"
              borderRadius="$rounded16"
              height="100%"
              opacity={0.64}
              position="absolute"
              width="100%"
            />
            <Flex
              maxHeight={MAX_DROPDOWN_HEIGHT}
              maxWidth={MAX_DROPDOWN_WIDTH}
              $platform-web={{
                overflowY: 'auto',
                overflowX: 'hidden',
              }}
              style={scrollbarStyles}
            >
              <Flex gap="$spacing8" p="$spacing8">
                {items.map((item, index) => (
                  <TouchableArea
                    key={item.label}
                    hoverable
                    borderRadius="$rounded8"
                    hoverStyle={{ backgroundColor: '$surface3' }}
                    onPress={() => {
                      onSelect(item.value)
                      setIsOpen(false)
                    }}
                  >
                    <Flex row alignItems="center" gap="$spacing24" px="$spacing8" py="$spacing4">
                      <Flex fill>
                        <Text key={index} color="$neutral1" variant="body2">
                          {item.label}
                        </Text>
                      </Flex>
                      {selected === item.label ? (
                        <Check color="$accent1" size="$icon.20" />
                      ) : (
                        <Flex height={iconSizes.icon20} width={iconSizes.icon20} />
                      )}
                    </Flex>
                  </TouchableArea>
                ))}
              </Flex>
            </Flex>
          </Flex>
        </Popover.Content>
      </Popover>
    </Flex>
  )
}
