import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { Container, PopupContainer, StyledXButton, TextContainer } from 'components/Banner/shared/styled'
import { chainIdToBackendName } from 'graphql/data/util'
import { useState } from 'react'
import { Globe } from 'react-feather'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { capitalize } from 'tsafe'

const IconContainer = styled.div`
  height: 100%;
  margin: 12px 0 0 12px;
  align-self: flex-start;
`

const IconBackground = styled.div`
  background-color: #1f1e02;
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

export function getOutageBannerSessionStorageKey(chainId: ChainId) {
  return `hideOutageBanner-${chainId}`
}

export function OutageBanner({ chainId }: { chainId: ChainId }) {
  const [hidden, setHidden] = useState(false)
  const theme = useTheme()

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
            <Trans>Data will be back soon</Trans>
          </ThemedText.BodySmall>
          <ThemedText.LabelMicro>
            <Trans>
              {capitalize(chainIdToBackendName(chainId).toLowerCase())} data is unavailable right now, but we expect the
              issue to be resolved shortly.
            </Trans>
          </ThemedText.LabelMicro>
          <ThemedText.LabelMicro>
            <Trans>You can still swap and provide liquidity for this token without issue.</Trans>
          </ThemedText.LabelMicro>
          <HelpCenterLink href="https://support.uniswap.org/hc/en-us/articles/23952001935373-Subgraph-downtime">
            <Trans>Learn more</Trans>
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
