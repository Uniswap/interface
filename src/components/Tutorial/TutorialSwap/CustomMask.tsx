import styled, { DefaultTheme, keyframes } from 'styled-components'
import { MaskOptions } from 'walktour'

import { ReactComponent as TouchIcon } from 'assets/svg/touch_icon.svg'

import { StepCustom } from './constant'

const pointerToSetting = keyframes`
  from {
    transform: translateY(25px)
  }
  to {
    transform: translateY(0px);
  }
`

const TouchIconWrapper = styled(TouchIcon)`
  position: absolute;
  animation-fill-mode: forwards;
  animation: ${pointerToSetting} 3s;
  bottom: -10px;
  left: 0;
  right: 0;
  margin: auto;
  path {
    stroke: ${({ theme }) => theme.text};
    fill: ${({ theme }) => theme.text};
  }
`

const highlightSpotLight = (theme: DefaultTheme, blurWidth: number, hasSpotlight: boolean) => keyframes` 
  0% {
    box-shadow: ${[
      '0px 0px 4px 2px rgba(0,0,0,0.45) inset',
      hasSpotlight && `0 0 4px 1px ${theme.primary}`,
      `0px 0px 0px ${blurWidth}px rgba(0,0,0,0.45)`,
    ]
      .filter(Boolean)
      .join(', ')}
  }
  100% {
    box-shadow: ${[
      '0px 0px 4px 2px rgba(0,0,0,0.45) inset',
      hasSpotlight && `0 0 8px 2px ${theme.primary}`,
      `0px 0px 0px ${blurWidth}px rgba(0,0,0,0.45)`,
    ]
      .filter(Boolean)
      .join(', ')}
  }
`
const SpotLight = styled.div<{ blurWidth: number; hasSpotlight: boolean }>`
  position: absolute;
  animation: ${({ theme, blurWidth, hasSpotlight }) => highlightSpotLight(theme, blurWidth, hasSpotlight)} 2s infinite
    alternate;
  border-radius: 30px;
  transition: 0.3s;
`
type Props = { options: MaskOptions; stepInfo: StepCustom }

function CustomMask({ options, stepInfo }: Props) {
  const { hasPointer, spotlightInteraction, selector, stopPropagationMouseDown } = stepInfo || ({} as StepCustom)
  const { targetInfo, padding = 0, tourRoot, disableMaskInteraction } = options
  const containerHeight = document.body.scrollHeight
  const containerWidth = tourRoot.scrollWidth
  const { coords, dims } = targetInfo || { coords: { x: 0, y: 0 }, dims: { width: 0, height: 0 } }
  const width = dims.width + 2 * padding
  const height = dims.height + 2 * padding

  const onClickSpotlight = () => {
    if (!spotlightInteraction) return
    const element: HTMLDivElement | null = document.querySelector(selector)
    element?.click()
  }

  return (
    <div
      id="customMaskWalkTour"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        pointerEvents: disableMaskInteraction ? 'auto' : 'none',
      }}
      onMouseDown={e => stopPropagationMouseDown && e.stopPropagation()}
    >
      <SpotLight
        onClick={onClickSpotlight}
        hasSpotlight={!!targetInfo}
        blurWidth={Math.max(containerWidth, containerHeight)}
        style={{
          left: (coords.x || window.innerWidth / 2) - padding,
          top: (coords.y || window.innerHeight / 2) - padding,
          width,
          height,
          padding,
          cursor: spotlightInteraction ? 'pointer' : 'unset',
        }}
      >
        {hasPointer && <TouchIconWrapper />}
      </SpotLight>
    </div>
  )
}

export default CustomMask
