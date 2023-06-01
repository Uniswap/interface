import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import styled from 'styled-components/macro'
import { BREAKPOINTS, ExternalLink, StyledRouterLink } from 'theme'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { DiscordIcon, GithubIcon, TwitterIcon } from './Icons'
import darkUnicornImgSrc from './images/unicornEmbossDark.png'
import lightUnicornImgSrc from './images/unicornEmbossLight.png'

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

const StyledLogo = styled.img`
  width: 72px;
  height: 72px;
  display: none;

  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    display: block;
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

const TextLink = styled(StyledRouterLink)`
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
  const isDarkMode = useIsDarkMode()
  return (
    <>
      <StyledLogo src={isDarkMode ? darkUnicornImgSrc : lightUnicornImgSrc} alt="Uniswap Logo" />
      <SocialLinks>
        <SocialLink href="https://discord.gg/FCfyBSbCU5" target="_blank" rel="noopener noreferrer">
          <DiscordIcon size={32} />
        </SocialLink>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={SharedEventName.ELEMENT_CLICKED}
          element={InterfaceElementName.TWITTER_LINK}
        >
          <SocialLink href="https://twitter.com/uniswap" target="_blank" rel="noopener noreferrer">
            <TwitterIcon size={32} />
          </SocialLink>
        </TraceEvent>
        <SocialLink href="https://github.com/Uniswap" target="_blank" rel="noopener noreferrer">
          <GithubIcon size={32} />
        </SocialLink>
      </SocialLinks>
      <Copyright>© {new Date().getFullYear()} Uniswap Labs</Copyright>
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
          <LinkGroupTitle>App</LinkGroupTitle>
          <TextLink to="/swap">Swap</TextLink>
          <TextLink to="/tokens">Tokens</TextLink>
          <TextLink to="/nfts">NFTs</TextLink>
          <TextLink to="/pools">Pools</TextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Protocol</LinkGroupTitle>
          <ExternalTextLink href="https://uniswap.org/community">Community</ExternalTextLink>
          <ExternalTextLink href="https://uniswap.org/governance">Governance</ExternalTextLink>
          <ExternalTextLink href="https://uniswap.org/developers">Developers</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Company</LinkGroupTitle>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={SharedEventName.ELEMENT_CLICKED}
            element={InterfaceElementName.CAREERS_LINK}
          >
            <ExternalTextLink href="https://boards.greenhouse.io/uniswaplabs">Careers</ExternalTextLink>
          </TraceEvent>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={SharedEventName.ELEMENT_CLICKED}
            element={InterfaceElementName.BLOG_LINK}
          >
            <ExternalTextLink href="https://uniswap.org/blog">Blog</ExternalTextLink>
          </TraceEvent>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Get Help</LinkGroupTitle>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={SharedEventName.ELEMENT_CLICKED}
            element={InterfaceElementName.SUPPORT_LINK}
          >
            <ExternalTextLink
              href="https://support.uniswap.org/hc/en-us/requests/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Us
            </ExternalTextLink>
          </TraceEvent>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            name={SharedEventName.ELEMENT_CLICKED}
            element={InterfaceElementName.SUPPORT_LINK}
          >
            <ExternalTextLink href="https://support.uniswap.org/hc/en-us">Help Center</ExternalTextLink>
          </TraceEvent>
        </LinkGroup>
      </FooterLinks>

      <LogoSectionBottom>
        <LogoSectionContent />
      </LogoSectionBottom>
    </Footer>
  )
}
