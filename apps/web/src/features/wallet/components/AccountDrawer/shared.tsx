import { Flex as MyceliumFlex, Flex, Text } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { styled, type StyledComponent } from '@universe/mycelium/styled'
import { ReactNode } from 'react'
import type { To } from 'react-router'
import { Link } from 'react-router'
// Web-only base, so `platform: 'web'` legalizes the hover:/active: classes.
// `py-[12px]` is load-bearing: the menu containers set no gap, so it is the only thing
// separating consecutive rows.
const InternalLinkMenuItem = styled(Link, {
  platform: 'web',
  base: 'flex flex-row items-center justify-between grow shrink basis-auto py-[12px] cursor-pointer [text-decoration-line:none] [text-decoration:none] opacity-[1] hover:opacity-[0.8] active:opacity-[0.6]',
  // ClickableTamaguiStyle's constant `style` default.
  inlineStyle: () => ({ transition: '100ms' }),
})

const MENU_COLUMN_VARIANTS = {} as const

// Empty variants table + explicit annotation: the inferred styled() type isn't
// portable under declaration emit (TS2883).
export const MenuColumn: StyledComponent<typeof MyceliumFlex, typeof MENU_COLUMN_VARIANTS> = styled(MyceliumFlex, {
  platform: 'web',
  variants: MENU_COLUMN_VARIANTS,
  base: 'media-md:pb-[14px]',
})

export function MenuItem({
  label,
  logo,
  to,
  onClick,
  isActive,
  testId,
}: {
  label: ReactNode
  logo?: ReactNode
  to?: To
  onClick?: () => void
  isActive: boolean
  testId?: string
}) {
  if (!to) {
    return null
  }

  return (
    <InternalLinkMenuItem onClick={onClick} to={to}>
      <Flex row centered gap="$gap12">
        {logo && logo}
        <Text data-testid={testId} variant="body3">
          {label}
        </Text>
      </Flex>
      {isActive && <Check color="$accent1" size="$icon.20" mr="$spacing12" />}
    </InternalLinkMenuItem>
  )
}
