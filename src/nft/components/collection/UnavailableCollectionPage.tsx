import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { darken } from 'polished'
import { AlertTriangle } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { css, useTheme } from 'styled-components'
import { ThemedText } from 'theme'

const Container = styled(Column)`
  height: 75vh;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 48px;
  gap: 8px;
`
const LinkStyles = css`
  color: ${({ theme }) => theme.accent1};
  text-decoration: none;
  &:hover,
  &:focus {
    color: ${({ theme }) => darken(0.1, theme.accent1)};
  }
`
const InternalLink = styled(Link)`
  ${LinkStyles};
`
const ExternalLink = styled.a`
  ${LinkStyles};
`
export function UnavailableCollectionPage({ isBlocked }: { isBlocked?: boolean }) {
  const theme = useTheme()
  return isBlocked ? (
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
      <ExternalLink
        href="https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Trans>Learn why</Trans>
      </ExternalLink>
      <InternalLink to="/nfts">
        <Trans>Return to NFT Explore</Trans>
      </InternalLink>
    </Container>
  ) : (
    <Container>
      <ThemedText.HeadlineMedium>
        <Trans>No collection assets exist at this address</Trans>
      </ThemedText.HeadlineMedium>
      <InternalLink to="/nfts">
        <Trans>Return to NFT Explore</Trans>
      </InternalLink>
    </Container>
  )
}
