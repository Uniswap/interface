import { PropsWithChildren, useEffect } from 'react'
import { Flex } from 'ui/src'

// Inject CSS keyframes for spinning animation once
const SPINNER_KEYFRAMES_ID = 'uniswap-spinner-keyframes'

function injectSpinnerKeyframes(): void {
  if (typeof document === 'undefined') {
    return
  }
  if (document.getElementById(SPINNER_KEYFRAMES_ID)) {
    return
  }
  const style = document.createElement('style')
  style.id = SPINNER_KEYFRAMES_ID
  style.textContent = `
    @keyframes uniswap-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}

export function SpinningBorderIcon({
  children,
  layoutSize,
}: PropsWithChildren<{ children: React.ReactNode; layoutSize: number }>): JSX.Element {
  // Inject keyframes on first render
  useEffect(() => {
    injectSpinnerKeyframes()
  }, [])

  const outerRadius = layoutSize * 0.8
  const spinnerWidth = outerRadius / 10
  const borderRadius = outerRadius / 2

  return (
    <Flex height={layoutSize} width={layoutSize} alignItems="center" justifyContent="center">
      {/* biome-ignore lint/correctness/noRestrictedElements: CSS animation requires raw element for className */}
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
