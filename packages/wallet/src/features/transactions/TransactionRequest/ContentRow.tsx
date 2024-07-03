import { PropsWithChildren } from 'react'
import { Flex, Text, TextProps } from 'ui/src'

export function ContentRow({
  label,
  variant = 'body4',
  textColor = '$neutral2',
  children,
}: PropsWithChildren<{
  label: string | JSX.Element
  variant?: TextProps['variant']
  textColor?: TextProps['color']
}>): JSX.Element {
  return (
    <Flex centered row gap="$spacing8" justifyContent="space-between">
      {typeof label === 'string' ? (
        <Text color={textColor} variant={variant}>
          {label}
        </Text>
      ) : (
        label
      )}
      {children}
    </Flex>
  )
}
