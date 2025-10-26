import { ColorTokens, Flex, Text } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { shortenAddress } from 'utilities/src/addresses'

export function AccountDetails({
  address,
  allowFontScaling = true,
  iconSize = 20,
  chevron = false,
  chevronColor = '$neutral2',
}: {
  address: string
  allowFontScaling?: boolean
  iconSize?: number
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
          size={iconSize}
          variant="body3"
        />
      </Flex>
      <Flex fill row shrink alignItems="center" gap="$spacing4" justifyContent="flex-end">
        <Text allowFontScaling={allowFontScaling} color="$neutral2" variant="body3">
          {shortenAddress({ address })}
        </Text>
        {chevron && <RotatableChevron color={chevronColor} direction="end" height={iconSize} width={iconSize} />}
      </Flex>
    </Flex>
  )
}
