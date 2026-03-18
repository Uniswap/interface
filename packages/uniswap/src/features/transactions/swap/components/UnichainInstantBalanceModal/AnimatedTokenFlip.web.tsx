import { useEffect, useState } from 'react'
import { Flex } from 'ui/src'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

// Inject CSS keyframes for flip animation once
const FLIP_KEYFRAMES_ID = 'uniswap-token-flip-keyframes'

function injectFlipKeyframes(): void {
  if (typeof document === 'undefined') {
    return
  }
  if (document.getElementById(FLIP_KEYFRAMES_ID)) {
    return
  }
  const style = document.createElement('style')
  style.id = FLIP_KEYFRAMES_ID
  style.textContent = `
    .token-flip-front {
      backface-visibility: hidden;
      transition: transform 600ms cubic-bezier(0.68, -0.3, 0.265, 1.3), opacity 600ms ease;
    }
    .token-flip-back {
      backface-visibility: hidden;
      transition: transform 600ms cubic-bezier(0.68, -0.3, 0.265, 1.3), opacity 600ms ease;
    }
    .token-flip-front.processing {
      transform: rotateY(0deg) scale(0.75);
      opacity: 1;
    }
    .token-flip-front.complete {
      transform: rotateY(540deg) scale(1);
      opacity: 0;
    }
    .token-flip-back.processing {
      transform: rotateY(180deg) scale(0.75);
      opacity: 0;
    }
    .token-flip-back.complete {
      transform: rotateY(720deg) scale(1);
      opacity: 1;
    }
  `
  document.head.appendChild(style)
}

interface AnimatedTokenFlipProps {
  size: number
  inputCurrencyInfo: CurrencyInfo
  outputCurrencyInfo: CurrencyInfo
}

export function AnimatedTokenFlip({
  size,
  inputCurrencyInfo,
  outputCurrencyInfo,
}: AnimatedTokenFlipProps): JSX.Element {
  const [processingState, setProcessingState] = useState<'processing' | 'complete'>('complete')

  // Inject keyframes on first render
  useEffect(() => {
    injectFlipKeyframes()
  }, [])

  const handleTokenClick = (): void => {
    setProcessingState((prev) => (prev === 'complete' ? 'processing' : 'complete'))
  }

  return (
    <Flex width={size} height={size} alignItems="center" justifyContent="center" mb="$spacing24">
      <Flex
        animation="300ms"
        width={size}
        height={size}
        scale={1}
        opacity={1}
        enterStyle={{
          x: 140,
          y: -80,
          scale: 0.5,
          opacity: 0,
        }}
      >
        <Flex position="relative" width={size} height={size} onPress={handleTokenClick}>
          {/* Front side - Input token */}
          {/* biome-ignore lint/correctness/noRestrictedElements: CSS class animations require div */}
          <div
            className={`token-flip-front ${processingState}`}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TokenLogo
              chainId={inputCurrencyInfo.currency.chainId}
              name={inputCurrencyInfo.currency.name}
              symbol={inputCurrencyInfo.currency.symbol}
              url={inputCurrencyInfo.logoUrl}
              webFontSize={size / 4}
              lineHeight="unset"
              size={size}
            />
          </div>

          {/* Back side - Output token */}
          {/* biome-ignore lint/correctness/noRestrictedElements: CSS class animations require div */}
          <div
            className={`token-flip-back ${processingState}`}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TokenLogo
              chainId={outputCurrencyInfo.currency.chainId}
              name={outputCurrencyInfo.currency.name}
              symbol={outputCurrencyInfo.currency.symbol}
              url={outputCurrencyInfo.logoUrl}
              webFontSize={size / 4}
              lineHeight="unset"
              size={size}
            />
          </div>
        </Flex>
      </Flex>
    </Flex>
  )
}
