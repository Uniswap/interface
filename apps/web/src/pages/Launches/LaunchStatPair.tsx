import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { LaunchItem } from '~/pages/Launches/launchesModel'

/**
 * Shared FDV / volume stat block for the regular launch card: two equal columns with a hairline
 * divider, each hiding entirely when its metric is unavailable (no placeholders).
 */
export function LaunchStatPair({
  launch,
  volumeLabel,
}: {
  launch: LaunchItem
  volumeLabel: string
}): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const formattedFdv =
    launch.fdvUsd !== undefined ? convertFiatAmountFormatted(launch.fdvUsd, NumberType.FiatTokenStats) : undefined
  const formattedVolume =
    launch.volume24hUsd !== undefined
      ? formatNumberOrString({ value: launch.volume24hUsd, type: NumberType.FiatTokenStats })
      : undefined

  if (formattedFdv === undefined && formattedVolume === undefined) {
    return null
  }

  return (
    <Flex row gap="$spacing12" alignItems="stretch">
      {formattedFdv !== undefined && (
        <Flex gap="$gap4" flex={1}>
          <Text variant="body4" color="$neutral2">
            {t('toucan.auction.currentFdv')}
          </Text>
          <Text variant="body3" color="$neutral1">
            {formattedFdv}
          </Text>
        </Flex>
      )}
      {formattedFdv !== undefined && formattedVolume !== undefined && <Flex width={1} backgroundColor="$surface3" />}
      {formattedVolume !== undefined && (
        <Flex gap="$gap4" flex={1}>
          <Text variant="body4" color="$neutral2">
            {volumeLabel}
          </Text>
          <Text variant="body3" color="$neutral1">
            {formattedVolume}
          </Text>
        </Flex>
      )}
    </Flex>
  )
}
