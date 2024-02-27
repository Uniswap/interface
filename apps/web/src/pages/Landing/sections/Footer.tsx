import { Trans } from '@lingui/macro'
import { useScreenSize } from 'hooks/useScreenSize'
import { Link } from 'react-router-dom'
import { useTogglePrivacyPolicy } from 'state/application/hooks'
import styled, { css } from 'styled-components'
import { ExternalLink } from 'theme/components'

import { Wiggle } from '../components/animations'
import { Body1, Box, H3 } from '../components/Generics'
import { Discord, Github, Twitter } from '../components/Icons'

const SocialIcon = styled(Wiggle)`
  flex: 0;
  fill: ${(props) => props.theme.neutral1};
  cursor: pointer;
  transition: fill;
  transition-duration: 0.2s;
  &:hover {
    fill: ${(props) => props.$hoverColor};
  }
`
const RowToCol = styled(Box)`
  height: auto;
  flex-shrink: 1;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`
const HideWhenSmall = styled(Box)`
  @media (max-width: 768px) {
    display: none;
  }
`
const HideWhenLarge = styled(Box)`
  @media (min-width: 768px) {
    display: none;
  }
`
const MenuItemStyles = css`
  padding: 0;
  margin: 0;
  text-align: left;
  font-family: Basel;
  font-size: 16px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px;
  color: ${({ theme }) => theme.neutral2};
  stroke: none;
  transition: color 0.1s ease-in-out;
  text-decoration: none;
  &:hover {
    color: ${({ theme }) => theme.neutral1};
    opacity: 1;
  }
`
const StyledInternalLink = styled(Link)`
  ${MenuItemStyles}
`
const StyledExternalLink = styled(ExternalLink)`
  ${MenuItemStyles}
`
const DownloadLink = styled.a`
  ${MenuItemStyles}
`
const ModalItem = styled.div`
  ${MenuItemStyles}
  cursor: pointer;
  user-select: none;
`
export function Socials({ iconSize }: { iconSize?: string }) {
  return (
    <Box gap="24px">
      <SocialIcon $hoverColor="#00C32B">
        <StyledExternalLink href="https://github.com/Uniswap">
          <Github size={iconSize} fill="inherit" />
        </StyledExternalLink>
      </SocialIcon>
      <SocialIcon $hoverColor="#20BAFF">
        <StyledExternalLink href="https://twitter.com/Uniswap">
          <Twitter size={iconSize} fill="inherit" />
        </StyledExternalLink>
      </SocialIcon>
      <SocialIcon $hoverColor="#5F51FF">
        <StyledExternalLink href="https://discord.com/invite/uniswap">
          <Discord size={iconSize} fill="inherit" />
        </StyledExternalLink>
      </SocialIcon>
    </Box>
  )
}

export function Footer() {
  const screenIsLarge = useScreenSize()['lg']
  const togglePrivacyPolicy = useTogglePrivacyPolicy()

  return (
    <Box as="footer" direction="column" align="center" padding={screenIsLarge ? '0 40px' : '0 48px'}>
      <Box direction="row" maxWidth="1280px" gap="24px">
        <RowToCol direction="row" justify-content="space-between" gap="32px">
          <Box direction="column" height="100%" gap="64px">
            <Box direction="column" gap="10px">
              <H3>© 2024</H3>
              <H3>Uniswap Labs</H3>
            </Box>
            <HideWhenSmall>
              <Socials />
            </HideWhenSmall>
          </Box>
          <RowToCol direction="row" height="100%" gap="16px">
            <Box direction="row" gap="16px">
              <Box direction="column" gap="10px">
                <Body1>App</Body1>
                <StyledInternalLink to="/swap">
                  <Trans>Swap</Trans>
                </StyledInternalLink>
                <StyledInternalLink to="/tokens/ethereum">
                  <Trans>Tokens</Trans>
                </StyledInternalLink>
                <StyledInternalLink to="/nfts">
                  <Trans>NFTs</Trans>
                </StyledInternalLink>
                <StyledInternalLink to="/pool">
                  <Trans>Pool</Trans>
                </StyledInternalLink>
              </Box>
              <Box direction="column" gap="10px">
                <Body1>
                  <Trans>Protocol</Trans>
                </Body1>
                <StyledExternalLink href="https://uniswap.org/governance">
                  <Trans>Governance</Trans>
                </StyledExternalLink>
                <StyledExternalLink href="https://uniswap.org/developers">
                  <Trans>Developers</Trans>
                </StyledExternalLink>
              </Box>
            </Box>
            <Box direction="row" gap="16px">
              <Box direction="column" gap="10px">
                <Body1>
                  <Trans>Company</Trans>
                </Body1>
                <StyledExternalLink href="https://boards.greenhouse.io/uniswaplabs">
                  <Trans>Careers</Trans>
                </StyledExternalLink>
                <StyledExternalLink href="https://blog.uniswap.org/">
                  <Trans>Blog</Trans>
                </StyledExternalLink>
                <DownloadLink href="https://github.com/Uniswap/brand-assets/raw/main/Uniswap%20Brand%20Assets.zip">
                  <Trans>Brand Assets</Trans>
                </DownloadLink>
                <ModalItem onClick={togglePrivacyPolicy}>
                  <Trans>Terms & Privacy</Trans>
                </ModalItem>
                <StyledExternalLink href="https://uniswap.org/trademark">
                  <Trans>Trademark Policy</Trans>
                </StyledExternalLink>
              </Box>
              <Box direction="column" gap="10px">
                <Body1>
                  <Trans>Need help?</Trans>
                </Body1>
                <StyledExternalLink href="https://support.uniswap.org/hc/en-us/requests/new">
                  <Trans>Contact us</Trans>
                </StyledExternalLink>
                <StyledExternalLink href="https://support.uniswap.org/hc/en-us">
                  <Trans>Help Center</Trans>
                </StyledExternalLink>
              </Box>
            </Box>
          </RowToCol>
          <HideWhenLarge>
            <Socials />
          </HideWhenLarge>
        </RowToCol>
      </Box>
    </Box>
  )
}
