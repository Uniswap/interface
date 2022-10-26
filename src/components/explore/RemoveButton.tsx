import React from 'react'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedTouchableArea, BaseButtonProps } from 'src/components/buttons/TouchableArea'
import { Box } from 'src/components/layout/Box'

export default function RemoveButton(props: BaseButtonProps) {
  const theme = useAppTheme()
  return (
    <AnimatedTouchableArea
      {...props}
      alignItems="center"
      backgroundColor="background0"
      borderColor="backgroundOutline"
      borderRadius="full"
      borderWidth={1}
      entering={FadeIn}
      exiting={FadeOut}
      height={theme.imageSizes.lg}
      justifyContent="center"
      width={theme.imageSizes.lg}
      zIndex="tooltip">
      <Box backgroundColor="textSecondary" borderRadius="md" height={2} width={12} />
    </AnimatedTouchableArea>
  )
}
