/**
 * Web leg of the SpinningLoader compat (INFRA-3644), which replaced the
 * Tamagui-free `ui/src` SpinningLoader rebuild (INFRA-3286): plain div hosts
 * carrying the replaced Tamagui Flex frames as inline styles, re-homed onto
 * mycelium internals (mycelium CircleSpinner/EmptySpinner icons; the shared
 * `useInjectSingleStylesheet` keyframes injection).
 */
import type { CSSProperties, JSX } from 'react'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'
import { markMyceliumPrimitive } from '../compat/primitive-marker'
import { CircleSpinner } from '../components/icons/CircleSpinner'
import { EmptySpinner } from '../components/icons/EmptySpinner'
import type { SpinningLoaderCompatProps } from './props'

export type { SpinningLoaderCompatProps } from './props'

// Dedupes the injection: every spinner instance shares this one stylesheet.
const CSS_RULE_ID = '__spinning_loader_styles__'
const SPINNING_LOADER_CSS = `
  @keyframes rotate360 {
      from {
          transform: rotate(0deg);
      }
      to {
          transform: rotate(360deg);
      }
  }

  .RotateElement {
      animation: rotate360 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
      transform-origin: center center;
  }
`

/**
 * The layout-consequential declarations the replaced Tamagui Flex hosts carried (its
 * react-native-web-derived view reset), pinned by the packages/tailwind parity suite.
 */
const FLEX_RESET: CSSProperties = {
  alignItems: 'stretch',
  boxSizing: 'border-box',
  display: 'flex',
  flexBasis: 'auto',
  flexDirection: 'column',
  flexShrink: 0,
  minHeight: 0,
  minWidth: 0,
  position: 'relative',
}

export function SpinningLoaderCompat({
  size = 20,
  disabled,
  color,
  unstyled,
  label,
}: SpinningLoaderCompatProps): JSX.Element {
  useInjectSingleStylesheet({ id: CSS_RULE_ID, css: SPINNING_LOADER_CSS, active: !disabled })

  if (disabled) {
    return <EmptySpinner color="$neutral3" size={size} />
  }

  if (unstyled) {
    return (
      // oxlint-disable-next-line react/forbid-elements -- deliberately Tamagui-free: plain div hosts mirror the legacy rebuild's cascade output (INFRA-3644)
      <div aria-label={label} className="RotateElement" role="status" style={FLEX_RESET}>
        <CircleSpinner color={color} size={size} />
      </div>
    )
  }

  return (
    // oxlint-disable-next-line react/forbid-elements -- deliberately Tamagui-free: plain div hosts mirror the legacy rebuild's cascade output (INFRA-3644)
    <div
      aria-label={label}
      role="status"
      style={{
        ...FLEX_RESET,
        alignItems: 'center',
        height: size,
        justifyContent: 'center',
        // The legacy host set the logical marginStart/marginEnd pair; both sides are 2 so the
        // physical properties are direction-independent here.
        marginLeft: 2,
        marginRight: 2,
        width: size,
      }}
    >
      {/* oxlint-disable-next-line react/forbid-elements -- deliberately Tamagui-free: plain div hosts mirror the legacy rebuild's cascade output (INFRA-3644) */}
      <div style={{ ...FLEX_RESET, height: size, minHeight: 8, minWidth: 8, padding: 1.66667, width: size }}>
        {/* oxlint-disable-next-line react/forbid-elements -- deliberately Tamagui-free: plain div hosts mirror the legacy rebuild's cascade output (INFRA-3644) */}
        <div className="RotateElement" style={{ ...FLEX_RESET, position: 'absolute' }}>
          <CircleSpinner color={color} size={size} />
        </div>
      </div>
    </div>
  )
}

SpinningLoaderCompat.displayName = 'SpinningLoaderCompat'

// Legacy color-injecting wrappers (ui/src TouchableArea and its compat twin)
// must skip this primitive — it styles itself; its `color` prop is the
// sanctioned way to tint the spinner.
markMyceliumPrimitive(SpinningLoaderCompat)
