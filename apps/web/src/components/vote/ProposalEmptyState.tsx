import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { ThemedText } from 'theme/components'
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
  if (chainId && chainId !== UniverseChainId.Mainnet) {
    return (
      <EmptyState
        HeaderContent={() => <Trans i18nKey="proposal.connectLayer1" />}
        SubHeaderContent={() => <Trans i18nKey="proposal.layer1Warning" />}
      />
    )
  }
  return (
    <EmptyState
      HeaderContent={() => <Trans i18nKey="proposal.noneFound" />}
      SubHeaderContent={() => <Trans i18nKey="proposal.willAppearHere" />}
    />
  )
}
