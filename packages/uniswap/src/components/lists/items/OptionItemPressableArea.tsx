import { type ModifierPressProps, TouchableArea } from '@universe/mycelium'
import { ReactNode } from 'react'

export interface OptionItemPressableAreaProps extends ModifierPressProps {
  onPress: () => void
  onLongPress?: () => void
  disabled?: boolean
  children: ReactNode
}

/**
 * A press puts `:active` on the pressed element AND every DOM ancestor, so pressing a control inside a row
 * (the search modal's "…" context-menu trigger) plays the row's press animation even though it never
 * navigates. Such controls spread `rowPressExemptProps`, and EVERY pressable wrapping the row carries
 * `rowPressExemptClassName` — a search-modal token row has two (this component and web's shared HoverCard
 * trigger), and an unmarked one keeps animating the row on its own. `:has()` outranks the `active:` press
 * classes on specificity, so no `!important`; both strings stay literals because Tailwind scans raw source.
 */
export const rowPressExemptProps = { 'data-row-press-exempt': '' } as const
export const rowPressExemptClassName =
  'has-[[data-row-press-exempt]:active]:[transform:none] has-[[data-row-press-exempt]:active]:opacity-100'

/** Tappable/long-pressable wrapper for an OptionItem row. */
export function OptionItemPressableArea({
  onPress,
  onLongPress,
  disabled,
  modifierPressHref,
  onModifierPress,
  children,
}: OptionItemPressableAreaProps): JSX.Element {
  return (
    <TouchableArea
      className={rowPressExemptClassName}
      opacity={disabled ? 0.5 : 1}
      width="100%"
      px="$spacing12"
      modifierPressHref={modifierPressHref}
      onPress={onPress}
      onLongPress={onLongPress}
      onModifierPress={onModifierPress}
    >
      {children}
    </TouchableArea>
  )
}
