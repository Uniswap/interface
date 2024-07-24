import { AutoColumn } from 'components/Column'
import { useSupportedChainId } from 'constants/chains'
import { useAccount } from 'hooks/useAccount'
import { Trans } from 'i18n'
import styled, { css } from 'lib/styled-components'
import { ExternalLink, StyledInternalLink, ThemedText } from 'theme/components'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { UniverseChainId } from 'uniswap/src/types/chains'

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
  const { chainId } = useAccount()
  const chain = UNIVERSE_CHAIN_INFO[useSupportedChainId(chainId) ?? UniverseChainId.Mainnet]

  return (
    <CTASection>
      <CTAExternalLink href="https://support.uniswap.org/hc/en-us/categories/8122334631437-Providing-Liquidity-">
        <ResponsiveColumn>
          <HeaderText>
            <Trans i18nKey="pool.learnLiquidity" /> ↗
          </HeaderText>
          <ThemedText.DeprecatedBody style={{ alignItems: 'center', display: 'flex', fontWeight: 485 }}>
            <Trans i18nKey="pool.learnv3LP" />
          </ThemedText.DeprecatedBody>
        </ResponsiveColumn>
      </CTAExternalLink>
      <CTALink data-testid="cta-poolslink" to={`/explore/pools/${chain.urlParam}`}>
        <ResponsiveColumn>
          <HeaderText style={{ alignSelf: 'flex-start' }}>
            <Trans i18nKey="pool.top" /> ↗
          </HeaderText>
          <ThemedText.DeprecatedBody style={{ alignSelf: 'flex-start', fontWeight: 485 }}>
            <Trans i18nKey="pool.exporeAnalytics" />
          </ThemedText.DeprecatedBody>
        </ResponsiveColumn>
      </CTALink>
    </CTASection>
  )
}
