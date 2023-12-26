import { ReactNode } from 'react'
import { Flex, FlexProps, Text } from 'ui/src'
import { TextVariantTokens } from 'ui/src/theme'

type PillProps = {
  customBackgroundColor?: string
  customBorderColor?: string
  foregroundColor?: string
  icon?: ReactNode
  label?: ReactNode
  textVariant?: TextVariantTokens
} & FlexProps

export function Pill({
  borderRadius = '$roundedFull',
  children,
  customBackgroundColor,
  customBorderColor,
  flexDirection = 'row',
  foregroundColor,
  icon,
  label,
  px = '$spacing4',
  py = '$spacing8',
  textVariant = 'body2',
  ...rest
}: PillProps): JSX.Element {
  return (
    <Flex
      alignItems="center"
      borderColor="$transparent"
      borderRadius={borderRadius}
      borderWidth={1}
      flexDirection={flexDirection}
      gap="$spacing8"
      justifyContent="center"
      px={px}
      py={py}
      style={{
        ...(customBackgroundColor ? { backgroundColor: customBackgroundColor } : {}),
        ...(customBorderColor ? { borderColor: customBorderColor } : {}),
      }}
      {...rest}>
      {icon ?? null}
      {label ? (
        // eslint-disable-next-line react-native/no-inline-styles
        <Text style={{ color: foregroundColor, paddingTop: 1 }} variant={textVariant}>
          {label}
        </Text>
      ) : null}
      {children}
    </Flex>
  )
}
