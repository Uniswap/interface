import type { TextCompatProps as TextProps } from '@universe/mycelium'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { markHoverable, styled } from '@universe/mycelium/styled'
import type { ReactNode } from 'react'

export const DROPDOWN_MIN_WIDTH = 200

// The empty variants table pins the factory's variant generic: a hover-only
// config has no other inference site, so V falls back to its open constraint
// and the index signature collapses the base component's prop surface.
const DropdownAction = styled(markHoverable(TouchableArea), {
  variants: {},
  base: 'flex flex-row items-center p-2 rounded-8 gap-3 h-10',
  hover: [{ class: 'bg-surface2-hovered' }],
})

/** 40px dropdown row shared by the desktop "More" menu and the mobile overflow dropdown. */
export function HeaderActionDropdownRow({
  isLink,
  onPress,
  children,
}: {
  isLink: boolean
  onPress: () => void
  children: ReactNode
}): JSX.Element {
  return (
    <DropdownAction {...(isLink && { tag: 'a' })} onPress={onPress}>
      {children}
    </DropdownAction>
  )
}

interface HeaderActionRowContentProps {
  title: string
  textColor?: TextProps['color']
  icon: ReactNode
  subtitle?: string
  trailingIcon?: ReactNode
}

/**
 * Shared row content for header actions: leading icon, title (and optional subtitle), trailing icon.
 * Used inside TouchableArea/HeaderActionDropdownRow in both Mobile and Desktop header actions.
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
