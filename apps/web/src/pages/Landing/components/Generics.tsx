import styled, { css } from 'styled-components'
import { BREAKPOINTS } from 'theme'

const H1Styles = css<{ color?: string }>`
  padding: 0;
  margin: 0;
  color: ${(props) => props.color || props.theme.neutral1};
  text-align: center;
  font-family: Basel;
  font-size: 64px;
  font-style: normal;
  font-weight: 500;
  line-height: 120%; /* 76.8px */
  white-space: pre-line;
  letter-spacing: -0.02em;
  @media (max-width: 768px) {
    font-size: 36px;
  }
`

export const H1 = styled.span`
  ${H1Styles}
`
// Matches H1 in style but does not use h1 tag for SEO improvement

export const H2 = styled.h2`
  padding: 0;
  margin: 0;
  color: ${(props) => props.color || props.theme.neutral1};
  font-family: Basel;
  font-size: 52px;
  font-style: normal;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 60px; /* 115.385% */
  @media (max-width: 1024px) {
    font-size: 36px;
  }
`
export const H3 = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 32px; /* 133.333% */
  color: ${(props) => props.color || props.theme.neutral1};
`
export const Body1 = styled.p`
  padding: 0;
  margin: 0;
  color: ${(props) => props.color || props.theme.neutral1};
  font-feature-settings: 'ss07' on;
  /* Body/1 */
  font-family: Basel;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px; /* 133.333% */
  letter-spacing: -0.01em;
`
export const Subheading = styled.p`
  padding: 0;
  margin: 0;
  color: ${(props) => props.color || props.theme.neutral2};
  text-align: center;
  /* Subheading/1 */
  font-family: Basel;
  font-size: 18px;
  font-style: normal;
  font-weight: 500;
  line-height: 24px; /* 133.333% */
  max-width: 430px;
  letter-spacing: -0.01em;
  @media (max-height: ${BREAKPOINTS.md}px) {
    font-size: 16px;
  }
`

export type BoxProps = {
  position?: 'relative' | 'absolute' | 'fixed'
  top?: string
  left?: string
  right?: string
  bottom?: string
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  flex?: string
  gap?: string
  maxWidth?: string
  width?: string
  height?: string
  padding?: string
  paddingTop?: string
  paddingRight?: string
  paddingBottom?: string
  paddingLeft?: string
  margin?: string
  marginTop?: string
  marginRight?: string
  marginBottom?: string
  marginLeft?: string
  borderRadius?: string
  pointerEvents?: 'none' | 'auto'
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto'
  transform?: string
}

// Please do not add any more usages of Box!
// TODO(WEB-3372): deprecate Box component
export const Box = styled.div<BoxProps>`
  display: flex;

  position: ${(props) => props.position || 'relative'};
  top: ${(props) => props.top || 'auto'};
  left: ${(props) => props.left || 'auto'};
  right: ${(props) => props.right || 'auto'};
  bottom: ${(props) => props.bottom || 'auto'};

  flex-direction: ${(props) => props.direction || 'row'};
  justify-content: ${(props) => props.justify || 'flex-start'};
  align-items: ${(props) => props.align || 'flex-start'};
  flex-wrap: ${(props) => props.wrap || 'nowrap'};
  gap: ${(props) => props.gap || '0'};
  flex: ${(props) => props.flex || '0 1 auto'};

  max-width: ${(props) => props.maxWidth || 'none'};
  width: ${(props) => props.width || '100%'};
  height: ${(props) => props.height || 'auto'};

  padding: ${(props) => props.padding || '0'};
  padding-top: ${(props) => props.paddingTop || props.padding || '0'};
  padding-right: ${(props) => props.paddingRight || props.padding || '0'};
  padding-bottom: ${(props) => props.paddingBottom || props.padding || '0'};
  padding-left: ${(props) => props.paddingLeft || props.padding || '0'};

  margin: ${(props) => props.margin || '0'};
  margin-top: ${(props) => props.marginTop || props.margin || '0'};
  margin-right: ${(props) => props.marginRight || props.margin || '0'};
  margin-bottom: ${(props) => props.marginBottom || props.margin || '0'};
  margin-left: ${(props) => props.marginLeft || props.margin || '0'};

  border-radius: ${(props) => props.borderRadius || '0'};
  pointer-events: ${(props) => props.pointerEvents || 'auto'};
  overflow: ${(props) => props.overflow || 'visible'};
  transform: ${(props) => props.transform || 'none'};
`
