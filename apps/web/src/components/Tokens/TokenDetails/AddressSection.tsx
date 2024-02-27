import { Trans } from '@lingui/macro'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import styled from 'styled-components'
import { CopyContractAddress, ThemedText } from 'theme/components'
import { shortenAddress } from 'utilities/src/addresses'

const ContractAddressSection = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.neutral2};
  font-size: 0.9em;
  gap: 4px;
  padding: 4px 0px;
`

const ContractAddress = styled.button`
  display: flex;
  color: ${({ theme }) => theme.neutral1};
  gap: 10px;
  align-items: center;
  background: transparent;
  border: none;
  min-height: 38px;
  padding: 0px;
`

export default function AddressSection() {
  const { address } = useTDPContext()

  if (address === NATIVE_CHAIN_ID) return null

  return (
    <ContractAddressSection>
      <ThemedText.SubHeaderSmall>
        <Trans>Contract address</Trans>
      </ThemedText.SubHeaderSmall>
      <ContractAddress>
        <CopyContractAddress address={address} truncatedAddress={shortenAddress(address, 2, 3)} />
      </ContractAddress>
    </ContractAddressSection>
  )
}
