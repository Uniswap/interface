/**
 * WEB leg of `ButtonTextCompat` — the rebuilt legacy `CustomButtonText`
 * (`styled(Text, …)`, INFRA-3315). Same composition as the frame leg:
 *
 *  1. the CLOSED cell via `../button-compat/compile`'s
 *     `buttonCompatTextClassName` (byte-identical to the parity-proven
 *     ButtonCompat label);
 *  2. the OPEN legacy Text style-prop surface through the
 *     deterministic-emission engine (Text style compiler), merged last so a
 *     caller prop beats the cell — Tamagui precedence.
 *
 * Variant selection reads the frame context with per-prop overrides (styled
 * context semantics). The legacy custom-color branch is preserved: a concrete
 * hex/rgb `color` pins the label to that color in EVERY state (legacy also
 * pinned `$group-item-hover` to the same value, so hover changes nothing);
 * a custom frame background pins the contrast-passing text class.
 */
import { forwardRef, type JSX } from 'react'
import { buttonCompatTextClassName } from '../button-compat/compile'
import { cn } from '../cn'
import { composeCompatEmission, mergeCompatStyle, type CompatEmission } from '../compat/compose'
import { domTestId } from '../compat/dom-test-id'
import type { CompatProps } from '../compat/props'
import type { TextCompatStyleProps } from '../text-compat/props'
import { styleClasses as textStyleClasses } from '../text-compat/style-classes'
import { ButtonFrameContextProvider, useButtonFrameContext } from './context'
import { getMaybeHexOrRgbColor } from './custom-color'
import type { ButtonTextCompatProps } from './text-props'

export type { ButtonTextCompatProps } from './text-props'

const EMPTY_FIXED_CLASSES = (): string[] => []

function buttonTextOpenEmission(props: CompatProps<TextCompatStyleProps>): CompatEmission {
  return composeCompatEmission<TextCompatStyleProps>({
    props,
    baseClasses: '',
    styleClasses: (style) => textStyleClasses(style),
    fixedClasses: EMPTY_FIXED_CLASSES,
  })
}

export const ButtonTextCompat = forwardRef<HTMLSpanElement, ButtonTextCompatProps>(
  function ButtonTextCompat(props, ref): JSX.Element {
    const ctx = useButtonFrameContext()
    const {
      variant = ctx.variant,
      emphasis = ctx.emphasis,
      size = ctx.size,
      isDisabled = ctx.isDisabled,
      'custom-background-color': customBackgroundColorProp,
      'line-height-disabled': lineHeightDisabledLegacy,
      lineHeightDisabled: lineHeightDisabledProp,
      color,
      children,
      style,
      testID,
      // Legacy single-line label, matching the native leg's hardcoded `numberOfLines={1}`.
      // A value above `1` emits the clamp classes but renders no second line (INFRA-3895).
      numberOfLines = 1,
      ...open
    } = props

    const lineHeightDisabled = lineHeightDisabledProp ?? lineHeightDisabledLegacy === 'true'

    const customColor = getMaybeHexOrRgbColor(color)
    const tokenColor = customColor === undefined ? color : undefined
    const customBackground = getMaybeHexOrRgbColor(customBackgroundColorProp) ?? ctx.customBackgroundColor

    const closedClassName = buttonCompatTextClassName({
      variant,
      emphasis,
      size,
      isDisabled,
      customTextClass: isDisabled ? undefined : ctx.customTextClass,
      lineHeightDisabled,
    })

    const emission = buttonTextOpenEmission({
      ...open,
      numberOfLines,
      color: tokenColor,
    } as CompatProps<TextCompatStyleProps>)

    // Legacy pins a concrete hex/rgb color across every state (its
    // `$group-item-hover` got the same value); inline style wins the cascade
    // over the scoped cell classes, which is exactly that behavior.
    const customColorStyle =
      customColor !== undefined && !isDisabled && !customBackground ? { color: customColor } : undefined

    return (
      // Re-broadcast the resolved selection so a nested ThemedIcon inside
      // Button.Text (legacy composition) reads the same cell.
      <ButtonFrameContextProvider value={{ ...ctx, variant, emphasis, size, isDisabled }}>
        <span
          ref={ref}
          className={cn(closedClassName, emission.className)}
          style={mergeCompatStyle(mergeCompatStyle(emission.style, customColorStyle), style)}
          {...domTestId(testID)}
        >
          {children}
        </span>
      </ButtonFrameContextProvider>
    )
  },
)
