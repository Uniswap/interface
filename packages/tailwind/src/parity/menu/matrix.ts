/**
 * The enumerated parity matrices for the menu-family visual vocabulary
 * (INFRA-3021): the MenuContent container card, the DropdownMenuSheetItem
 * frame, and the item-label (MenuOptionItem) color/typography states —
 * each crossed with light/dark themes. The behavioral surface (open state,
 * dismissal, positioning, z-index) lives in menu-behavior.test.tsx.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type {
  DropdownMenuSheetItemLabelStyleInputs,
  MenuContentContainerStyles,
} from '../../../../mycelium/src/menu-compat/compile'
import type { ThemeName } from '../core/theme'

export interface MenuMatrixCase<P> {
  name: string
  props: P
  theme: ThemeName
}

const THEMES: ThemeName[] = ['light', 'dark']

function perTheme<P>(name: string, props: P): MenuMatrixCase<P>[] {
  return THEMES.map((theme) => ({ name: `${name} [${theme}]`, props, theme }))
}

// ── MenuContent container card ──────────────────────────────────────────

export type ContainerMatrixProps = MenuContentContainerStyles

/**
 * `MENU_CONTENT_SHEET_CONTAINER_STYLES` from
 * `uniswap/src/components/menus/ContextMenuContent.tsx`, verbatim — the one
 * containerStyles payload the menu system itself passes.
 */
export const SHEET_CONTAINER_STYLES: ContainerMatrixProps = {
  p: '$none',
  pb: '$spacing16',
  backgroundColor: 'transparent',
  borderWidth: '$none',
  gap: '$spacing8',
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  minWidth: undefined,
  maxWidth: undefined,
}

export function buildContainerMatrix(): MenuMatrixCase<ContainerMatrixProps>[] {
  return [
    ...perTheme('default card (no containerStyles)', {}),
    ...perTheme('sheet container styles (MENU_CONTENT_SHEET_CONTAINER_STYLES)', SHEET_CONTAINER_STYLES),
    ...perTheme('padding override', { p: '$spacing12' }),
    ...perTheme('transparent background', { backgroundColor: 'transparent' }),
    ...perTheme('backgroundColor token override', { backgroundColor: '$surface2' }),
    ...perTheme('gap + row layout', { gap: '$spacing8', flexDirection: 'row' }),
    ...perTheme('width stretch', { width: '100%', minWidth: undefined, maxWidth: undefined }),
    ...perTheme('radius override', { borderRadius: '$rounded12' }),
    ...perTheme('border color override', { borderColor: '$surface3' }),
    ...perTheme('numeric min/max width', { minWidth: 160, maxWidth: 320 }),
    ...perTheme('enter animation preset', { animateEnter: 'fadeIn' }),
  ]
}

// ── DropdownMenuSheetItem frame ─────────────────────────────────────────

export interface ItemFrameMatrixProps {
  variant: 'small' | 'medium'
  disabled?: boolean
  height?: number
}

export function buildItemFrameMatrix(): MenuMatrixCase<ItemFrameMatrixProps>[] {
  return [
    ...perTheme<ItemFrameMatrixProps>('small variant', { variant: 'small' }),
    ...perTheme<ItemFrameMatrixProps>('medium variant', { variant: 'medium' }),
    ...perTheme<ItemFrameMatrixProps>('small disabled', { variant: 'small', disabled: true }),
    ...perTheme<ItemFrameMatrixProps>('medium disabled', { variant: 'medium', disabled: true }),
    ...perTheme<ItemFrameMatrixProps>('small with fixed height', { variant: 'small', height: 48 }),
    ...perTheme<ItemFrameMatrixProps>('medium with fixed height', { variant: 'medium', height: 56 }),
  ]
}

// ── Item label (the MenuOptionItem color/typography vocabulary) ─────────

export type ItemLabelMatrixProps = DropdownMenuSheetItemLabelStyleInputs

export function buildItemLabelMatrix(): MenuMatrixCase<ItemLabelMatrixProps>[] {
  return [
    ...perTheme<ItemLabelMatrixProps>('small default', { variant: 'small' }),
    ...perTheme<ItemLabelMatrixProps>('medium default', { variant: 'medium' }),
    ...perTheme<ItemLabelMatrixProps>('small destructive', { variant: 'small', destructive: true }),
    ...perTheme<ItemLabelMatrixProps>('small disabled', { variant: 'small', disabled: true }),
    ...perTheme<ItemLabelMatrixProps>('small destructive+disabled (destructive wins)', {
      variant: 'small',
      destructive: true,
      disabled: true,
    }),
    ...perTheme<ItemLabelMatrixProps>('small textColor override', { variant: 'small', textColor: '$accent1' }),
    ...perTheme<ItemLabelMatrixProps>('medium textColor override', { variant: 'medium', textColor: '$neutral2' }),
    ...perTheme<ItemLabelMatrixProps>('small multiline', { variant: 'small', allowMultiline: true }),
    ...perTheme<ItemLabelMatrixProps>('medium single-line clamp', { variant: 'medium', allowMultiline: false }),
  ]
}

// ── Menu separator ───────────────────────────────────────────────────────

/**
 * The divider MenuContent renders before flagged items
 * (`<Separator my="$spacing6" />`) carries no props of its own — the matrix
 * crosses only the themes.
 */
export type SeparatorMatrixProps = Record<string, never>

export function buildSeparatorMatrix(): MenuMatrixCase<SeparatorMatrixProps>[] {
  return perTheme('menu separator (Separator my=$spacing6)', {})
}
