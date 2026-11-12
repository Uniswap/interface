/**
 * Web leg of the `TouchableTextLink` compat (INFRA-3487) — the drop-in twin of
 * the legacy `ui/src` `TouchableTextLink`
 * (`packages/ui/src/components/touchable/TouchableTextLink/TouchableTextLink.tsx`):
 * an anchor-tagged Text with the link affordances — hovered-token color swap
 * on hover, hovered color + underline on focus — inside an unstyled
 * TouchableArea frame (or bare, with `onlyUseText`, for inline links).
 *
 * Structure is the legacy structure over the parity-proven compat primitives:
 * the frame is `TouchableAreaCompat` carrying the legacy
 * `TouchableTextLinkFrame` styled-options (unstyled variant with hover/focus
 * dropped and press feedback neutralized, no radius), and the text is
 * `TextCompat` with the same anchor props and pseudo pools the legacy Text
 * receives. One deliberate divergence: the legacy component scoped the hover
 * and focus-visible pools through its `group: 'item'` frame marker; new
 * `$group-*` styling is banned (INFRA-2958), so the pools bind to the anchor
 * itself — equivalent here because the unstyled frame hugs the text and the
 * anchor (not the tabIndex -1 frame) is the focusable element.
 *
 * Navigation is the anchor's own (`href`/`target`); `onPress` runs beside it
 * and the pressed link blurs afterwards, exactly like the legacy web branch.
 */
import * as React from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { cn } from '../cn'
import { TextCompat } from '../text-compat/TextCompat'
import { TouchableAreaCompat } from '../touchable-area/TouchableAreaCompat'
import { UNDERLINE_POSITION_CLASS } from './compile'
import { DEFAULT_LINK_COLOR, DEFAULT_LINK_TARGET, DEFAULT_LINK_VARIANT, type TouchableTextLinkProps } from './props'
import { linkFocusPool, linkHoverPool, linkTextColor } from './resolve'

export const TouchableTextLinkCompat = React.forwardRef<HTMLElement, TouchableTextLinkProps>(
  function TouchableTextLinkCompat(props, ref) {
    const {
      children,
      variant = DEFAULT_LINK_VARIANT,
      color = DEFAULT_LINK_COLOR,
      link,
      onPress,
      target = DEFAULT_LINK_TARGET,
      disabled,
      disabledStyle,
      forceStyle,
      onlyUseText,
      noUnderline = false,
      display,
      ...textProps
    } = props

    const textRef = React.useRef<HTMLElement | null>(null)
    const setTextRef = useEvent((node: HTMLElement | null): void => {
      textRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref !== null) {
        ref.current = node
      }
    })

    const hoverPool = React.useMemo(() => linkHoverPool({ color, disabled }), [color, disabled])
    const focusPool = React.useMemo(
      () => linkFocusPool({ color, disabled, noUnderline }),
      [color, disabled, noUnderline],
    )

    const handlePressWithLink = useEvent((event: React.MouseEvent<HTMLElement>): void => {
      onPress?.(event)
      // The legacy web branch: blur after the press so the focus styles do
      // not linger on the clicked link once navigation happens.
      setTimeout(() => {
        textRef.current?.blur()
      }, 0)
    })

    const href = disabled === true ? undefined : link
    const text = (
      <TextCompat
        ref={setTextRef}
        display={onlyUseText === true ? display : undefined}
        disabled={disabled}
        focusStyle={focusPool}
        focusVisibleStyle={focusPool}
        textDecorationLine="none"
        hoverStyle={hoverPool}
        className={cn(UNDERLINE_POSITION_CLASS)}
        variant={variant}
        color={linkTextColor(color, disabled)}
        forceStyle={forceStyle}
        outlineStyle="none"
        href={href}
        target={target}
        tag="a"
        // An `a` with an href is already a link; without one (disabled) it needs the role spelled out.
        role={href === undefined ? 'link' : undefined}
        onPress={onlyUseText === true && disabled !== true ? handlePressWithLink : undefined}
        {...textProps}
      >
        {children}
      </TextCompat>
    )

    if (onlyUseText === true) {
      return text
    }

    return (
      <TouchableAreaCompat
        variant="unstyled"
        // The legacy TouchableTextLinkFrame styled-options: hover and
        // focus-visible pools dropped, the text is the focusable element
        // (tabIndex -1 rides focusable), press feedback neutralized (the
        // unstyled variant's scale 1; no press opacity), no radius.
        hoverable={false}
        focusable={false}
        scaleTo={1}
        activeOpacity={0}
        borderRadius="$none"
        // The legacy component renders the frame directly (not through the
        // TouchableArea wrapper), so it has neither press-propagation gating
        // nor child color injection.
        shouldStopPropagation={false}
        shouldAutomaticallyInjectColors={false}
        disabled={disabled}
        disabledStyle={disabledStyle}
        forceStyle={forceStyle}
        display={display}
        onPress={handlePressWithLink}
      >
        {text}
      </TouchableAreaCompat>
    )
  },
)
