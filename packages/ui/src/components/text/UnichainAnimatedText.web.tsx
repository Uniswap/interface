import { Text } from 'ui/src/components/text'
import { UnichainAnimatedTextProps } from 'ui/src/components/text/UnichainAnimatedText'

const unichainGradientAnimatedStyle = ({ textColor, delayMs }: { textColor: string; delayMs?: number }): string => `
  .unichain-gradient {
    background: linear-gradient(to right, ${textColor}, ${textColor}, #FA0ABF, #FC63DF, ${textColor}, ${textColor});
    background-clip: text;
    background-position: 100% center;
    background-size: 500% 100%;
    animation: swipe 600ms forwards;
    animation-delay: ${delayMs ?? 375}ms;
  }

  @keyframes swipe {
    0% {
      background-position: 100% center;
    }
    100% {
      background-position: 0% center
    }
  }
`

export function UnichainAnimatedText({
  children,
  gradientTextColor,
  delayMs,
  enabled = true,
  ...props
}: UnichainAnimatedTextProps): JSX.Element {
  return (
    <>
      {enabled ? <style>{unichainGradientAnimatedStyle({ textColor: gradientTextColor, delayMs })}</style> : null}
      <Text
        {...props}
        color={enabled ? 'transparent' : props.color}
        className={enabled ? 'unichain-gradient' : undefined}
      >
        {children}
      </Text>
    </>
  )
}
