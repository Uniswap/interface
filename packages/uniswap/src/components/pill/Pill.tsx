import { Flex, type FlexCompatProps, Text, type TextVariantKey } from '@universe/mycelium'
import { ReactNode } from 'react'

export type PillProps = {
  customBackgroundColor?: string
  customBorderColor?: string
  foregroundColor?: string
  icon?: ReactNode
  label?: ReactNode
  textVariant?: TextVariantKey
} & FlexCompatProps

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
      borderColor={!customBorderColor ? '$transparent' : undefined}
      borderRadius={borderRadius}
      borderWidth="$spacing1"
      flexDirection={flexDirection}
      gap="$spacing8"
      justifyContent="center"
      px={px}
      py={py}
      style={{
        ...(customBackgroundColor ? { backgroundColor: customBackgroundColor } : {}),
        ...(customBorderColor ? { borderColor: customBorderColor } : {}),
      }}
      {...rest}
    >
      {icon ?? null}
      {label ? (
        // A pill is a single-line chip, so the label must never reflow. Callers needing a size
        // floor use minWidth, not width: a fixed width turns this into an ellipsis that silently
        // drops characters once the label outgrows it (e.g. at a >1x OS font scale).
        <Text numberOfLines={1} style={{ color: foregroundColor, paddingTop: 1 }} variant={textVariant}>
          {label}
        </Text>
      ) : null}
      {children}
    </Flex>
  )
}
