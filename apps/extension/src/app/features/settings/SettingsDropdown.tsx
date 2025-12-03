import { useState } from 'react'
import { Flex, Popover, ScrollView, Text, TouchableArea } from 'ui/src'
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
const MAX_DROPDOWN_WIDTH = 200

export function SettingsDropdown({ selected, items, disableDropdown, onSelect }: SettingsDropdownProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)

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
            <RotatableChevron
              color="$neutral1"
              direction={isOpen ? 'up' : 'down'}
              height={iconSizes.icon16}
              width={iconSizes.icon20}
            />
          </Flex>
        </Popover.Trigger>
        <Popover.Content zIndex={zIndexes.popover} backgroundColor="$transparent" enableRemoveScroll={true}>
          <Flex
            borderColor="$surface3"
            borderRadius="$rounded16"
            shadowColor="$shadowColor"
            shadowOffset={{ width: 0, height: 2 }}
            shadowRadius={20}
            style={{ backdropFilter: 'blur(12px)' }}
          >
            <Flex
              backgroundColor="$surface4"
              borderRadius="$rounded16"
              height="100%"
              opacity={0.64}
              position="absolute"
              width="100%"
            />
            <ScrollView>
              <Flex gap="$spacing8" maxHeight={MAX_DROPDOWN_HEIGHT} maxWidth={MAX_DROPDOWN_WIDTH} p="$spacing8">
                {items.map((item, index) => (
                  <TouchableArea
                    key={item.label}
                    hoverable
                    borderRadius="$rounded8"
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
            </ScrollView>
          </Flex>
        </Popover.Content>
      </Popover>
    </Flex>
  )
}
