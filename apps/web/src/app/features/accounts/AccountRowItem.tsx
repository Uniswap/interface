import { useMemo } from 'react'
import { Flex, Text, Unicon } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
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
    <Flex
      fill
      row
      alignItems="center"
      gap="$spacing12"
      justifyContent="space-between"
      py="$spacing12"
      onPress={onPress}>
      <Flex row alignItems="center" gap="$spacing12">
        {icon}
        <Text variant="body1">{name}</Text>
      </Flex>
      <Text color="$neutral3" variant="monospace">
        {shortenAddress(address)}
      </Text>
    </Flex>
  )
}
