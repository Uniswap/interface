import { Trans } from '@lingui/macro'
import { L2_CHAIN_IDS } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`
const Sub = styled.i`
  align-items: center;
  display: flex;
  justify-content: center;
  text-align: center;
`
interface EmptyStateProps {
  HeaderContent: () => JSX.Element
  SubHeaderContent: () => JSX.Element
}
const EmptyState = ({ HeaderContent, SubHeaderContent }: EmptyStateProps) => (
  <EmptyProposals>
    <TYPE.body style={{ marginBottom: '8px' }}>
      <HeaderContent />
    </TYPE.body>
    <TYPE.subHeader>
      <Sub>
        <SubHeaderContent />
      </Sub>
    </TYPE.subHeader>
  </EmptyProposals>
)

export default function ProposalEmptyState() {
  const { chainId } = useActiveWeb3React()
  if (chainId && L2_CHAIN_IDS.includes(chainId)) {
    return (
      <EmptyState
        HeaderContent={() => <Trans>Please connect to Layer 1 Ethereum</Trans>}
        SubHeaderContent={() => (
          <Trans>
            Uniswap governance is only available on Layer 1. Switch your network to Ethereum Mainnet to view Proposals
            and Vote.
          </Trans>
        )}
      />
    )
  }
  return (
    <EmptyState
      HeaderContent={() => <Trans>No proposals found.</Trans>}
      SubHeaderContent={() => <Trans>Proposals submitted by community members will appear here.</Trans>}
    />
  )
}
