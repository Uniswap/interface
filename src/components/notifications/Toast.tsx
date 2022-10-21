import React from 'react'
import { ActivityIndicator } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import AlertTriangle from 'src/assets/icons/alert-triangle.svg'
import Checkmark from 'src/assets/icons/checkmark.svg'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { opacify } from 'src/utils/colors'

export enum ToastVariant {
  Pending = 'pending',
  Success = 'success',
  Failed = 'failed',
}

interface ToastProps {
  label: string
  variant: ToastVariant
}

export function Toast({ label, variant }: ToastProps) {
  const color = useVariantColor(variant)

  return (
    <Box
      alignContent="center"
      alignSelf="stretch"
      backgroundColor="background1"
      borderRadius="md"
      borderWidth={1}
      flexDirection="row"
      justifyContent="space-between"
      px="md"
      py="sm"
      shadowOffset={{ width: 0, height: 6 }}
      shadowOpacity={0.05}
      shadowRadius={4}
      style={{ borderColor: opacify(60, color) }}
      testID={`toast-${variant}`}>
      <Text style={{ color }} variant="bodyLarge">
        {label}
      </Text>
      <ToastIcon variant={variant} />
    </Box>
  )
}

export function ToastIcon({ variant }: { variant: ToastVariant }) {
  const color = useVariantColor(variant)

  switch (variant) {
    case ToastVariant.Pending:
      return <ActivityIndicator color={color} size="small" />
    case ToastVariant.Success:
      return <Checkmark color={color} height={23} width={23} />
    case ToastVariant.Failed:
      return <AlertTriangle color={color} height={23} width={23} />
  }
}

function useVariantColor(variant: ToastProps['variant']) {
  const theme = useAppTheme()

  switch (variant) {
    case ToastVariant.Pending:
      return theme.colors.accentWarning
    case ToastVariant.Success:
      return theme.colors.accentSuccess
    case ToastVariant.Failed:
      return theme.colors.accentCritical
  }
}
