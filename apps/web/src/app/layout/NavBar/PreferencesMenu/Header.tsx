import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { ChevronLeft } from '@universe/mycelium/icons/ChevronLeft'
import { forwardRef, type ForwardRefExoticComponent, ReactNode, type RefAttributes } from 'react'

type HeaderProps = FlexCompatProps & { clickable?: boolean }

const Header: ForwardRefExoticComponent<HeaderProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  HeaderProps
>(function Header({ clickable, ...rest }, ref) {
  return (
    <Flex
      ref={ref}
      row
      justifyContent="flex-start"
      alignItems="center"
      gap="$gap8"
      width="100%"
      py="$padding8"
      // Legacy `clickable` variant was `true`-only, so `false`/undefined is a no-op. Applied
      // after the base and before the caller's props to keep the legacy factory's precedence.
      {...(clickable ? { cursor: 'pointer' as const } : {})}
      {...rest}
    />
  )
})

interface TPreferencesHeaderProps {
  children: ReactNode
  onExitMenu?: () => void
}

export function PreferencesHeader({ children, onExitMenu }: TPreferencesHeaderProps) {
  return (
    <Header clickable={!!onExitMenu} onPress={() => onExitMenu?.()} group>
      {onExitMenu && <ChevronLeft size="$icon.24" color="$neutral1" $group-hover={{ opacity: 0.6 }} />}
      <Text variant="subheading1" color="$neutral1" textAlign="left" width="100%">
        {children}
      </Text>
    </Header>
  )
}
