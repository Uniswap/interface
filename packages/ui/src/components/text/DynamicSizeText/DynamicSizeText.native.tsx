import { Flex } from 'ui/src/components/layout'
import { Text } from 'ui/src/components/text'
import type { DynamicSizeTextProps } from 'ui/src/components/text/DynamicSizeText/DynamicSizeText'

export function DynamicSizeText({ children, floatingSuffix, gap, ...props }: DynamicSizeTextProps): JSX.Element {
  return (
    <Flex row gap={gap} overflow="hidden" flexGrow={0} width="100%">
      <Text {...props} adjustsFontSizeToFit>
        {children}
      </Text>
      {floatingSuffix}
    </Flex>
  )
}
