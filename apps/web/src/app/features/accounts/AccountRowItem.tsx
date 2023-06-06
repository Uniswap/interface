import { useMemo } from 'react'
import { Text, XStack } from 'ui/src'
import { Unicon } from 'ui/src/components/Unicon'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { shortenAddress } from 'wallet/src/utils/addresses'

type AccountRowItemProps = {
  address: string
  onPress?: () => void
}

/** Helper component to display identicon and formatted address */
export function AccountRowItem({ address, onPress }: AccountRowItemProps): JSX.Element {
  // TODO: Replace with useDisplayName once available
  const name = 'ensname.eth'
  // const { name } = useDisplayName(address)
  // // TODO: Replace wtih AccountIcon once available
  // // const { data: avatar } = useENSAvatar(address)

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
      <Text color="$textTertiary" variant="monospace">
        {shortenAddress(address)}
      </Text>
    </XStack>
  )
}
