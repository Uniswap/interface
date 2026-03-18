import { useEffect, useMemo } from 'react'
import { Flex } from 'ui/src'
import { GradientContainerProps } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/GradientContainer'
import { useBackgroundColor } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useBackgroundColor'

// Inject CSS keyframes for blob animations once
const BLOB_KEYFRAMES_ID = 'uniswap-gradient-blob-keyframes'

function injectBlobKeyframes(): void {
  if (typeof document === 'undefined') {
    return
  }
  if (document.getElementById(BLOB_KEYFRAMES_ID)) {
    return
  }
  const style = document.createElement('style')
  style.id = BLOB_KEYFRAMES_ID
  style.textContent = `
    @keyframes gradient-blob-1 {
      0%, 100% {
        transform: translateX(0) translateY(0) scale(1) rotate(0deg);
      }
      25% {
        transform: translateX(40px) translateY(-30px) scale(1.1) rotate(12deg);
      }
      50% {
        transform: translateX(20px) translateY(-20px) scale(0.95) rotate(-6deg);
      }
      75% {
        transform: translateX(-20px) translateY(10px) scale(1.05) rotate(8deg);
      }
    }
    @keyframes gradient-blob-2 {
      0%, 100% {
        transform: translateX(0) translateY(0) scale(1) rotate(0deg);
      }
      33% {
        transform: translateX(-35px) translateY(20px) scale(1.12) rotate(-16deg);
      }
      66% {
        transform: translateX(45px) translateY(-40px) scale(0.9) rotate(20deg);
      }
    }
    @keyframes gradient-blob-3 {
      0%, 100% {
        transform: translateX(0) translateY(0) scale(1) rotate(0deg);
      }
      20% {
        transform: translateX(30px) translateY(45px) scale(1.25) rotate(24deg);
      }
      40% {
        transform: translateX(-40px) translateY(-15px) scale(0.8) rotate(-18deg);
      }
      60% {
        transform: translateX(-10px) translateY(30px) scale(1.15) rotate(12deg);
      }
      80% {
        transform: translateX(20px) translateY(-35px) scale(0.95) rotate(-8deg);
      }
    }
  `
  document.head.appendChild(style)
}

export function GradientContainer({ toTokenColor, children }: GradientContainerProps): JSX.Element {
  const backgroundColor = useBackgroundColor()

  // Inject keyframes on first render
  useEffect(() => {
    injectBlobKeyframes()
  }, [])

  const baseBlobStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      backgroundColor: toTokenColor,
      filter: 'blur(65px)',
      boxShadow: `0 0 40px ${toTokenColor}`,
    }),
    [toTokenColor],
  )

  return (
    <Flex background={backgroundColor} borderRadius="$rounded16" overflow="hidden" position="relative">
      <Flex position="absolute" inset={0} overflow="hidden">
        {/* biome-ignore lint/correctness/noRestrictedElements: CSS keyframe animations require div */}
        <div
          style={{
            ...baseBlobStyle,
            width: 96,
            height: 96,
            borderRadius: 48,
            left: '15%',
            top: '10%',
            animation: 'gradient-blob-1 20s ease-in-out infinite alternate',
          }}
        />

        {/* biome-ignore lint/correctness/noRestrictedElements: CSS keyframe animations require div */}
        <div
          style={{
            ...baseBlobStyle,
            width: 80,
            height: 80,
            borderRadius: 40,
            right: '20%',
            top: '25%',
            animation: 'gradient-blob-2 16s ease-in-out infinite alternate',
          }}
        />

        {/* biome-ignore lint/correctness/noRestrictedElements: CSS keyframe animations require div */}
        <div
          style={{
            ...baseBlobStyle,
            width: 72,
            height: 72,
            borderRadius: 36,
            left: '35%',
            bottom: '15%',
            animation: 'gradient-blob-3 7s ease-in-out infinite alternate',
          }}
        />
      </Flex>
      {children}
    </Flex>
  )
}
