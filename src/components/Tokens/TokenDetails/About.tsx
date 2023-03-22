import { Trans } from '@lingui/macro'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { darken } from 'polished'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { textFadeIn } from 'theme/styles'

import Resource from './Resource'

const NoInfoAvailable = styled.span`
  color: ${({ theme }) => theme.textTertiary};
  font-weight: 400;
  font-size: 16px;
`
const TokenDescriptionContainer = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  max-height: fit-content;
  padding-top: 16px;
  line-height: 24px;
  white-space: pre-wrap;
`

const TruncateDescriptionButton = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-weight: 400;
  font-size: 0.85em;
  padding-top: 0.5em;

  &:hover,
  &:focus {
    color: ${({ theme }) => darken(0.1, theme.textSecondary)};
    cursor: pointer;
  }
`

const truncateDescription = (desc: string) => {
  //trim the string to the maximum length
  let tokenDescriptionTruncated = desc.slice(0, TRUNCATE_CHARACTER_COUNT)
  //re-trim if we are in the middle of a word
  tokenDescriptionTruncated = `${tokenDescriptionTruncated.slice(
    0,
    Math.min(tokenDescriptionTruncated.length, tokenDescriptionTruncated.lastIndexOf(' '))
  )}...`
  return tokenDescriptionTruncated
}

const TRUNCATE_CHARACTER_COUNT = 400

export const AboutContainer = styled.div`
  gap: 16px;
  padding: 24px 0px;
  ${textFadeIn}
`
export const AboutHeader = styled(ThemedText.MediumHeader)`
  font-size: 28px !important;
`

const ResourcesContainer = styled.div`
  display: flex;
  padding-top: 12px;
  gap: 14px;
`

type AboutSectionProps = {
  address: string
  chainId: SupportedChainId
  description?: string | null | undefined
  homepageUrl?: string | null | undefined
  twitterName?: string | null | undefined
}

export function AboutSection({ address, chainId, description, homepageUrl, twitterName }: AboutSectionProps) {
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(true)
  const shouldTruncate = !!description && description.length > TRUNCATE_CHARACTER_COUNT

  const tokenDescription = shouldTruncate && isDescriptionTruncated ? truncateDescription(description) : description

  const { explorer, infoLink } = getChainInfo(chainId)

  return (
    <AboutContainer data-testid="token-details-about-section">
      <AboutHeader>
        <Trans>About</Trans>
      </AboutHeader>
      <TokenDescriptionContainer>
        {!description && (
          <NoInfoAvailable>
            <Trans>No token information available</Trans>
          </NoInfoAvailable>
        )}
        {tokenDescription}
        {shouldTruncate && (
          <TruncateDescriptionButton onClick={() => setIsDescriptionTruncated(!isDescriptionTruncated)}>
            {isDescriptionTruncated ? <Trans>Show more</Trans> : <Trans>Hide</Trans>}
          </TruncateDescriptionButton>
        )}
      </TokenDescriptionContainer>
      <br />
      <ThemedText.SubHeaderSmall>
        <Trans>Links</Trans>
      </ThemedText.SubHeaderSmall>
      <ResourcesContainer data-cy="resources-container">
        <Resource
          name={chainId === SupportedChainId.MAINNET ? 'Etherscan' : 'Block Explorer'}
          link={`${explorer}${address === 'NATIVE' ? '' : 'address/' + address}`}
        />
        <Resource name="More analytics" link={`${infoLink}tokens/${address}`} />
        {homepageUrl && <Resource name="Website" link={homepageUrl} />}
        {twitterName && <Resource name="Twitter" link={`https://twitter.com/${twitterName}`} />}
      </ResourcesContainer>
    </AboutContainer>
  )
}
