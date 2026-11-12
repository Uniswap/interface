import {
  forwardRef,
  Fragment,
  type ForwardRefExoticComponent,
  type JSX,
  type ReactNode,
  type RefAttributes,
} from 'react'
import { DROPDOWN_EXPANDED_ICON_CLASSES } from '../button-frame-compat/compile'
import { ThemedIconCompat } from '../button-frame-compat/ThemedIconCompat'
import { RotatableChevron } from '../components/icons/RotatableChevron'
import { FlexCompat } from '../flex-compat/FlexCompat'
import { DropdownButtonFrame } from './DropdownButtonFrame'
import { DropdownButtonText } from './DropdownButtonText'
import type { DropdownButtonCompatProps } from './props'

/**
 * A button that opens a dropdown: optional leading icon, label, and a trailing chevron that flips
 * with `isExpanded`. Built on the `button-frame-compat` primitives. `DROPDOWN_EXPANDED_ICON_CLASSES`
 * repaints the icon and chevron while expanded, and its `group-hover/sbtn:` half reads the frame's
 * own group marker, so hovering the frame recolors them with no JS wiring.
 */
const DropdownButtonComponent = forwardRef<HTMLElement, DropdownButtonCompatProps>(function DropdownButtonCompat(
  {
    children,
    emphasis = 'secondary',
    icon,
    disabled,
    elementPositioning = 'equal',
    isExpanded,
    chevronColor,
    chevronSize,
    ...props
  },
  ref,
) {
  // With an icon and a label in the 'equal' layout, flex spacers spread icon, label and chevron evenly.
  const spacer = elementPositioning !== 'grouped' && icon && children ? <FlexCompat flexGrow={1} /> : null
  const expandedIconClassName = isExpanded ? DROPDOWN_EXPANDED_ICON_CLASSES : undefined
  const isTextChild = typeof children === 'string' || typeof children === 'number'

  return (
    <DropdownButtonFrame
      ref={ref}
      iconPosition="before"
      emphasis={emphasis}
      isDisabled={Boolean(disabled)}
      // TODO(INFRA-4589): isExpanded only flips the chevron; the button never sets aria-expanded, so assistive
      // tech isn't told whether its menu is open.
      isExpanded={isExpanded}
      {...props}
    >
      <LeftContainer grouped={elementPositioning === 'grouped' && Boolean(icon) && Boolean(children)}>
        {icon && (
          <ThemedIconCompat
            isDisabled={disabled}
            emphasis={emphasis}
            size={props.size}
            variant="default"
            typeOfButton="button"
            className={expandedIconClassName}
          >
            {icon}
          </ThemedIconCompat>
        )}
        {spacer}
        {isTextChild ? <DropdownButtonText isExpanded={isExpanded}>{children}</DropdownButtonText> : children}
      </LeftContainer>

      {spacer}

      <ThemedIconCompat
        isDisabled={disabled}
        emphasis={emphasis}
        size={props.size}
        variant="default"
        typeOfButton="button"
        className={expandedIconClassName}
      >
        {/* Explicit currentColor: without a color the icon factory bakes in its defaultFill, which
        would beat ThemedIconCompat's text-* classes. A caller chevronColor deliberately wins. */}
        <RotatableChevron
          color={chevronColor ?? 'currentColor'}
          size={chevronSize}
          direction={isExpanded ? 'up' : 'down'}
        />
      </ThemedIconCompat>
    </DropdownButtonFrame>
  )
})

/** Drop-in replacement for the legacy `ui/src` DropdownButton, incl. its `Text` / `Icon` / `Chevron` statics. */
export const DropdownButtonCompat: ForwardRefExoticComponent<DropdownButtonCompatProps & RefAttributes<HTMLElement>> & {
  Text: typeof DropdownButtonText
  Icon: typeof ThemedIconCompat
  Chevron: typeof RotatableChevron
} = Object.assign(DropdownButtonComponent, {
  Text: DropdownButtonText,
  Icon: ThemedIconCompat,
  Chevron: RotatableChevron,
})

function LeftContainer({ grouped, children }: { grouped: boolean; children: ReactNode }): JSX.Element {
  if (grouped) {
    return (
      <FlexCompat row alignItems="center" gap="$gap12">
        {children}
      </FlexCompat>
    )
  }
  return <Fragment>{children}</Fragment>
}
