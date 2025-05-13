import { BorderedAlertTriangle } from 'components/Icons/BorderedAlertTriangle'
import { Flex, Image } from 'ui/src'
import { WalletAlert } from 'ui/src/components/icons/WalletAlert'
import { normalizeBase64Image } from 'utils/images'

type WalletBadgeProps = {
  iconSize?: string
  walletIconSize?: number
  badgeSize?: number
  walletColor?: string
  badgeColor?: string
  walletIcon?: string
}

/**
 * Renders a wallet icon with a little alert badge in the bottom-right.
 */
export function WalletAlertBadge({
  iconSize = '$spacing48',
  walletIconSize = 30,
  badgeSize = 24,
  walletIcon,
  walletColor = '$neutral2',
  badgeColor = '$statusWarning',
}: WalletBadgeProps) {
  // If the wallet icon is a base64 image (like Phantom), we need to normalize it
  const cleanImageSrc = walletIcon ? normalizeBase64Image(walletIcon) : undefined

  return (
    <Flex position="relative" height={iconSize} width={iconSize} justifyContent="center" alignItems="center">
      {cleanImageSrc ? (
        <Image src={cleanImageSrc} width={iconSize} height={iconSize} borderRadius="$rounded8" />
      ) : (
        <Flex
          backgroundColor="$surface3"
          borderRadius="$rounded8"
          height={iconSize}
          width={iconSize}
          alignItems="center"
          justifyContent="center"
          mb="$spacing4"
        >
          <WalletAlert color={walletColor} size={walletIconSize} />
        </Flex>
      )}
      <Flex position="absolute" bottom={0} right={-10}>
        <BorderedAlertTriangle height={badgeSize} width={badgeSize} color={badgeColor} />
      </Flex>
    </Flex>
  )
}
