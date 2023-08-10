import { useMemo } from 'react'
import { Text, XStack } from 'ui/src'
import { Unicon } from 'ui/src/components/Unicon'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useDisplayName } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

type AccountRowItemProps = {
  address: string
  onPress?: () => void
}

/** Helper component to display identicon and formatted address */
export function AccountRowItem({ address, onPress }: AccountRowItemProps): JSX.Element {
  const name = useDisplayName(address)?.name
  // TODO: Replace wtih AccountIcon once available
  // const { data: avatar } = useENSAvatar(address)

  const icon = useMemo(() => {
    return <Unicon address={address} size={iconSizes.icon28} />
  }, [address])

  return (
    <XStack
      alignItems="center"
      flex={1}
      gap="$spacing12"
      justifyContent="space-between"
      paddingVertical="$spacing12"
      onPress={onPress}>
      <XStack alignItems="center" gap="$spacing12">
        {icon}
        <Text variant="bodyLarge">{name}</Text>
      </XStack>
      <Text color="$neutral3" variant="monospace">
        {shortenAddress(address)}
      </Text>
    </XStack>
  )
}
