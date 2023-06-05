import { Trans } from '@lingui/macro'
import { DiscordIcon } from 'components/About/Icons'
import Column from 'components/Column'
import Row from 'components/Row'
import { CollectionInfoForAsset, GenieAsset } from 'nft/types'
import { Globe, Twitter } from 'react-feather'
import ReactMarkdown from 'react-markdown'
import styled, { css } from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { shortenAddress } from 'utils'

import { Tab, TabbedComponent } from './TabbedComponent'

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

const DetailRow = styled(Row)`
  justify-content: space-between;
  align-items: center;
  padding: 12px 0px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  &:last-child {
    border-bottom: none;
  }
`

const StyledLink = styled(ExternalLink)`
  color: ${({ theme }) => theme.textPrimary};
`

const DetailsContent = ({ asset }: { asset: GenieAsset }) => {
  return (
    <Column>
      <DetailRow>
        <ThemedText.SubHeaderSmall>
          <Trans>Contract address</Trans>
        </ThemedText.SubHeaderSmall>
        <ThemedText.BodyPrimary>
          <StyledLink href={`https://etherscan.io/address/${asset.address}`}>
            {shortenAddress(asset.address)}
          </StyledLink>
        </ThemedText.BodyPrimary>
      </DetailRow>
      <DetailRow>
        <ThemedText.SubHeaderSmall>
          <Trans>Token Standard</Trans>
        </ThemedText.SubHeaderSmall>
        <ThemedText.BodyPrimary>{asset.tokenType === 'ERC721' ? 'ERC-721' : 'ERC-1155'}</ThemedText.BodyPrimary>
      </DetailRow>
      <DetailRow>
        <ThemedText.SubHeaderSmall>
          <Trans>Token ID</Trans>
        </ThemedText.SubHeaderSmall>
        <ThemedText.BodyPrimary>{asset.tokenId}</ThemedText.BodyPrimary>
      </DetailRow>
      {/* TODO(NFT-1140) Add creator royalties when BE adds to Details query */}
    </Column>
  )
}

enum DescriptionTabsKeys {
  Description = 'description',
  Details = 'details',
}

export const DataPageDescription = ({
  collection,
  asset,
}: {
  collection: CollectionInfoForAsset
  asset: GenieAsset
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
        content: <DetailsContent asset={asset} />,
      },
    ],
  ])
  return <TabbedComponent tabs={DescriptionTabs} />
}
