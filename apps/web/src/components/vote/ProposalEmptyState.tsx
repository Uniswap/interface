import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trans } from 'i18n'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.neutral2};
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
  // TODO: add bsc support
  if (
    (chainId && chainId === ChainId.MAINNET) ||
    (chainId && chainId === ChainId.GOERLI) ||
    (chainId && chainId === ChainId.ARBITRUM_ONE) ||
    (chainId && chainId === ChainId.OPTIMISM) ||
    (chainId && chainId === ChainId.POLYGON) ||
    (chainId && chainId === ChainId.BASE) ||
    (chainId && chainId === ChainId.BNB)
  ) {
    return (
      <EmptyState
        HeaderContent={() => <Trans>No proposals found.</Trans>}
        SubHeaderContent={() => <Trans>Proposals submitted by community members will appear here.</Trans>}
      />
    )
  }
  return (
    <EmptyState
      HeaderContent={() => <Trans>Please connect to a supported network</Trans>}
      SubHeaderContent={() => (
        <Trans>
          No proposals found. Rigoblock governance is available on Ethereum, Arbitrum, Optimism, Bsc and Polygon. Switch
          your network to a supported one to view Proposals and Vote.
        </Trans>
      )}
    />
  )
}
