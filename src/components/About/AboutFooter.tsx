import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ExternalLink } from 'theme'

import Telegram from '../../pages/Landing/images/telegram.svg'
import { GithubIcon, TwitterIcon } from './Icons'

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 48px;
  max-width: 1440px;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    flex-direction: row;
    justify-content: space-between;
  }
`

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
`

const LogoSectionLeft = styled(LogoSection)`
  display: none;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: flex;
  }
`

const LogoSectionBottom = styled(LogoSection)`
  display: flex;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: none;
  }
`

const SocialLinks = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 20px 0 0 0;
`

const SocialLink = styled.a`
  display: flex;
`

const FooterLinks = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 24px;
  }
`

const LinkGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 200px;
  margin: 20px 0 0 0;
  @media screen and (min-width: ${BREAKPOINTS.xl}px) {
    margin: 0;
  }
`

const LinkGroupTitle = styled.span`
  font-size: 16px;
  line-height: 20px;
  font-weight: 700;
`

const ExternalTextLink = styled(ExternalLink)`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.textSecondary};
`

const Copyright = styled.span`
  font-size: 16px;
  line-height: 20px;
  margin: 1rem 0 0 0;
  color: ${({ theme }) => theme.textTertiary};
`

const LogoSectionContent = () => {
  return (
    <>
      <img style={{ width: '220px', height: '40px' }} src="/images/ForgeLogoFinal.png" />{' '}
      <SocialLinks>
        <SocialLink href="https://t.me/forgeDEX" target="_blank" rel="noopener noreferrer">
          <img src={Telegram} style={{ width: '28px', height: '28px' }} />
        </SocialLink>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={SharedEventName.ELEMENT_CLICKED}
          element={InterfaceElementName.TWITTER_LINK}
        >
          <SocialLink href="https://twitter.com/forgeDEX" target="_blank" rel="noopener noreferrer">
            <TwitterIcon fill="white" size={28} />
          </SocialLink>
        </TraceEvent>
        <SocialLink href="https://github.com/Forge-Trade" target="_blank" rel="noopener noreferrer">
          <GithubIcon fill="white" size={28} />
        </SocialLink>
      </SocialLinks>
      <Copyright>© {new Date().getFullYear()} Evmos community</Copyright>
    </>
  )
}

export const AboutFooter = () => {
  return (
    <Footer>
      <LogoSectionLeft>
        <LogoSectionContent />
      </LogoSectionLeft>

      <FooterLinks>
        <LinkGroup>
          <LinkGroupTitle>Orbital Apes</LinkGroupTitle>
          <ExternalTextLink href="https://orbitalapes.com">Validator</ExternalTextLink>
          <ExternalTextLink href="https://www.orbitmarket.io">Orbit Market</ExternalTextLink>
          <ExternalTextLink href="https://hub.orbitalapes.com">OA Hub</ExternalTextLink>
          <ExternalTextLink href="https://www.orbitrumble.com/">Rumble</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Evmos DAO</LinkGroupTitle>
          <ExternalTextLink href="https://gov.evmos.community">Governance Overview</ExternalTextLink>
          <ExternalTextLink href="https://docs.evmos.community">Governance Docs</ExternalTextLink>
          <ExternalTextLink href="https://twitter.com/EvmosDAO">EvmosDAO Twitter</ExternalTextLink>
          <ExternalTextLink href="https://t.me/EvmosDAO">EvmosDAO Telegram</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Evmos Network</LinkGroupTitle>
          <ExternalTextLink href="https://app.evmos.org">Dashboard</ExternalTextLink>
          <ExternalTextLink href="https://docs.evmos.org/">Developers</ExternalTextLink>
          <ExternalTextLink href="https://wallet.keplr.app/chains/evmos?tab=governance">Stake & Vote</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Get Help</LinkGroupTitle>
          <ExternalTextLink href="https://t.me/forgeDEX" target="_blank" rel="noopener noreferrer">
            Telegram
          </ExternalTextLink>
        </LinkGroup>
      </FooterLinks>

      <LogoSectionBottom>
        <LogoSectionContent />
      </LogoSectionBottom>
    </Footer>
  )
}
