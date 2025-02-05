import { Flex, FlexProps } from 'ui/src/components/layout/Flex'
import { Text, TextProps } from 'ui/src/components/text/Text'
import { UnichainAnimatedText, UnichainAnimatedTextProps } from 'ui/src/components/text/UnichainAnimatedText'
import { usePostTextElementPositionProps } from 'ui/src/utils/layout'
import { isInterfaceDesktop } from 'utilities/src/platform'

type ElementAfterTextProps = {
  element?: JSX.Element
  text: string
  wrapperProps?: FlexProps
  textProps?: TextProps
}

const DEFAULT_TEXT_PROPS: TextProps = {
  color: '$neutral1',
  variant: 'body2',
}

export function ElementAfterText({ element, text, wrapperProps, textProps }: ElementAfterTextProps): JSX.Element {
  const { postTextElementPositionProps, onTextLayout } = usePostTextElementPositionProps()

  if (isInterfaceDesktop) {
    return (
      <Flex row alignItems="center" {...wrapperProps}>
        <Text {...DEFAULT_TEXT_PROPS} {...textProps}>
          {text}
          {element}
        </Text>
      </Flex>
    )
  } else {
    return (
      <Flex row alignItems="center" pr={postTextElementPositionProps ? '$spacing24' : undefined} {...wrapperProps}>
        <Text {...DEFAULT_TEXT_PROPS} onTextLayout={onTextLayout} {...textProps}>
          {text}
        </Text>
        <Flex {...postTextElementPositionProps}>{element}</Flex>
      </Flex>
    )
  }
}

export function ElementAfterGradientText({
  element,
  text,
  wrapperProps,
  textProps,
  gradientTextColor,
  enabled,
  delayMs,
  gradientEndingXPlacement,
}: ElementAfterTextProps & UnichainAnimatedTextProps): JSX.Element {
  const { postTextElementPositionProps, onTextLayout } = usePostTextElementPositionProps()

  if (isInterfaceDesktop) {
    return (
      <Flex row alignItems="center" {...wrapperProps}>
        <UnichainAnimatedText
          gradientTextColor={gradientTextColor}
          enabled={enabled}
          delayMs={delayMs}
          {...DEFAULT_TEXT_PROPS}
          {...textProps}
        >
          {text}
          {element}
        </UnichainAnimatedText>
      </Flex>
    )
  } else {
    return (
      <Flex row alignItems="center" pr={postTextElementPositionProps ? '$spacing24' : undefined} {...wrapperProps}>
        <UnichainAnimatedText
          gradientTextColor={gradientTextColor}
          enabled={enabled}
          delayMs={delayMs}
          gradientEndingXPlacement={gradientEndingXPlacement}
          {...DEFAULT_TEXT_PROPS}
          onTextLayout={onTextLayout}
          {...textProps}
        >
          {text}
        </UnichainAnimatedText>
        <Flex {...postTextElementPositionProps}>{element}</Flex>
      </Flex>
    )
  }
}
