import { Flex, Text } from 'ui/src'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { DynamicConfigs } from 'uniswap/src/features/gating/configs'
import { getOverrideAdapter } from 'uniswap/src/features/gating/sdk/statsig'

export function DynamicConfigDropdown({
  config,
  configKey,
  label,
  options,
  selected,
}: {
  config: DynamicConfigs
  configKey: string
  label: string
  options: Array<{ value: string; label?: string }>
  selected: string
}): JSX.Element {
  const selectedOption = options.find((option) => option.value === selected)

  return (
    <Flex row fill alignItems="center" gap="$spacing16">
      <Flex fill>
        <Text variant="body2">{label}</Text>
      </Flex>

      <Flex
        row
        centered
        backgroundColor="$surface3"
        borderRadius="$rounded20"
        gap="$spacing4"
        pl="$spacing16"
        pr="$spacing12"
        py="$spacing2"
      >
        <ActionSheetDropdown
          options={options.map((option) => ({
            key: option.value,
            onPress: (): void => {
              getOverrideAdapter().overrideDynamicConfig(config, { [configKey]: option.value })
            },
            render: (): JSX.Element => {
              return (
                <Flex p="$padding6" hoverStyle={{ backgroundColor: '$surface3Hovered' }} borderRadius="$rounded4">
                  <Text variant="body3">{option.label ?? option.value}</Text>
                </Flex>
              )
            },
          }))}
          showArrow={true}
          styles={{ alignment: 'right' }}
        >
          <Text ellipse color="$neutral2" flexShrink={1} numberOfLines={1} variant="buttonLabel3">
            {selectedOption?.label ?? selectedOption?.value ?? selected}
          </Text>
        </ActionSheetDropdown>
      </Flex>
    </Flex>
  )
}
