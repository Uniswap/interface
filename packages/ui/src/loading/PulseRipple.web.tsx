import { Flex } from 'ui/src/components/layout'

const pulseKeyframe = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(1.5);
      opacity: 0;
    }
  }
`
export function PulseRipple({ rippleColor, size = 24 }: { rippleColor?: string; size?: number }): JSX.Element | null {
  if (!rippleColor) {
    return null
  }
  return (
    <>
      <style>{pulseKeyframe}</style>
      <Flex data-testid="icon-ripple-animation">
        <Flex
          borderRadius={size / 2}
          borderWidth="$spacing1"
          height={size}
          position="absolute"
          style={{
            borderColor: rippleColor,
            animation: 'pulse 1s linear infinite',
          }}
          width={size}
        />
      </Flex>
    </>
  )
}
