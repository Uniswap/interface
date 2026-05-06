import { Flex } from 'ui/src'

interface PulsingIndicatorDotProps {
  color: string
  isPulsing?: boolean
  size?: number
}

export function PulsingIndicatorDot({ color, isPulsing = true, size = 8 }: PulsingIndicatorDotProps) {
  return (
    <Flex position="relative" width={size} height={size}>
      {isPulsing && (
        <>
          {/* Outer pulsing rings */}
          <Flex
            position="absolute"
            width={size}
            height={size}
            borderRadius="$roundedFull"
            backgroundColor={color}
            style={{
              opacity: 0.3,
              animation: 'pulsingIndicatorDot 2s ease-in-out infinite',
            }}
          />
          <Flex
            position="absolute"
            width={size}
            height={size}
            borderRadius="$roundedFull"
            backgroundColor={color}
            style={{
              opacity: 0.3,
              animation: 'pulsingIndicatorDot 2s ease-in-out infinite 0.5s',
            }}
          />
        </>
      )}
      {/* Inner dot */}
      <Flex
        position="absolute"
        width={size}
        height={size}
        borderRadius="$roundedFull"
        backgroundColor={color}
        style={isPulsing ? { boxShadow: `0 0 ${size}px ${color}` } : undefined}
      />
      {isPulsing && (
        <style>
          {`
            @keyframes pulsingIndicatorDot {
              0% {
                transform: scale(1);
                opacity: 0.5;
              }
              75% {
                transform: scale(2.5);
                opacity: 0;
              }
              100% {
                transform: scale(2.5);
                opacity: 0;
              }
            }
          `}
        </style>
      )}
    </Flex>
  )
}
