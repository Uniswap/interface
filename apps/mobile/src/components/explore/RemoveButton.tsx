import React from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AnimatedTouchableArea, BaseButtonProps } from 'src/components/buttons/TouchableArea'
import { Flex } from 'ui/src'
import { imageSizes } from 'ui/src/theme'

export default function RemoveButton(props: BaseButtonProps): JSX.Element {
  return (
    <AnimatedTouchableArea
      {...props}
      hapticFeedback
      alignItems="center"
      backgroundColor="neutral3"
      borderRadius="roundedFull"
      entering={FadeIn}
      exiting={FadeOut}
      height={imageSizes.image24}
      justifyContent="center"
      width={imageSizes.image24}
      zIndex="tooltip">
      <Flex backgroundColor="$surface1" borderRadius="$rounded12" height={2} width={10} />
    </AnimatedTouchableArea>
  )
}
