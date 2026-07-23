import { isMobileWeb } from '@universe/environment'
import { Link } from 'react-router'
import { Text } from 'ui/src'
import { spacing, TextVariantTokens } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MobileTouchableArea } from '~/components/MobileTouchableArea'
import { MenuItem } from '~/components/NavBar/CompanyMenu/Content'
import { ExternalLink } from '~/theme/components/Links'

const LinkStyle = {
  textDecoration: 'none',
  height: 'unset',
  padding: 0,
  paddingTop: spacing.spacing4,
}

const LinkTextStyle = {
  color: '$neutral1',
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
}: MenuItem & { textVariant?: TextVariantTokens }) {
  const content = internal ? (
    <Link to={href} onClick={closeMenu} style={LinkStyle}>
      <MobileTouchableArea row gap="$gap8">
        {icon}
        <Text variant={textVariant} {...LinkTextStyle}>
          {label}
        </Text>
      </MobileTouchableArea>
    </Link>
  ) : (
    <PlatformExternalLink to={href} href={href} onClick={closeMenu} style={{ ...LinkStyle, stroke: 'unset' }}>
      <MobileTouchableArea row gap="$gap8">
        {icon}
        <Text variant={textVariant} {...LinkTextStyle}>
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
