import { PropsWithChildren } from 'react'
import { Flex, Text, TextProps } from 'ui/src'

export function ContentRow({
  label,
  variant = 'body4',
  children,
}: PropsWithChildren<{
  label: string | JSX.Element
  variant?: TextProps['variant']
}>): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$spacing8" justifyContent="space-between">
      {typeof label === 'string' ? (
        <Text color="$neutral2" variant={variant}>
          {label}
        </Text>
      ) : (
        label
      )}
      {children}
    </Flex>
  )
}
