import { isAndroid, isWebPlatform } from '@universe/environment'
import {
  type FlexCompatProps as FlexProps,
  Flex,
  type IconSizeTokens,
  Text,
  type TextCompatProps as TextProps,
} from '@universe/mycelium'
import { Unitag } from '@universe/mycelium/icons/Unitag'
import { DisplayName, DisplayNameType } from 'uniswap/src/features/accounts/types'
import { UNITAG_SUFFIX } from 'uniswap/src/features/unitags/constants'

type DisplayNameProps = {
  displayName?: DisplayName
  unitagIconSize?: IconSizeTokens | number
  textProps?: TextProps
  includeUnitagSuffix?: boolean
} & FlexProps

const INLINE_UNITAG_Y_OFFSET = 2

export function DisplayNameText({
  displayName,
  unitagIconSize = '$icon.24',
  textProps,
  includeUnitagSuffix,
  ...rest
}: DisplayNameProps): JSX.Element {
  const isUnitag = displayName?.type === DisplayNameType.Unitag
  const name = isUnitag ? displayName.name.replaceAll(UNITAG_SUFFIX, '') : displayName?.name

  const suffix = isUnitag && includeUnitagSuffix && (
    <Text {...textProps} color="$neutral2" flexShrink={1}>
      {UNITAG_SUFFIX}
    </Text>
  )

  // Android + web: render the unitag icon as a row sibling (flexShrink 0) instead of nesting it
  // inside the Text node. Nesting it in Text meant a long name and the badge shared one inline
  // box: whiteSpace stays "initial" here so the name can still wrap, but that also gave the browser
  // a line-break opportunity between the name and the badge, so a name that just barely fit could
  // drop the badge alone onto its own line (confirmed in a hover-card repro with a 20-char unitag).
  // A row sibling removes that shared box — the badge now lays out via flex instead of inline text
  // flow, so it can no longer be treated as wrappable text content, and always stays glued to the
  // end of the name.
  // Android additionally can't use the inline-in-Text y-offset below: Fabric no longer honors it,
  // collapsing the icon to origin and overlapping siblings.
  if (isAndroid || isWebPlatform) {
    return (
      <Flex row grow alignItems="center" {...rest}>
        <Text {...textProps} color={textProps?.color ?? '$neutral1'} flexShrink={1} whiteSpace="initial">
          {name}
          {suffix}
        </Text>
        {isUnitag ? (
          <Flex flexShrink={0} pl="$spacing2">
            <Unitag size={unitagIconSize} />
          </Flex>
        ) : null}
      </Flex>
    )
  }

  // Native (iOS): the unitag icon renders inline inside the Text so it flows with the text
  // baseline. There's no vertical-align equivalent on native, so it still needs the y-transform.
  return (
    <Flex row grow {...rest}>
      <Text {...textProps} color={textProps?.color ?? '$neutral1'} flexShrink={1} whiteSpace="initial">
        {name}
        {suffix}
        {isUnitag ? (
          <Flex display="inline" pl="$spacing2" y={INLINE_UNITAG_Y_OFFSET}>
            <Unitag size={unitagIconSize} />
          </Flex>
        ) : null}
      </Text>
    </Flex>
  )
}
