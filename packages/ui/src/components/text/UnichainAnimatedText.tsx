import { GetProps } from 'tamagui'
import { Text } from 'ui/src/components/text'
import { isInterface } from 'utilities/src/platform'

export const unichainGradientAnimatedStyle = ({
  textColor,
  delayMs,
}: {
  textColor: string
  delayMs?: number
}): string => `
  .unichain-gradient {
    background: linear-gradient(to right, ${textColor}, ${textColor}, #FA0ABF, #FC63DF, ${textColor}, ${textColor});
    background-clip: text;
    background-position: 100% center;
    background-size: 500% 100%;
    animation: swipe 575ms forwards;
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

interface UnichainAnimatedTextProps extends GetProps<typeof Text> {
  gradientTextColor: string
  delayMs?: number
  enabled?: boolean
}

/**
 * @param gradientTextColor Must be a string hex color value (e.g. '#FF0000'). Cannot be a Spore variable name.
 */
export function UnichainAnimatedText({
  children,
  gradientTextColor,
  delayMs,
  enabled = true,
  ...props
}: UnichainAnimatedTextProps): JSX.Element {
  const showAnimation = enabled && isInterface
  return (
    <>
      {/* TODO(WALL-5596): Find why this causes a 'string rendered outside of <Text />' error on mobile */}
      {/* <style>{unichainGradientAnimatedStyle({ textColor: gradientTextColor, delayMs })}</style> */}
      {showAnimation ? <style>{unichainGradientAnimatedStyle({ textColor: gradientTextColor, delayMs })}</style> : null}
      <Text
        {...props}
        color={showAnimation ? 'transparent' : props.color}
        className={showAnimation ? 'unichain-gradient' : undefined}
      >
        {children}
      </Text>
    </>
  )
}
