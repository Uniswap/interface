import Row from 'components/Row'
import { useRef } from 'react'
import styled from 'styled-components/macro'
import { v4 as uuid } from 'uuid'

import { BoxProps } from '../../nft/components/Box'

// Gradient with a fallback to solid color.
const Gradient = styled.div`
  color: #4673fa;

  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(91.39deg, #4673fa -101.76%, #9646fa 101.76%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

export { Gradient as UniswapXGradient }

// Uniswap X SVG icon with gradient, copied from Figma.
// In order for gradient to work, we must give its definition a unique ID that does not collide
// with other occurences of this component on the page.
export const UniswapXRouterIcon = () => {
  const componentIdRef = useRef(uuid())
  const componentId = `AutoRouterIconGradient${componentIdRef.current}`

  return (
    <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient
          id={componentId}
          x1="-10.1807"
          y1="-12.0006"
          x2="10.6573"
          y2="-11.6017"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4673FA" />
          <stop offset="1" stopColor="#9646FA" />
        </linearGradient>
      </defs>
      <path
        d="M9.97131 6.19803C9.91798 6.07737 9.79866 6.00003 9.66666 6.00003H6.66666V1.00003C6.66666 0.862034 6.58201 0.738037 6.45267 0.688704C6.32267 0.638704 6.17799 0.674696 6.08532 0.776696L0.0853237 7.44336C-0.00267631 7.54136 -0.0253169 7.68137 0.0286831 7.80204C0.0820164 7.9227 0.20133 8.00003 0.33333 8.00003H3.33333V13C3.33333 13.138 3.41799 13.262 3.54732 13.3114C3.58665 13.326 3.62666 13.3334 3.66666 13.3334C3.75933 13.3334 3.85 13.2947 3.91467 13.2227L9.91467 6.55603C10.0027 6.4587 10.0246 6.31803 9.97131 6.19803Z"
        fill={`url(#${componentId})`}
      />
    </svg>
  )
}

export type UnswapXRouterLabelProps = BoxProps & {
  disableTextGradient?: boolean
}

export default function UniswapXRouterLabel({ children, disableTextGradient, ...rest }: UnswapXRouterLabelProps) {
  return (
    <Row gap="xs" width="auto" {...rest} style={{ display: 'inline-flex', ...rest.style }}>
      <UniswapXRouterIcon />
      {disableTextGradient ? children : <Gradient>{children}</Gradient>}
    </Row>
  )
}
