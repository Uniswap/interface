import { useAccount } from 'hooks/useAccount'
import styled from 'lib/styled-components'
import { ThemedText } from 'theme/components'
import { Trans } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'

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
  const { chainId } = useAccount()
  if (
    (chainId === UniverseChainId.Mainnet ||
      chainId === UniverseChainId.Goerli ||
      chainId === UniverseChainId.ArbitrumOne ||
      chainId === UniverseChainId.Optimism ||
      chainId === UniverseChainId.Polygon ||
      chainId === UniverseChainId.Base ||
      chainId === UniverseChainId.Bnb) &&
    chainId
  ) {
    return (
      <EmptyState
        HeaderContent={() => <Trans i18nKey="proposal.noneFound" />}
        SubHeaderContent={() => <Trans i18nKey="proposal.willAppearHere" />}
      />
    )
  }
  return (
    <EmptyState
      HeaderContent={() => <Trans i18nKey="proposal.connectLayer1" />}
      SubHeaderContent={() => <Trans i18nKey="proposal.layer1Warning" />}
    />
  )
}
