import { Container, PopupContainer, StyledXButton, TextContainer } from 'components/Banner/shared/styled'
import { chainIdToBackendChain } from 'constants/chains'
import { ChainOutageData } from 'featureFlags/flags/outageBanner'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { useState } from 'react'
import { Globe } from 'react-feather'
import { ExternalLink, ThemedText } from 'theme/components'
import { capitalize } from 'tsafe'
import { UniverseChainId } from 'uniswap/src/types/chains'

const IconContainer = styled.div`
  height: 100%;
  margin: 12px 0 0 12px;
  align-self: flex-start;
`

const IconBackground = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.deprecated_accentWarningSoft};
  padding: 10px;
  border-radius: 12px;
`

const StyledPopupContainer = styled(PopupContainer)`
  height: unset;
`

const OutageTextContainer = styled(TextContainer)`
  padding: 10px 10px 10px 0;
`

const HelpCenterLink = styled(ExternalLink)`
  font-size: 14px;
  margin-top: 4px;
`

export function getOutageBannerSessionStorageKey(chainId: UniverseChainId) {
  return `hideOutageBanner-${chainId}`
}

export function OutageBanner({ chainId, version }: ChainOutageData) {
  const [hidden, setHidden] = useState(false)
  const theme = useTheme()
  const versionName = version ? version.toString().toLowerCase() + ' data' : 'Data'
  const chainName = capitalize(chainIdToBackendChain({ chainId, withFallback: true }).toLowerCase())
  const versionDescription = version ? ' ' + version.toString().toLowerCase() : ''

  return (
    <StyledPopupContainer show={!hidden}>
      <Container>
        <IconContainer>
          <IconBackground>
            <Globe size={28} color={theme.warning2} />
          </IconBackground>
        </IconContainer>
        <OutageTextContainer>
          <ThemedText.BodySmall lineHeight="20px">
            <Trans i18nKey="outageBanner.title" values={{ versionName }} />
          </ThemedText.BodySmall>
          <ThemedText.LabelMicro>
            <Trans i18nKey="outageBanner.message" values={{ chainName, versionDescription }} />
          </ThemedText.LabelMicro>
          <ThemedText.LabelMicro>
            <Trans i18nKey="outageBanner.message.sub" />
          </ThemedText.LabelMicro>
          <HelpCenterLink href="https://support.uniswap.org/hc/en-us/articles/23952001935373-Subgraph-downtime">
            <Trans i18nKey="common.learnMore.link" />
          </HelpCenterLink>
        </OutageTextContainer>
        <StyledXButton
          data-testid="uniswap-outage-banner"
          size={24}
          onClick={() => {
            setHidden(true)
            sessionStorage.setItem(getOutageBannerSessionStorageKey(chainId), 'true')
          }}
        />
      </Container>
    </StyledPopupContainer>
  )
}
