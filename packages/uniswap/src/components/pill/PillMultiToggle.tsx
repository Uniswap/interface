import { useState } from 'react'
import { AnimatePresence, ColorTokens, Flex, TabLayout, Tabs, TabsTabProps, Text } from 'ui/src'

interface PillMultiToggleOption {
  value: string
  display?: JSX.Element | string
}

// Based on this example: https://tamagui.dev/ui/tabs?subpath=tabs#animations
// TODO: WALL-4572 add tests for this component
export function PillMultiToggle({
  options,
  defaultOption,
  onSelectOption,
  activePillColor = '$surface3',
  activeTextColor = '$neutral1',
}: {
  options: PillMultiToggleOption[]
  defaultOption: string
  onSelectOption?: (option: string | number) => void
  activePillColor?: ColorTokens
  activeTextColor?: ColorTokens
}): JSX.Element {
  const [tabState, setTabState] = useState<{
    currentTab: string
    intentAt: TabLayout | null // Layout of the Tab user might intend to select (hovering / focusing)
    activeAt: TabLayout | null // Layout of the Tab user selected
  }>({
    activeAt: null,
    currentTab: defaultOption,
    intentAt: null,
  })

  const setCurrentTab = (currentTab: string): void => {
    setTabState({ ...tabState, currentTab })
    onSelectOption?.(currentTab)
  }
  const setIntentIndicator = (intentAt: TabLayout | null): void => setTabState({ ...tabState, intentAt })
  const setActiveIndicator = (activeAt: TabLayout | null): void => setTabState({ ...tabState, activeAt })

  const { activeAt, currentTab } = tabState

  function isActiveTab(tab: string): boolean {
    return currentTab === tab
  }

  const handleOnInteraction: TabsTabProps['onInteraction'] = (type, layout) => {
    if (type === 'select') {
      setActiveIndicator(layout)
    } else {
      setIntentIndicator(layout)
    }
  }
  return (
    <Tabs
      activationMode="manual"
      backgroundColor="$background"
      borderColor="$surface3"
      borderRadius="$roundedFull"
      borderWidth="$spacing1"
      flexDirection="column"
      orientation="horizontal"
      p="$spacing4"
      position="relative"
      value={currentTab}
      onValueChange={setCurrentTab}
    >
      <Flex>
        <AnimatePresence>
          {activeAt && (
            <Flex
              animation="fast"
              backgroundColor={activePillColor}
              borderRadius="$roundedFull"
              enterStyle={{
                opacity: 0,
              }}
              exitStyle={{
                opacity: 0,
              }}
              height={activeAt.height}
              opacity={1}
              position="absolute"
              width={activeAt.width}
              x={activeAt.x}
              y={activeAt.y}
              zIndex="$mask"
            />
          )}
        </AnimatePresence>
        <Tabs.List disablePassBorderRadius backgroundColor="transparent" gap="$spacing12" loop={false}>
          {options.map((tab) => {
            const { value, display } = tab
            return (
              <Tabs.Tab
                key={value}
                unstyled
                borderRadius="$rounded12"
                px="$spacing12"
                py="$spacing6"
                value={value}
                onInteraction={handleOnInteraction}
              >
                <Text color={isActiveTab(value) ? activeTextColor : '$neutral2'} variant="buttonLabel3">
                  {display || value}
                </Text>
              </Tabs.Tab>
            )
          })}
        </Tabs.List>
      </Flex>
    </Tabs>
  )
}
