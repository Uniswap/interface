import { Trans } from '@lingui/macro'
import { ChainId } from '@thinkincoin-libs/sdk-core'
import { useWeb3React } from '@web3-react/core'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.deprecated_text4};
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
    <ThemedText.DeprecatedBody style={{ marginBottom: '8px' }}>
      <HeaderContent />
    </ThemedText.DeprecatedBody>
    <ThemedText.DeprecatedSubHeader>
      <Sub>
        <SubHeaderContent />
      </Sub>
    </ThemedText.DeprecatedSubHeader>
  </EmptyProposals>
)

export default function ProposalEmptyState() {
  const { chainId } = useWeb3React()
  if (chainId && chainId !== ChainId.MAINNET) {
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
