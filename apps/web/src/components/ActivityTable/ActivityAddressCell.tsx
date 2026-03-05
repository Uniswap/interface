import { AddressWithAvatar } from 'components/ActivityTable/AddressWithAvatar'
import { buildActivityRowFragments } from 'components/ActivityTable/registry'
import { Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { getValidAddress } from 'uniswap/src/utils/addresses'

interface ActivityAddressCellProps {
  transaction: TransactionDetails
}

export function ActivityAddressCell({ transaction }: ActivityAddressCellProps) {
  const { counterparty } = buildActivityRowFragments(transaction)

  // Use counterparty from adapter if available, otherwise fall back to from address
  const rawAddress = counterparty ?? transaction.from
  const otherPartyAddress = rawAddress ? getValidAddress({ address: rawAddress, chainId: transaction.chainId }) : null

  return (
    <Flex row alignItems="center" justifyContent="space-between" width="100%">
      {otherPartyAddress && <AddressWithAvatar address={otherPartyAddress} size={20} />}
      <Flex px="$spacing12" opacity={0} animation="fast" $group-hover={{ opacity: 1 }}>
        <ArrowRight size="$icon.16" color="$neutral2" />
      </Flex>
    </Flex>
  )
}
