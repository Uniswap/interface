import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { AnimatedButton, ButtonProps } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'

export default function RemovePinButton(props: ButtonProps) {
  const theme = useAppTheme()
  return (
    <AnimatedButton
      {...props}
      alignItems="center"
      backgroundColor="backgroundBackdrop"
      borderColor="backgroundOutline"
      borderRadius="full"
      borderWidth={1}
      height={theme.imageSizes.lg}
      justifyContent="center"
      width={theme.imageSizes.lg}
      zIndex="tooltip">
      <Box backgroundColor="textSecondary" borderRadius="md" height={2} width={12} />
    </AnimatedButton>
  )
}
