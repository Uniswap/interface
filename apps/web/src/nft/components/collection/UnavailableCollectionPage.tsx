import Column from 'components/deprecated/Column'
import styled, { useTheme } from 'lib/styled-components'
import { AlertTriangle } from 'react-feather'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ExternalLink, StyledInternalLink } from 'theme/components/Links'
import { uniswapUrls } from 'uniswap/src/constants/urls'

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
          <Trans i18nKey="nft.blockedCollection" />
        </ThemedText.HeadlineMedium>
        <StyledInternalLink to="/nfts">
          <Trans i18nKey="nft.returnToExplore" />
        </StyledInternalLink>
        <StyledExternalLink href={uniswapUrls.helpArticleUrls.unsupportedTokenPolicy}>
          <Trans i18nKey="nft.learnWhy" />
        </StyledExternalLink>
      </Container>
    )
  }

  return (
    <Container>
      <ThemedText.HeadlineMedium>
        <Trans i18nKey="nft.noneAtAddress" />
      </ThemedText.HeadlineMedium>
      <StyledInternalLink to="/nfts">
        <Trans i18nKey="nft.returnToExplore" />
      </StyledInternalLink>
    </Container>
  )
}
