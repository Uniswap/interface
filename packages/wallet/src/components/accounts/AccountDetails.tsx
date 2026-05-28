import { ColorTokens, Flex, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { shortenAddress } from 'utilities/src/addresses'

export function AccountDetails({
  address,
  allowFontScaling = true,
  chevron = false,
  chevronColor = '$neutral2',
}: {
  address: string
  allowFontScaling?: boolean
  chevron?: boolean
  chevronColor?: ColorTokens | undefined
}): JSX.Element {
  return (
    <Flex row shrink alignItems="center" gap="$spacing16" justifyContent="space-between">
      <Flex fill row shrink>
        <AddressDisplay
          hideAddressInSubtitle
          address={address}
          allowFontScaling={allowFontScaling}
          horizontalGap="$spacing8"
          size={iconSizes.icon24}
          variant="body3"
        />
      </Flex>
      <Flex fill row shrink alignItems="center" gap="$spacing4" justifyContent="flex-end">
        <Text allowFontScaling={allowFontScaling} color="$neutral2" variant="body3">
          {shortenAddress({ address })}
        </Text>
        {chevron && <RotatableChevron color={chevronColor} direction="end" size="$icon.24" />}
      </Flex>
    </Flex>
  )
}
