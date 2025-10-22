import { BrowserEvent, InterfaceElementName, SharedEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import styled from 'styled-components'
import { BREAKPOINTS, ExternalLink, StyledRouterLink } from 'theme'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import { TaikoLogo } from 'components/Logo/TaikoLogo'
import { DiscordIcon, GithubIcon, TwitterIcon } from './Icons'

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

const StyledLogoWrapper = styled.div`
  width: 72px;
  height: 72px;
  display: none;
  color: ${({ theme }) => theme.accent1};

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
  font-weight: 535;
`

const ExternalTextLink = styled(ExternalLink)`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.neutral2};
`

const TextLink = styled(StyledRouterLink)`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.neutral2};
`

const Copyright = styled.span`
  font-size: 16px;
  line-height: 20px;
  margin: 1rem 0 0 0;
  color: ${({ theme }) => theme.neutral3};
`

const LogoSectionContent = () => {
  return (
    <>
      <StyledLogoWrapper>
        <TaikoLogo width="72" height="72" />
      </StyledLogoWrapper>
      <SocialLinks>
        <SocialLink href="https://discord.gg/taikoxyz" target="_blank" rel="noopener noreferrer">
          <DiscordIcon size={32} />
        </SocialLink>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={SharedEventName.ELEMENT_CLICKED}
          element={InterfaceElementName.TWITTER_LINK}
        >
          <SocialLink href="https://twitter.com/taikoxyz" target="_blank" rel="noopener noreferrer">
            <TwitterIcon size={32} />
          </SocialLink>
        </TraceEvent>
        <SocialLink href="https://github.com/taikoxyz" target="_blank" rel="noopener noreferrer">
          <GithubIcon size={32} />
        </SocialLink>
      </SocialLinks>
      <Copyright>© {new Date().getFullYear()} Taiko Labs</Copyright>
    </>
  )
}

export const AboutFooter = () => {
  const shouldDisableNFTRoutes = useDisableNFTRoutes()
  return (
    <Footer>
      <LogoSectionLeft>
        <LogoSectionContent />
      </LogoSectionLeft>

      <FooterLinks>
        <LinkGroup>
          <LinkGroupTitle>Network</LinkGroupTitle>
          <TextLink to="/swap">Swap</TextLink>
          <TextLink to="/pools">Pools</TextLink>
          <ExternalTextLink href="https://bridge.taiko.xyz">Bridge</ExternalTextLink>
          <ExternalTextLink href="https://hoodi.taikoscan.io">Explorer</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Resources</LinkGroupTitle>
          <ExternalTextLink href="https://docs.taiko.xyz">Docs</ExternalTextLink>
          <ExternalTextLink href="https://taiko.xyz/blog">Blog</ExternalTextLink>
          <ExternalTextLink href="https://github.com/taikoxyz">GitHub</ExternalTextLink>
          <ExternalTextLink href="https://taiko.xyz/brand-kit">Brand Kit</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>Community</LinkGroupTitle>
          <ExternalTextLink href="https://discord.gg/taikoxyz">Discord</ExternalTextLink>
          <ExternalTextLink href="https://twitter.com/taikoxyz">Twitter</ExternalTextLink>
          <ExternalTextLink href="https://taiko.xyz/community">Community Hub</ExternalTextLink>
          <ExternalTextLink href="https://taiko.xyz/grants">Grants</ExternalTextLink>
        </LinkGroup>
        <LinkGroup>
          <LinkGroupTitle>About</LinkGroupTitle>
          <ExternalTextLink href="https://taiko.xyz">Taiko Labs</ExternalTextLink>
          <ExternalTextLink href="https://taiko.xyz/careers">Careers</ExternalTextLink>
          <ExternalTextLink href="https://taiko.xyz/about">About Us</ExternalTextLink>
        </LinkGroup>
      </FooterLinks>

      <LogoSectionBottom>
        <LogoSectionContent />
      </LogoSectionBottom>
    </Footer>
  )
}
