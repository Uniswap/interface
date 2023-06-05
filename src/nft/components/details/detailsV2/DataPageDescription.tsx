import { Trans } from '@lingui/macro'
import { DiscordIcon } from 'components/About/Icons'
import Column from 'components/Column'
import Row from 'components/Row'
import { CollectionInfoForAsset } from 'nft/types'
import { Globe, Twitter } from 'react-feather'
import ReactMarkdown from 'react-markdown'
import styled, { css } from 'styled-components/macro'
import { ExternalLink } from 'theme'

import { Tab, TabbedComponent } from './TabbedComponent'

const DescriptionContentContainer = styled.div`
  height: 252px;
`

const DescriptionContainer = styled(ReactMarkdown)`
  font-size: 14px;
  font-weight: 400;
  width: 100%;
  line-height: 20px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  p {
    margin-top: 0px;
    margin-bottom: 12px;
  }

  a {
    text-decoration: none;
    font-weight: 500;
    color: ${({ theme }) => theme.textPrimary};
    &:hover {
      opacity: ${({ theme }) => theme.opacity.hover};
    }
  }
`

const SocialsRow = styled(Row)`
  gap: 24px;
  padding-left: 8px;
`

const IconStyles = css`
  cursor: pointer;
  color: ${({ theme }) => theme.textSecondary};
  &:hover {
    opacity: ${({ theme }) => theme.opacity.hover};
  }
  height: 20px;
  width: 20px;
`

const StyledGlobe = styled(Globe)`
  ${IconStyles}
`

const StyledTwitter = styled(Twitter)`
  ${IconStyles}
  fill: ${({ theme }) => theme.textSecondary};
`

const StyledDiscord = styled(DiscordIcon)`
  ${IconStyles}
`

const DescriptionContent = ({ collection }: { collection: CollectionInfoForAsset }) => {
  return (
    <Column gap="md">
      <DescriptionContainer source={collection.collectionDescription ?? ''} />
      <SocialsRow>
        {collection.externalUrl && (
          <ExternalLink href={collection.externalUrl}>
            <StyledGlobe />
          </ExternalLink>
        )}
        {collection.twitterUrl && (
          <ExternalLink href={`https://twitter.com/${collection.twitterUrl}`}>
            <StyledTwitter />
          </ExternalLink>
        )}
        {collection.discordUrl && (
          <ExternalLink href={collection.discordUrl}>
            <StyledDiscord />
          </ExternalLink>
        )}
      </SocialsRow>
    </Column>
  )
}

const DetailsContent = ({ collection, tokenId }: { collection: CollectionInfoForAsset; tokenId: string }) => {
  return <DescriptionContentContainer>Details Content</DescriptionContentContainer>
}

enum DescriptionTabsKeys {
  Description = 'description',
  Details = 'details',
}

export const DataPageDescription = ({
  collection,
  tokenId,
}: {
  collection: CollectionInfoForAsset
  tokenId: string
}) => {
  const DescriptionTabs: Map<string, Tab> = new Map([
    [
      DescriptionTabsKeys.Description,
      {
        title: <Trans>Description</Trans>,
        key: DescriptionTabsKeys.Description,
        content: <DescriptionContent collection={collection} />,
      },
    ],
    [
      DescriptionTabsKeys.Details,
      {
        title: <Trans>Details</Trans>,
        key: DescriptionTabsKeys.Details,
        content: <DetailsContent collection={collection} tokenId={tokenId} />,
      },
    ],
  ])
  return <TabbedComponent tabs={DescriptionTabs} />
}
