import { Flex } from '@universe/mycelium'
import { PropsWithChildren } from 'react'

interface OptionContainerProps extends PropsWithChildren {
  hideBackground?: boolean
  recent?: boolean
  onPress?: () => void
  testID?: string
}

export function OptionContainer({ hideBackground, recent, children, onPress, testID }: OptionContainerProps) {
  return (
    <Flex
      row
      p="$spacing16"
      gap="$gap12"
      alignItems="center"
      borderRadius="$rounded16"
      borderWidth={recent ? 2 : 0}
      borderColor="$accent2"
      overflow="hidden"
      maxHeight={72}
      cursor="pointer"
      zIndex="$default"
      backgroundColor={!hideBackground ? '$surface2' : '$transparent'}
      hoverStyle={{ backgroundColor: '$surface3' }}
      onPress={onPress}
      testID={testID}
    >
      {children}
    </Flex>
  )
}
