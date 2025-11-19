import { Flex, UniversalImage } from 'ui/src'
import { borderRadii } from 'ui/src/theme'

const DAPP_REQUEST_LOGO_SIZE = 36

const IMAGE_SIZE = { height: DAPP_REQUEST_LOGO_SIZE, width: DAPP_REQUEST_LOGO_SIZE }

const IMAGE_STYLES = {
  image: { borderRadius: borderRadii.rounded12 },
  loadingContainer: {
    borderRadius: borderRadii.rounded12,
    overflow: 'hidden',
  },
}

interface AssetLogoProps {
  logoUrl?: string
}

/**
 * Displays an asset logo with consistent styling and fallback behavior
 * Used across transaction sections for sending, receiving, and approving assets
 */
export function AssetLogo({ logoUrl }: AssetLogoProps): JSX.Element | null {
  if (!logoUrl) {
    return null
  }

  return (
    <Flex width={DAPP_REQUEST_LOGO_SIZE} height={DAPP_REQUEST_LOGO_SIZE}>
      <UniversalImage
        fallback={
          <Flex
            width={DAPP_REQUEST_LOGO_SIZE}
            height={DAPP_REQUEST_LOGO_SIZE}
            borderRadius="$rounded12"
            backgroundColor="$surface3"
          />
        }
        size={IMAGE_SIZE}
        style={IMAGE_STYLES}
        uri={logoUrl}
      />
    </Flex>
  )
}
