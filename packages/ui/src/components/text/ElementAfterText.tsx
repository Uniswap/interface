import { Flex, FlexProps } from 'ui/src/components/layout/Flex'
import { Text, TextProps } from 'ui/src/components/text/Text'
import { usePostTextElementPositionProps } from 'ui/src/utils/layout'
import { isWebAppDesktop } from 'utilities/src/platform'

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

  if (isWebAppDesktop) {
    return (
      <Flex row alignItems="center" {...wrapperProps}>
        <Text {...DEFAULT_TEXT_PROPS} {...textProps}>
          {text}
        </Text>
        {element}
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
