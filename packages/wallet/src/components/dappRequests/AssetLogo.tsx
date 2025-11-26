import { Flex, UniversalImage, useSporeColors } from 'ui/src'

const DAPP_REQUEST_LOGO_SIZE = 36

const IMAGE_SIZE = { height: DAPP_REQUEST_LOGO_SIZE, width: DAPP_REQUEST_LOGO_SIZE }

interface AssetLogoProps {
  logoUrl?: string
  borderRadius: number
}

/**
 * Displays an asset logo with consistent styling and fallback behavior
 * Used across transaction sections for sending, receiving, and approving assets
 */
export function AssetLogo({ logoUrl, borderRadius }: AssetLogoProps): JSX.Element | null {
  const colors = useSporeColors()

  if (!logoUrl) {
    return null
  }

  return (
    <Flex width={DAPP_REQUEST_LOGO_SIZE} height={DAPP_REQUEST_LOGO_SIZE}>
      <UniversalImage
        fallback={
          <Flex
            borderRadius={borderRadius}
            height={DAPP_REQUEST_LOGO_SIZE}
            style={{ backgroundColor: colors.surface3.val }}
            width={DAPP_REQUEST_LOGO_SIZE}
          />
        }
        size={IMAGE_SIZE}
        style={{
          image: { borderRadius },
          loadingContainer: {
            borderRadius,
            overflow: 'hidden' as const,
          },
        }}
        uri={logoUrl}
      />
    </Flex>
  )
}
