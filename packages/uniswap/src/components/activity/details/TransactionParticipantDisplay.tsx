import { Flex } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'

export function TransactionParticipantDisplay({ address }: { address: string }): JSX.Element {
  return (
    <Flex justifyContent="center" flexDirection="row" gap="$spacing4">
      <AddressDisplay
        hideAddressInSubtitle
        address={address}
        size={iconSizes.icon16}
        horizontalGap="$spacing6"
        variant="body3"
        disableForcedWidth={true}
      />
    </Flex>
  )
}
