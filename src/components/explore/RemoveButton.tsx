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
      backgroundColor="textTertiary"
      borderRadius="full"
      entering={FadeIn}
      exiting={FadeOut}
      height={theme.imageSizes.md}
      justifyContent="center"
      width={theme.imageSizes.md}
      zIndex="tooltip">
      <Box backgroundColor="background0" borderRadius="md" height={2} width={10} />
    </AnimatedTouchableArea>
  )
}
