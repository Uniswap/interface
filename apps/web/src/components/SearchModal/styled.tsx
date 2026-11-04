import { Flex, type FlexCompatProps, Input, type InputProps } from '@universe/mycelium'
import { type ElementRef, forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'

export type MenuItemProps = FlexCompatProps & {
  disabled?: boolean
  selected?: boolean
  dim?: boolean
}

// Explicit return type: see "TS2883 on exported forwardRef wrappers" in packages/mycelium/CLAUDE.md.
export const MenuItem: ForwardRefExoticComponent<MenuItemProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  MenuItemProps
>(function MenuItem({ disabled, selected, dim, '$platform-web': platformWeb, hoverStyle, ...rest }, ref) {
  return (
    <Flex
      ref={ref}
      row
      justifyContent="space-between"
      alignItems="center"
      py="$spacing4"
      px="$spacing20"
      height="$spacing60"
      gap="$gap16"
      cursor="pointer"
      width="100%"
      // Merged explicitly, not spread: a plain spread would replace these bases wholesale.
      $platform-web={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(auto, 1fr) auto minmax(0, 72px)',
        ...platformWeb,
      }}
      hoverStyle={{ backgroundColor: '$surface3', ...hoverStyle }}
      {...rest}
      // disabled/selected/dim are derived state, not caller overrides, so they must win over
      // anything in `rest` (e.g. a stray `opacity` or `cursor`); they spread last.
      {...(disabled ? { cursor: 'default', pointerEvents: 'none', opacity: 0.4 } : {})}
      {...(selected ? { opacity: 0.4 } : {})}
      {...(dim ? { opacity: 0.4 } : {})}
    />
  )
})

// Explicit return type: see "TS2883 on exported forwardRef wrappers" in packages/mycelium/CLAUDE.md.
export const SearchInput: ForwardRefExoticComponent<InputProps & RefAttributes<ElementRef<typeof Input>>> = forwardRef<
  ElementRef<typeof Input>,
  InputProps
>(function SearchInput({ '$platform-web': platformWeb, ...props }, ref) {
  return (
    <Input
      ref={ref}
      py="$padding16"
      pl="$spacing40"
      pr="$padding16"
      height="$spacing40"
      alignItems="center"
      width="100%"
      whiteSpace="nowrap"
      backgroundColor="$surface2"
      borderWidth={1}
      borderStyle="solid"
      borderColor="$surface3"
      borderRadius="$rounded12"
      color="$neutral1"
      fontWeight="500"
      fontSize={16}
      outlineWidth={0}
      // Merged explicitly, not spread: a plain spread would replace this base wholesale.
      $platform-web={{ WebkitAppearance: 'none', ...platformWeb }}
      placeholderTextColor="$neutral3"
      // No focusStyle: it only re-stated the resting values above, and passing it would let focus
      // beat a consumer's inline `style`, inverting the precedence ./styled.test.tsx pins.
      {...props}
    />
  )
})
