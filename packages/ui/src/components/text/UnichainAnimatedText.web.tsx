import { Text } from 'ui/src/components/text'
import { UnichainAnimatedTextProps } from 'ui/src/components/text/UnichainAnimatedText'
import { useColorHexFromThemeKey } from 'ui/src/hooks/useColorHexFromThemeKey'

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
  gradientTextColor = 'neutral1',
  delayMs,
  enabled = true,
  ...props
}: UnichainAnimatedTextProps): JSX.Element {
  const textColor = useColorHexFromThemeKey(gradientTextColor).val
  return (
    <>
      {enabled ? <style>{unichainGradientAnimatedStyle({ textColor, delayMs })}</style> : null}
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
