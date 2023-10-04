import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { SupportArticleURL } from 'constants/supportArticles'
import { AlertTriangle } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, StyledInternalLink, ThemedText } from 'theme/components'

const Container = styled(Column)`
  height: 75vh;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 48px;
  gap: 8px;
`
const StyledExternalLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.neutral2};
`
export function UnavailableCollectionPage({ isBlocked }: { isBlocked?: boolean }) {
  const theme = useTheme()

  if (isBlocked) {
    return (
      <Container>
        <AlertTriangle
          width="48px"
          height="48px"
          stroke={theme.background}
          strokeWidth="1px"
          fill={theme.critical}
          data-testid="alert-icon"
        />
        <ThemedText.HeadlineMedium>
          <Trans>This collection is blocked</Trans>
        </ThemedText.HeadlineMedium>
        <StyledInternalLink to="/nfts">
          <Trans>Return to NFT Explore</Trans>
        </StyledInternalLink>
        <StyledExternalLink href={SupportArticleURL.UNSUPPORTED_TOKEN_AND_NFT_POLICY}>
          <Trans>Learn why</Trans>
        </StyledExternalLink>
      </Container>
    )
  }

  return (
    <Container>
      <ThemedText.HeadlineMedium>
        <Trans>No collection assets exist at this address</Trans>
      </ThemedText.HeadlineMedium>
      <StyledInternalLink to="/nfts">
        <Trans>Return to NFT Explore</Trans>
      </StyledInternalLink>
    </Container>
  )
}
