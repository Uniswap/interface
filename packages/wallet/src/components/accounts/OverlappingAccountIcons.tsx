import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'

export const OverlappingAccountIcons = ({
  accountAddresses,
  iconSize,
  iconShift = iconSizes.icon12,
}: {
  accountAddresses: string[]
  iconSize: number
  iconShift?: number
}): JSX.Element => {
  return (
    <Flex row>
      {accountAddresses.map((address, index) => (
        <Flex
          key={`${address}-${index}`}
          ml={index > 0 ? -iconShift : 0}
          backgroundColor="$surface1"
          borderRadius="$roundedFull"
          overflow="hidden"
          zIndex={accountAddresses.length - index}
        >
          <AccountIcon address={address} size={iconSize} />
        </Flex>
      ))}
    </Flex>
  )
}
