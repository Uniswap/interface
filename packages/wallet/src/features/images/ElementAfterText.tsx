import type { FlexProps, TextProps } from 'ui/src'
import { Flex, Text, isWeb } from 'ui/src'
import { usePostTextElementPositionProps } from 'wallet/src/utils/layout'

type ElementAfterTextProps = {
  image?: JSX.Element
  caption: string
  wrapperProps?: FlexProps
  textProps?: TextProps
}

const DEFAULT_TEXT_PROPS: TextProps = {
  color: '$neutral1',
  variant: 'body2',
}

export function ElementAfterText({ image, caption, wrapperProps, textProps }: ElementAfterTextProps): JSX.Element {
  const { postTextElementPositionProps, onTextLayout } = usePostTextElementPositionProps()

  if (isWeb) {
    return (
      <Flex row {...wrapperProps}>
        <Text {...DEFAULT_TEXT_PROPS} {...textProps}>
          {caption}
          {image}
        </Text>
      </Flex>
    )
  } else {
    return (
      <Flex row pr={postTextElementPositionProps ? '$spacing24' : undefined} {...wrapperProps}>
        <Text {...DEFAULT_TEXT_PROPS} onTextLayout={onTextLayout} {...textProps}>
          {caption}
        </Text>
        <Flex {...postTextElementPositionProps}>{image}</Flex>
      </Flex>
    )
  }
}
