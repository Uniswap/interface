import { isMobileWeb } from '@universe/environment'
import { type ColorTokens, Text, type TextVariantKey } from '@universe/mycelium'
import { spacing } from '@universe/mycelium/tokens'
import { Link } from 'react-router'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MenuItem } from '~/components/CompanyMenu/Content'
import { MobileTouchableArea } from '~/components/MobileTouchableArea'
import { ExternalLink } from '~/theme/components/Links'

const LinkStyle = {
  textDecoration: 'none',
  height: 'unset',
  padding: 0,
  paddingTop: spacing.spacing4,
}

const LinkTextStyle = {
  color: '$neutral1' as ColorTokens,
  hoverStyle: {
    opacity: 0.6,
  },
}

// On mobile web, use the Link component to omit long-press styling
const PlatformExternalLink = isMobileWeb ? Link : ExternalLink

export function MenuLink({
  label,
  href,
  internal,
  closeMenu,
  textVariant = 'body3',
  icon,
  elementName,
  color,
}: MenuItem & {
  textVariant?: TextVariantKey
  color?: ColorTokens
}) {
  const content = internal ? (
    <Link to={href} onClick={closeMenu} style={LinkStyle}>
      <MobileTouchableArea row alignItems="center" gap="$gap8" minHeight={isMobileWeb ? 36 : undefined}>
        {icon}
        <Text variant={textVariant} {...LinkTextStyle} color={color ?? LinkTextStyle.color}>
          {label}
        </Text>
      </MobileTouchableArea>
    </Link>
  ) : (
    <PlatformExternalLink to={href} href={href} onClick={closeMenu} style={{ ...LinkStyle, stroke: 'unset' }}>
      <MobileTouchableArea row alignItems="center" gap="$gap8" minHeight={isMobileWeb ? 36 : undefined}>
        {icon}
        <Text variant={textVariant} {...LinkTextStyle} color={color ?? LinkTextStyle.color}>
          {label}
        </Text>
      </MobileTouchableArea>
    </PlatformExternalLink>
  )

  return (
    <Trace logPress element={elementName}>
      {content}
    </Trace>
  )
}
