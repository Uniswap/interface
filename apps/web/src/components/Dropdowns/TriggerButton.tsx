import { Text, type TextCompatProps } from '@universe/mycelium'

export type TriggerButtonProps = TextCompatProps & {
  active?: boolean
  outlined?: boolean
}

/**
 * Base chrome padding, split per axis: within one compat props object the most
 * specific padding key resolves last, so an always-emitted base axis key would
 * beat a call-site shorthand override (`p`/`px`/`py` via `buttonStyle`). Each
 * base axis is emitted only when no caller key covers that axis.
 */
const BASE_PADDING = { pt: '$spacing2', pb: '$spacing2', pl: 14, pr: 6 } as const satisfies TextCompatProps

// Not RTL-aware: paddingStart/paddingEnd are treated as covering the physical pl/pr they map to in LTR only.
const PADDING_AXIS_COVERING_KEYS: Record<keyof typeof BASE_PADDING, ReadonlyArray<string>> = {
  pt: ['pt', 'paddingTop', 'py', 'paddingVertical', 'p', 'padding'],
  pb: ['pb', 'paddingBottom', 'py', 'paddingVertical', 'p', 'padding'],
  pl: ['pl', 'paddingLeft', 'paddingStart', 'px', 'paddingHorizontal', 'p', 'padding'],
  pr: ['pr', 'paddingRight', 'paddingEnd', 'px', 'paddingHorizontal', 'p', 'padding'],
}

function uncoveredBasePadding(rest: TextCompatProps): TextCompatProps {
  const bag = rest as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [axis, coveringKeys] of Object.entries(PADDING_AXIS_COVERING_KEYS)) {
    if (!coveringKeys.some((key) => bag[key] !== undefined)) {
      out[axis] = BASE_PADDING[axis as keyof typeof BASE_PADDING]
    }
  }
  return out as TextCompatProps
}

// TODO(INFRA-4485): Duplicates mycelium. Use `TriggerButtonCompat` from `@universe/mycelium/trigger-button-compat` instead.
export function TriggerButton({ active, outlined = true, ...rest }: TriggerButtonProps): JSX.Element {
  return (
    <Text
      m={0}
      borderRadius="$rounded12"
      borderStyle="solid"
      borderColor="$surface3"
      flexShrink={0}
      display="flex"
      flexDirection="row"
      height="100%"
      color="$neutral1"
      fontSize="$medium"
      lineHeight={24}
      fontWeight="$book"
      whiteSpace="nowrap"
      cursor="pointer"
      userSelect="none"
      backgroundColor={outlined ? '$surface1' : 'transparent'}
      borderWidth={outlined ? 1 : 0}
      hoverStyle={{ backgroundColor: outlined ? '$surface2' : 'transparent' }}
      // Assumes the sole caller (Dropdown.tsx) couples active to outlined; a decoupled active=true/outlined=false caller would still resolve to $surface2 here.
      focusStyle={{ backgroundColor: active === true || outlined ? '$surface2' : 'transparent' }}
      // Variant BEFORE the spreads so caller overrides beat `active` — deliberately opposite to DropdownContent's position variants (legacy TriggerButtonCompat parity).
      {...(active === true ? { backgroundColor: '$surface2' } : {})}
      {...uncoveredBasePadding(rest)}
      {...rest}
    />
  )
}
