import type { ComponentProps } from 'react'
import { Flex, useSporeColors } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { PortfolioLogo, PORTFOLIO_LOGO_DEFAULT_SIZE } from '~/components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { StyledRotatingSVG } from '~/components/Icons/shared'

const pendingPortfolioLogoConfig = {
  frameSize: PORTFOLIO_LOGO_DEFAULT_SIZE,
  logoScale: 0.8,
  ringStrokeWidth: 3,
  ringRotationMs: 900,
  ringArcRatio: 0.36,
} as const

const { frameSize, logoScale, ringStrokeWidth, ringRotationMs, ringArcRatio } = pendingPortfolioLogoConfig
const logoSize = frameSize * logoScale
const ringRadius = (frameSize - ringStrokeWidth) / 2
const ringCircumference = 2 * Math.PI * ringRadius
const ringArcLength = ringCircumference * ringArcRatio

type PendingPortfolioLogoProps = Omit<ComponentProps<typeof PortfolioLogo>, 'size'>

function PendingRing(): JSX.Element {
  const colors = useSporeColors()
  const center = frameSize / 2

  return (
    <StyledRotatingSVG
      data-testid={TestID.ActivityPopupPendingRing}
      size={`${frameSize}px`}
      viewBox={`0 0 ${frameSize} ${frameSize}`}
      fill="none"
      style={{ animationDuration: `${ringRotationMs}ms`, pointerEvents: 'none' }}
    >
      <circle
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        opacity="0.14"
        stroke={colors.accent1.val}
        strokeWidth={ringStrokeWidth}
      />
      <circle
        cx={center}
        cy={center}
        r={ringRadius}
        fill="none"
        stroke={colors.accent1.val}
        strokeDasharray={`${ringArcLength} ${ringCircumference}`}
        strokeLinecap="round"
        strokeWidth={ringStrokeWidth}
        transform={`rotate(-90 ${center} ${center})`}
      />
    </StyledRotatingSVG>
  )
}

export function PendingPortfolioLogo(props: PendingPortfolioLogoProps): JSX.Element {
  return (
    <Flex
      alignItems="center"
      data-testid={TestID.ActivityPopupPendingLogo}
      height={frameSize}
      justifyContent="center"
      position="relative"
      width={frameSize}
    >
      <Flex
        alignItems="center"
        height={frameSize}
        justifyContent="center"
        position="absolute"
        width={frameSize}
        zIndex={zIndexes.background}
      >
        <PendingRing />
      </Flex>
      <Flex zIndex={zIndexes.default}>
        <PortfolioLogo {...props} size={logoSize} />
      </Flex>
    </Flex>
  )
}
