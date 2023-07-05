import { Circle, Stack, Text, XStack, YStack } from 'ui/src'
import { CheckmarkIcon } from 'ui/src/assets/icons/CheckmarkIcon'
import { Unicon } from 'ui/src/components/Unicon'
import { useUniconColors } from 'ui/src/components/Unicon/utils'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { shortenAddress } from 'wallet/src/utils/addresses'
import { formatUSDPrice, NumberType } from 'wallet/src/utils/format'

interface Props {
  address: string
  selected: boolean
  balance?: number | null
  onSelect: (address: string) => void
  hideSelectionCircle?: boolean
}

export const ADDRESS_WRAPPER_HEIGHT = 36
const UNICON_SIZE = iconSizes.icon40

export default function WalletPreviewCard({
  address,
  selected,
  balance,
  onSelect,
  hideSelectionCircle,
  ...rest
}: Props): JSX.Element {
  const unselectedBorderColor = '$backgroundOutline'

  const { gradientStart } = useUniconColors(address)

  return (
    <Stack
      alignItems="center"
      borderColor={selected ? gradientStart : unselectedBorderColor}
      borderRadius="$rounded20"
      borderWidth={2}
      cursor="pointer"
      paddingHorizontal="$spacing16"
      paddingVertical="$spacing16"
      width="100%"
      onPress={(): void => onSelect(address)}
      {...rest}>
      <XStack
        alignItems="center"
        gap="$spacing12"
        height={ADDRESS_WRAPPER_HEIGHT}
        justifyContent="space-between"
        width="100%">
        <XStack alignItems="center" gap="$spacing12" justifyContent="center">
          <Unicon address={address} size={UNICON_SIZE} />
          <YStack>
            <Text variant="subheadLarge">{shortenAddress(address)}</Text>
            {balance ? (
              <Text color="$textSecondary" variant="bodySmall">
                {formatUSDPrice(balance, NumberType.FiatTokenQuantity)}
              </Text>
            ) : null}
          </YStack>
        </XStack>
        {!hideSelectionCircle ? (
          selected ? (
            <CheckmarkIcon color={gradientStart} />
          ) : (
            <Circle borderColor="$backgroundOutline" borderWidth={2} size={iconSizes.icon20} />
          )
        ) : null}
      </XStack>
    </Stack>
  )
}

export function LoadingWalletPreviewCard(): JSX.Element {
  return (
    <Stack
      alignItems="center"
      backgroundColor="background1"
      borderColor="$backgroundOutline"
      borderRadius="$rounded20"
      borderWidth={2}
      paddingHorizontal="$spacing16"
      paddingVertical="$spacing16"
      width="100%">
      <XStack
        alignItems="center"
        gap="$spacing12"
        height={ADDRESS_WRAPPER_HEIGHT}
        justifyContent="space-between"
        width="100%">
        <XStack alignItems="center" gap="$spacing12" justifyContent="center">
          <Circle backgroundColor="$backgroundOutline" size={UNICON_SIZE} />
          <YStack gap="$spacing4">
            <Stack backgroundColor="$backgroundOutline" borderRadius="$rounded12" width={150}>
              <Text color="$none" variant="subheadLarge">
                Address
              </Text>
            </Stack>
            <Stack backgroundColor="$backgroundOutline" borderRadius="$rounded12" width={100}>
              <Text color="$none" variant="bodySmall">
                $0.00
              </Text>
            </Stack>
          </YStack>
        </XStack>
        <Circle borderColor="$backgroundOutline" borderWidth={2} size={iconSizes.icon20} />
      </XStack>
    </Stack>
  )
}
