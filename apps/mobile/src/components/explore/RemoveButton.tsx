import React from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedTouchableArea, BaseButtonProps } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout/Box'

export default function RemoveButton(props: BaseButtonProps): JSX.Element {
  const theme = useAppTheme()
  return (
    <AnimatedTouchableArea
      {...props}
      hapticFeedback
      alignItems="center"
      backgroundColor="neutral3"
      borderRadius="roundedFull"
      entering={FadeIn}
      exiting={FadeOut}
      height={theme.imageSizes.image24}
      justifyContent="center"
      width={theme.imageSizes.image24}
      zIndex="tooltip">
      <Box backgroundColor="surface1" borderRadius="rounded12" height={2} width={10} />
    </AnimatedTouchableArea>
  )
}
