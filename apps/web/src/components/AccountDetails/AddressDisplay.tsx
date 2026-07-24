import { Flex, Text } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useENSName } from 'uniswap/src/features/ens/api'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

export function AddressDisplay({ address }: { address: Address }) {
  const { data: ENSName } = useENSName(address)
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const uniswapUsername = unitag?.username

  return (
    <Flex row gap="2px" alignItems="center" data-testid={TestID.AddressDisplay}>
      <Text {...EllipsisTamaguiStyle}>{uniswapUsername ?? ENSName ?? shortenAddress({ address })}</Text>
      {uniswapUsername && (
        <Flex pt="$spacing2">
          <Unitag size={18} />
        </Flex>
      )}
    </Flex>
  )
}
