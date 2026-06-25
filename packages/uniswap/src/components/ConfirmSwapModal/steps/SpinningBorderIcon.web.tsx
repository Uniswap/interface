import { PropsWithChildren } from 'react'
import { Flex } from 'ui/src'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'

const SPINNER_KEYFRAMES_ID = 'uniswap-spinner-keyframes'
const SPINNER_KEYFRAMES_CSS = `
    @keyframes uniswap-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `

export function SpinningBorderIcon({
  children,
  layoutSize,
}: PropsWithChildren<{ children: React.ReactNode; layoutSize: number }>): JSX.Element {
  useInjectSingleStylesheet({ id: SPINNER_KEYFRAMES_ID, css: SPINNER_KEYFRAMES_CSS })

  const outerRadius = layoutSize * 0.8
  const spinnerWidth = outerRadius / 10
  const borderRadius = outerRadius / 2

  return (
    <Flex height={layoutSize} width={layoutSize} alignItems="center" justifyContent="center">
      {/* oxlint-disable-next-line react/forbid-elements -- CSS animation requires raw element for className */}
      <div
        style={{
          position: 'absolute',
          height: outerRadius,
          width: outerRadius,
          borderRadius,
          borderWidth: spinnerWidth,
          borderStyle: 'solid',
          borderColor: 'var(--accent1)',
          borderLeftColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: 'transparent',
          animation: 'uniswap-spin 750ms linear infinite',
        }}
      />
      {children}
    </Flex>
  )
}
