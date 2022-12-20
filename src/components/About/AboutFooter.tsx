import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, ElementName, EventName } from '@uniswap/analytics-events'
import { BookOpen, Globe, Heart, Twitter } from 'react-feather'
import styled from 'styled-components/macro'
import { BREAKPOINTS } from 'theme'

const Footer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 48px;
  max-width: 1440px;
`

const FooterLinks = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  @media screen and (min-width: ${BREAKPOINTS.sm}px) {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  @media screen and (min-width: ${BREAKPOINTS.lg}px) {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
`

const FooterLink = styled.a`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  font-size: 16px;
  line-height: 20px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  svg {
    color: ${({ theme }) => theme.textSecondary};
    stroke-width: 1.5;
  }
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} border`};
  &:hover {
    border: 1px solid ${({ theme }) => theme.textTertiary};
  }
  @media screen and (min-width: ${BREAKPOINTS.md}px) {
    font-size: 20px;
    line-height: 24px;
  }
`

const Copyright = styled.span`
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.textTertiary};
`

export const AboutFooter = () => {
  return (
    <Footer>
      <FooterLinks>
        <TraceEvent events={[BrowserEvent.onClick]} name={EventName.ELEMENT_CLICKED} element={ElementName.SUPPORT_LINK}>
          <FooterLink rel="noopener noreferrer" target="_blank" href="https://support.uniswap.org">
            <Globe /> Support
          </FooterLink>
        </TraceEvent>
        <TraceEvent events={[BrowserEvent.onClick]} name={EventName.ELEMENT_CLICKED} element={ElementName.TWITTER_LINK}>
          <FooterLink rel="noopener noreferrer" target="_blank" href="https://twitter.com/uniswap">
            <Twitter /> Twitter
          </FooterLink>
        </TraceEvent>
        <TraceEvent events={[BrowserEvent.onClick]} name={EventName.ELEMENT_CLICKED} element={ElementName.BLOG_LINK}>
          <FooterLink rel="noopener noreferrer" target="_blank" href="https://uniswap.org/blog">
            <BookOpen /> Blog
          </FooterLink>
        </TraceEvent>
        <TraceEvent events={[BrowserEvent.onClick]} name={EventName.ELEMENT_CLICKED} element={ElementName.CAREERS_LINK}>
          <FooterLink rel="noopener noreferrer" target="_blank" href="https://boards.greenhouse.io/uniswaplabs">
            <Heart /> Careers
          </FooterLink>
        </TraceEvent>
      </FooterLinks>
      <Copyright>© {new Date().getFullYear()} Uniswap Labs</Copyright>
    </Footer>
  )
}
