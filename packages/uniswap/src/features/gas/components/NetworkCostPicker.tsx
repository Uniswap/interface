import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled } from 'ui/src/components/icons/CheckCircleFilled'

export interface NetworkCostPickerProps {
  enableCustomGasFeeEntry: boolean
  onChange: (enabled: boolean) => void
}

/**
 * Radio-row picker for the wallet-level `userSettings.enableCustomGasFeeEntry`
 * preference.
 *
 * Renders two rows — "Auto" (recommended, default) and "Custom" — each with a
 * title, a short description, and a check icon next to the currently selected
 * row. Calls `onChange` with the new boolean when a row is tapped.
 */
export function NetworkCostPicker({ enableCustomGasFeeEntry, onChange }: NetworkCostPickerProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing16" p="$spacing20">
      <NetworkCostPickerRow
        recommended
        title={t('gas.override.mode.auto')}
        description={t('gas.override.mode.auto.description')}
        selected={!enableCustomGasFeeEntry}
        onPress={(): void => onChange(false)}
      />
      <NetworkCostPickerRow
        title={t('gas.override.mode.custom')}
        description={t('gas.override.mode.custom.description')}
        selected={enableCustomGasFeeEntry}
        onPress={(): void => onChange(true)}
      />
    </Flex>
  )
}

interface NetworkCostPickerRowProps {
  title: string
  description: string
  selected: boolean
  recommended?: boolean
  onPress: () => void
}

function NetworkCostPickerRow({
  title,
  description,
  selected,
  recommended,
  onPress,
}: NetworkCostPickerRowProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea onPress={onPress}>
      <Flex row alignItems="flex-start" gap="$spacing12">
        <Flex flex={1} gap="$spacing4">
          <Flex row alignItems="center" gap="$spacing8">
            <Text variant="subheading2" color="$neutral1">
              {title}
            </Text>
            {recommended && (
              <Flex backgroundColor="$accent2" borderRadius="$rounded8" px="$spacing8" py="$spacing2">
                <Text variant="body4" color="$accent1">
                  {t('common.recommended')}
                </Text>
              </Flex>
            )}
          </Flex>
          <Text variant="body3" color="$neutral2">
            {description}
          </Text>
        </Flex>
        {selected && <CheckCircleFilled color="$accent1" size="$icon.24" flexShrink={0} />}
      </Flex>
    </TouchableArea>
  )
}
