import styled from 'lib/styled-components'
import { CopyHelper } from 'theme/components/CopyHelper'
import { EllipsisStyle } from 'theme/components/styles'
import { Flex } from 'ui/src'
import { Unitag } from 'ui/src/components/icons/Unitag'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { useENSName } from 'uniswap/src/features/ens/api'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'

const IdentifierText = styled.span`
  ${EllipsisStyle}
  max-width: 120px;
  @media screen and (min-width: 1440px) {
    max-width: 180px;
  }
`

export function AddressDisplay({ address, enableCopyAddress }: { address: Address; enableCopyAddress?: boolean }) {
  const { data: ENSName } = useENSName(address)
  const { data: unitag } = useUnitagsAddressQuery({
    params: address ? { address } : undefined,
  })
  const uniswapUsername = unitag?.username

  const AddressDisplay = (
    <Flex row gap="2px" alignItems="center" data-testid={TestID.AddressDisplay}>
      <IdentifierText>{uniswapUsername ?? ENSName ?? shortenAddress(address)}</IdentifierText>
      {uniswapUsername && <Unitag size={18} />}
    </Flex>
  )

  if (!enableCopyAddress) {
    return AddressDisplay
  }

  return (
    <CopyHelper
      iconSize={14}
      iconPosition="right"
      toCopy={uniswapUsername ? uniswapUsername + '.uni.eth' : ENSName ? ENSName : address}
    >
      {AddressDisplay}
    </CopyHelper>
  )
}
