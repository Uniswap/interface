import { DynamicConfigKeys, DynamicConfigs, getOverrideAdapter, useDynamicConfigValue } from '@universe/gating'
import { Flex, Text } from 'ui/src'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'

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
  options: Array<{ value: string | boolean; label?: string } | { jsonValue: object; label?: string }>
  selected: string
}): JSX.Element {
  const selectedOption = options.find((option) => {
    if ('value' in option) {
      return option.value.toString() === selected
    }

    return JSON.stringify(option.jsonValue) === selected
  })

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
            key: option.label ?? ('value' in option ? option.value.toString() : JSON.stringify(option.jsonValue)),
            onPress: (): void => {
              getOverrideAdapter().overrideDynamicConfig(config, {
                ...getOverrideAdapter().getAllOverrides().dynamicConfig[config],
                [configKey]: 'value' in option ? option.value : option.jsonValue,
              })
            },
            render: (): JSX.Element => {
              return (
                <Flex p="$padding6" hoverStyle={{ backgroundColor: '$surface3Hovered' }} borderRadius="$rounded4">
                  <Text variant="body3">
                    {option.label ?? ('value' in option ? option.value : JSON.stringify(option.jsonValue))}
                  </Text>
                </Flex>
              )
            },
          }))}
          showArrow={true}
          styles={{ alignment: 'right' }}
        >
          <Text ellipse color="$neutral2" flexShrink={1} numberOfLines={1} variant="buttonLabel3">
            {selectedOption?.label ??
              (selectedOption && 'value' in selectedOption
                ? selectedOption.value
                : JSON.stringify(selectedOption?.jsonValue))}
          </Text>
        </ActionSheetDropdown>
      </Flex>
    </Flex>
  )
}

const DYNAMIC_CONFIG_TRUE_FALSE_OPTIONS = [
  { value: true, label: 'Enabled' },
  { value: false, label: 'Disabled' },
]

export function DynamicConfigDropdownBoolean<
  Conf extends keyof DynamicConfigKeys,
  Key extends DynamicConfigKeys[Conf],
>({ config, configKey, label }: { config: Conf; configKey: Key; label: string }): JSX.Element {
  return (
    <DynamicConfigDropdown
      config={config}
      configKey={configKey}
      label={label}
      options={DYNAMIC_CONFIG_TRUE_FALSE_OPTIONS}
      selected={useDynamicConfigValue({
        config,
        key: configKey,
        defaultValue: false,
      }).toString()}
    />
  )
}
