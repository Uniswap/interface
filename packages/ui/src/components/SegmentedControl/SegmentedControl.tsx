import { cloneElement, useState } from 'react'
import { AnimatePresence, ColorTokens, SpaceTokens, styled, TabLayout, Tabs, TabsTabProps } from 'tamagui'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { assert } from 'utilities/src/errors'
import { isMobileApp, isWebPlatform } from 'utilities/src/platform'

const TOGGLE_PADDING = 4

const OptionsSelector = styled(Tabs.List, {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  borderColor: '$surface3',
  outlineWidth: 0,
  borderWidth: '$spacing1',
  gap: '$gap8',
  overflow: 'hidden',
  p: TOGGLE_PADDING,
  variants: {
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    outlined: {
      true: {
        borderColor: '$surface3',
        borderWidth: '$spacing1',
      },
      false: {
        borderWidth: 0,
      },
    },
    size: {
      xsmall: {
        height: 30,
        gap: '$spacing4',
        borderRadius: '$roundedFull',
      },
      small: {
        height: 30,
        gap: '$spacing6',
        borderRadius: '$rounded16',
      },
      smallThumbnail: {
        height: 34,
        gap: '$spacing6',
        borderRadius: '$rounded16',
      },
      default: {
        height: 34,
        gap: '$gap8',
        borderRadius: '$rounded20',
      },
      large: {
        height: 42,
        gap: '$gap12',
        borderRadius: '$rounded24',
      },
      largeThumbnail: {
        height: 42,
        gap: '$gap12',
        borderRadius: '$rounded24',
      },
    },
  } as const,
})

OptionsSelector.displayName = 'OptionsSelector'

const TabsRovingIndicator = styled(Flex, {
  animation: 'fast',
  backgroundColor: '$surface3',
  borderRadius: '$roundedFull',
  position: 'absolute',
  cursor: 'pointer',
  zIndex: '$mask',
  enterStyle: {
    opacity: 0,
  },
  exitStyle: {
    opacity: 0,
  },
  hoverStyle: {
    backgroundColor: '$surface3Hovered',
  },
  variants: {
    disabled: {
      true: {
        backgroundColor: '$surface2',
      },
      false: {
        backgroundColor: '$surface3',
      },
    },
  } as const,
})

TabsRovingIndicator.displayName = 'TabsRovingIndicator'

const OptionButton = styled(Tabs.Tab, {
  unstyled: true,
  role: 'button',
  tabIndex: 0,
  disableActiveTheme: true,
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: 'transparent',
  borderRadius: '$roundedFull',
  cursor: 'pointer',
  borderColor: 'transparent',
  outlineColor: 'transparent',
  px: '$spacing8',
  variants: {
    fullWidth: {
      true: {
        flex: 1,
      },
    },
    size: {
      xsmall: {
        height: '$spacing20',
        py: '$spacing2',
        px: 8,
      },
      small: {
        height: '$spacing20',
        py: '$spacing2',
        px: '$padding6',
      },
      smallThumbnail: {
        height: '$spacing24',
        py: '$spacing2',
        px: '$gap4',
      },
      default: {
        height: '$spacing24',
        py: '$spacing2',
        px: '$padding8',
      },
      large: {
        height: '$spacing32',
        py: '$padding8',
        px: '$padding12',
      },
      largeThumbnail: {
        height: '$spacing32',
        py: '$padding8',
        px: '$padding8',
      },
    },
    disabled: {
      true: {
        cursor: 'unset',
      },
      false: {
        cursor: 'pointer',
      },
    },
  } as const,
})

OptionButton.displayName = 'OptionButton'

export interface SegmentedControlOption<T extends string = string> {
  // String value to be selected/stored, used as default display value
  value: T
  // Optional display text, different from value
  displayText?: string
  // Optional custom display element
  display?: JSX.Element
  // Optional wrapper around the display element
  wrapper?: JSX.Element
  // Disable the specific option
  disabled?: boolean
}

type SegmentedControlSize = 'xsmall' | 'small' | 'smallThumbnail' | 'default' | 'large' | 'largeThumbnail'

interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentedControlOption<T>[]
  selectedOption: T
  onSelectOption: (option: T) => void
  size?: SegmentedControlSize
  disabled?: boolean
  fullWidth?: boolean
  outlined?: boolean
  gap?: SpaceTokens
}

