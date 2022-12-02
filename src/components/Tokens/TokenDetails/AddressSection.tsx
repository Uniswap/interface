import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { CopyContractAddress, ThemedText } from 'theme'

const ContractAddressSection = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 0.9em;
  gap: 4px;
  padding: 4px 0px;
`

const ContractAddress = styled.button`
  display: flex;
  color: ${({ theme }) => theme.textPrimary};
  gap: 10px;
  align-items: center;
  background: transparent;
  border: none;
  min-height: 38px;
  padding: 0px;
`

export default function AddressSection({ address }: { address: string }) {
  return (
    <ContractAddressSection>
      <ThemedText.SubHeaderSmall>
        <Trans>Contract address</Trans>
      </ThemedText.SubHeaderSmall>
      <ContractAddress>
        <CopyContractAddress address={address} />
      </ContractAddress>
    </ContractAddressSection>
  )
}
