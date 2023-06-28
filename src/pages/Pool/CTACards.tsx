import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { AutoColumn } from 'components/Column'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ExternalLink } from '../../theme'

const CTASection = styled.section`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  opacity: 0.8;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    grid-template-columns: auto;
    grid-template-rows: auto;
  `};
`

const CTA = styled(ExternalLink)`
  padding: 16px;
  border-radius: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.deepShadow};
  background: ${({ theme }) => theme.backgroundScrolledSurface};

  * {
    color: ${({ theme }) => theme.textPrimary};
    text-decoration: none !important;
  }

  :hover {
    text-decoration: none;
    * {
      text-decoration: none !important;
    }
  }
`

const HeaderText = styled(ThemedText.DeprecatedLabel)`
  align-items: center;
  display: flex;

  font-weight: 400;
  font-size: 16px;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { infoLink } = getChainInfoOrDefault(chainId)
  // TODO: check liquidity docs

  return (
    <CTASection>
      <CTA href="https://docs.pegasys.fi/sdk/v3/guides/liquidity/minting">
        <ResponsiveColumn>
          <HeaderText>
            <Trans>Learn about providing liquidity</Trans> ↗
          </HeaderText>
          <ThemedText.DeprecatedBody fontWeight={400} style={{ alignItems: 'center', display: 'flex' }}>
            <Trans>Check out our v3 LP walkthrough and migration guides.</Trans>
          </ThemedText.DeprecatedBody>
        </ResponsiveColumn>
      </CTA>
      <CTA data-testid="cta-infolink" href={infoLink + 'pools'}>
        <ResponsiveColumn>
          <HeaderText style={{ alignSelf: 'flex-start' }}>
            <Trans>Top pools</Trans> ↗
          </HeaderText>
          <ThemedText.DeprecatedBody fontWeight={400} style={{ alignSelf: 'flex-start' }}>
            <Trans>Explore Pegasys Analytics.</Trans>
          </ThemedText.DeprecatedBody>
        </ResponsiveColumn>
      </CTA>
    </CTASection>
  )
}
