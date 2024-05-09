import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { AutoColumn } from 'components/Column'
import { CHAIN_INFO, useSupportedChainId } from 'constants/chains'
import { Trans } from 'i18n'
import styled, { css } from 'styled-components'
import { ExternalLink, StyledInternalLink, ThemedText } from 'theme/components'

const CTASection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  opacity: 0.8;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    grid-template-columns: auto;
    grid-template-rows: auto;
  `};
`

const CTAStyle = css`
  padding: 16px;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.surface3};
  text-decoration: none;

  * {
    color: ${({ theme }) => theme.neutral1};
    text-decoration: none !important;
  }

  :hover {
    border: 1px solid ${({ theme }) => theme.surface3};

    * {
      text-decoration: none !important;
    }
  }
`

const CTAExternalLink = styled(ExternalLink)`
  ${CTAStyle}
`
const CTALink = styled(StyledInternalLink)`
  ${CTAStyle}
`

const HeaderText = styled(ThemedText.DeprecatedLabel)`
  align-items: center;
  display: flex;
  font-size: 16px;
  font-weight: 535 !important;
  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    font-size: 16px;
  `};
`

const ResponsiveColumn = styled(AutoColumn)`
  grid-template-columns: 1fr;
  width: 100%;
  gap: 8px;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    gap: 8px;
  `};
  justify-content: space-between;
`

export default function CTACards() {
  const { chainId } = useWeb3React()
  const chain = CHAIN_INFO[useSupportedChainId(chainId) ?? ChainId.MAINNET]

  return (
    <CTASection>
      <CTAExternalLink href="https://support.uniswap.org/hc/en-us/categories/8122334631437-Providing-Liquidity-">
        <ResponsiveColumn>
          <HeaderText>
            <Trans>Learn about providing liquidity</Trans> ↗
          </HeaderText>
          <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485 }}>
            <Trans>Check out our v3 LP walkthrough and migration guides.</Trans>
          </ThemedText.DeprecatedBody>
        </ResponsiveColumn>
      </CTAExternalLink>
      <CTALink data-testid="cta-poolslink" to={`/explore/pools/${chain.urlParam}`}>
        <ResponsiveColumn>
          <HeaderText style={{ alignSelf: 'flex-start' }}>
            <Trans>Top pools</Trans> ↗
          </HeaderText>
          <ThemedText.DeprecatedBody style={{ alignSelf: 'flex-start', fontWeight: 485 }}>
            <Trans>Explore Uniswap Analytics.</Trans>
          </ThemedText.DeprecatedBody>
        </ResponsiveColumn>
      </CTALink>
    </CTASection>
  )
}
