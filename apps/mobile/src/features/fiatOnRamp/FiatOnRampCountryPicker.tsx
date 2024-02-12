import React from 'react'
import { SvgUri } from 'react-native-svg'
import Trace from 'src/components/Trace/Trace'
import { Flex, Icons, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { getCountryFlagSvgUrl } from 'wallet/src/features/fiatOnRamp/utils'
import { ElementName } from 'wallet/src/telemetry/constants'

const ICON_SIZE = iconSizes.icon16

export function FiatOnRampCountryPicker({
  onPress,
  countryCode,
}: {
  onPress: () => void
  countryCode: Maybe<string>
}): JSX.Element | null {
  if (!countryCode) {
    return null
  }

  const countryFlagUrl = getCountryFlagSvgUrl(countryCode)

  return (
    <Trace logPress element={ElementName.FiatOnRampCountryPicker}>
      <TouchableArea
        hapticFeedback
        backgroundColor="$surface3"
        borderRadius="$roundedFull"
        overflow="hidden"
        pl="$spacing8"
        pr="$spacing4"
        py="$spacing2"
        onPress={onPress}>
        <Flex row shrink alignItems="center" flex={0} gap="$spacing2">
          <Flex borderRadius="$roundedFull" overflow="hidden">
            <SvgUri height={ICON_SIZE} uri={countryFlagUrl} width={ICON_SIZE} />
          </Flex>
          <Icons.RotatableChevron color="$neutral3" direction="down" width={iconSizes.icon20} />
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
