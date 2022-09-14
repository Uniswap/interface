import { Trans } from '@lingui/macro'
import styled from 'styled-components/macro'
import { CopyContractAddress } from 'theme'

export const ContractAddressSection = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 600;
  font-size: 14px;
  gap: 4px;
  padding: 36px 0px;
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
  cursor: pointer;
`

export default function AddressSection({ address }: { address: string }) {
  return (
    <ContractAddressSection>
      <Trans>Contract address</Trans>
      <ContractAddress>
        <CopyContractAddress address={address} />
      </ContractAddress>
    </ContractAddressSection>
  )
}
