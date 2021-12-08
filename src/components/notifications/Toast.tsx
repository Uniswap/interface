import { useTheme } from '@shopify/restyle'
import React from 'react'
import { ActivityIndicator } from 'react-native'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import Checkmark from 'src/assets/icons/checkmark.svg'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { opacify } from 'src/utils/colors'

type ToastProps = {
  label: string
  variant: 'pending' | 'successful' | 'failed'
}
export function Toast({ label, variant }: ToastProps) {
  const color = useVariantColor(variant)

  return (
    <Box
      justifyContent="space-between"
      alignContent="center"
      flexDirection="row"
      m="sm"
      px="md"
      py="sm"
      style={{ borderColor: opacify(60, color) }}
      borderWidth={1}
      borderRadius="md"
      backgroundColor="white"
      shadowOpacity={0.05}
      shadowRadius={4}
      shadowOffset={{ width: 0, height: 6 }}
      alignSelf="stretch">
      <Text variant="body" style={{ color }}>
        {label}
      </Text>
      <ToastIcon variant={variant} />
    </Box>
  )
}

function ToastIcon({ variant }: { variant: ToastProps['variant'] }) {
  const color = useVariantColor(variant)

  switch (variant) {
    case 'pending':
      return <ActivityIndicator size="small" color={color} />
    case 'successful':
      return <Checkmark height={23} width={23} stroke={color} />
    case 'failed':
      return <AlertTriangle height={23} width={23} stroke={color} />
  }
}

function useVariantColor(variant: ToastProps['variant']) {
  const theme = useTheme<Theme>()

  switch (variant) {
    case 'pending':
      return theme.colors.yellow
    case 'successful':
      return theme.colors.success
    case 'failed':
      return theme.colors.error
  }
}
