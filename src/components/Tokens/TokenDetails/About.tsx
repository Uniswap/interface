import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { getChainInfo } from 'constants/chainInfo'
import { useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'

import Resource from './Resource'
import { NoInfoAvailable, TRUNCATE_CHARACTER_COUNT, truncateDescription, TruncateDescriptionButton } from './shared'

const TokenDescriptionContainer = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  max-height: fit-content;
  padding-top: 16px;
  line-height: 24px;
  white-space: pre-wrap;
`

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
  chainId: ChainId
  description?: string | null
  homepageUrl?: string | null
  twitterName?: string | null
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
          name={chainId === ChainId.MAINNET ? 'Etherscan' : 'Block Explorer'}
          link={`${explorer}${address === 'NATIVE' ? '' : 'address/' + address}`}
        />
        <Resource name="More analytics" link={`${infoLink}tokens/${address}`} />
        {homepageUrl && <Resource name="Website" link={homepageUrl} />}
        {twitterName && <Resource name="Twitter" link={`https://twitter.com/${twitterName}`} />}
      </ResourcesContainer>
    </AboutContainer>
  )
}