/**
 * Spore segmented control component, for selecting between multiple options.
 *
 * @param options - An array of options to display in the segmented control - must have between 2 and 6 options.
 *
 * Note: options can be just text (i.e. their value), or a value with a custom display element.
 * If you are defining custom display elements, you must ensure that each option fits within the vertical bounds of the SegmentedControl.
 *
 * For reference, the heights of the container are as follows (each with top and bottom padding of 4px):
 * - small: 30px
 * - default: 34px
 * - defaultThumbnail: 34px
 * - large: 42px
 * - largeThumbnail: 42px
 *
 * @param selectedOption - The value of the currently selected option.
 * @param onSelectOption - Callback function to be called when an option is selected.
 * @param size - The size of the segmented control which affects the height and padding.
 * @param disabled - Whether the segmented control is disabled.
 */
export function SegmentedControl<T extends string = string>({
  options,
  selectedOption,
  onSelectOption,
  size = 'default',
  disabled,
  fullWidth,
  outlined = true,
  gap,
}: SegmentedControlProps<T>): JSX.Element {
  assert(options.length >= 2 && options.length <= 6, 'Segmented control must have between 2 and 6 options, inclusive.')

  const [tabState, setTabState] = useState<{
    /**
     * Layout of the Tab user selected
     */
    activeAt: TabLayout | null
  }>({
    activeAt: null,
  })

  const [hoveredIndex, setHoveredIndex] = useState<number>()

  const setActiveIndicator = (activeAt: TabLayout | null): void => setTabState({ ...tabState, activeAt })

  const { activeAt } = tabState

  const handleOnInteraction: TabsTabProps['onInteraction'] = (type, layout) => {
    if (type === 'select') {
      setActiveIndicator(layout)
    }
  }

  const activeIndicatorXAdjustment = isMobileApp ? 2.5 : 0
  const activeIndicatorYAdjustment = isMobileApp ? -1.5 : 0

  return (
    <Tabs
      unstyled
      activationMode="manual"
      orientation="horizontal"
      value={selectedOption}
      onValueChange={(option) => {
        onSelectOption(option as T)
      }}
    >
      <OptionsSelector
        disablePassBorderRadius
        unstyled
        backgroundColor="transparent"
        fullWidth={fullWidth}
        outlined={outlined}
        loop={false}
        size={size}
        gap={gap}
      >
        {options.map((option, index) => {
          const { value, display, displayText, wrapper } = option

          const itemDisabled = disabled || option.disabled

          const optionButton = (
            <OptionButton
              key={value}
              active={selectedOption === value}
              disabled={itemDisabled}
              fullWidth={fullWidth}
              size={size}
              value={value}
              onInteraction={handleOnInteraction}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(undefined)}
              onPress={() => {
                onSelectOption(value)
              }}
            >
              {display ?? (
                <Text
                  color={getOptionTextColor({
                    active: selectedOption === value,
                    hovered: hoveredIndex === index,
                    disabled: itemDisabled,
                  })}
                  userSelect="none"
                  variant={size === 'large' ? 'buttonLabel3' : 'buttonLabel4'}
                >
                  {displayText ?? value}
                </Text>
              )}
            </OptionButton>
          )

          if (wrapper) {
            // To avoid perf issues, we expect the callsite to pass an instance of a component,
            // not a functional component. As a result we can't render it with typical JSX and need
            // to clone it here.
            return cloneElement(wrapper, {
              children: optionButton,
            })
          }
          return optionButton
        })}
        <AnimatePresence>
          {activeAt && (
            <TabsRovingIndicator
              height={activeAt.height}
              width={activeAt.width}
              x={activeAt.x - TOGGLE_PADDING + activeIndicatorXAdjustment}
              y={activeAt.y - TOGGLE_PADDING + activeIndicatorYAdjustment - (isWebPlatform && !outlined ? 1 : 0)}
            />
          )}
        </AnimatePresence>
      </OptionsSelector>
    </Tabs>
  )
}

function getOptionTextColor({
  active,
  hovered,
  disabled = false,
}: {
  active: boolean
  hovered: boolean
  disabled?: boolean
}): ColorTokens {
  if (disabled) {
    return active ? '$neutral2' : '$neutral3'
  }
  if (active || hovered) {
    return '$neutral1'
  }
  return '$neutral2'
}
