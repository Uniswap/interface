import type { TextProps } from 'ui/src'
import { Flex, Text } from 'ui/src'

interface HeaderActionRowContentProps {
  title: string
  textColor?: TextProps['color']
  icon: React.ReactNode
  subtitle?: string
  trailingIcon?: React.ReactNode
}

/**
 * Shared row content for header actions: leading icon, title (and optional subtitle), trailing icon.
 * Used inside TouchableArea/DropdownAction in both Mobile and Desktop header actions.
 */
export function HeaderActionRowContent({
  title,
  textColor,
  icon,
  subtitle,
  trailingIcon,
}: HeaderActionRowContentProps): JSX.Element {
  return (
    <Flex row alignItems="center" gap="$gap12" width="100%">
      {icon}
      <Flex flex={1} flexDirection="row" alignItems="center" gap="$gap4" minWidth={0} $md={{ flex: 0 }}>
        <Text variant="body2" color={textColor ?? '$neutral1'} numberOfLines={1} lineHeight="$large">
          {title}
        </Text>
        {subtitle ? (
          <Text variant="body2" color="$neutral2" numberOfLines={1} lineHeight="$large">
            {subtitle}
          </Text>
        ) : null}
      </Flex>
      {trailingIcon ?? null}
    </Flex>
  )
}
