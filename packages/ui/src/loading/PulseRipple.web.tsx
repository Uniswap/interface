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
export function PulseRipple({ rippleColor }: { rippleColor?: string }): JSX.Element | null {
  if (!rippleColor) {
    return null
  }
  return (
    <>
      <style>{pulseKeyframe}</style>
      <Flex data-testid="icon-ripple-animation">
        <Flex
          borderRadius={12}
          borderWidth="$spacing1"
          height={24}
          position="absolute"
          style={{
            borderColor: rippleColor,
            animation: 'pulse 1s linear infinite',
          }}
          width={24}
        />
      </Flex>
    </>
  )
}
