import { useTranslation } from 'react-i18next'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { opacifyRaw } from 'ui/src/theme/color/utils'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { CreateAuctionTokenLogo } from '~/pages/Liquidity/CreateAuction/components/CreateAuctionTokenLogo'
import { useCreateAuctionTokenColor } from '~/pages/Liquidity/CreateAuction/hooks/useCreateAuctionTokenColor'

const TOKEN_LOGO_SIZE = 60
// Strength of the token-colored glow rising from the bottom of the modal.
const GLOW_OPACITY = 60

// Blurred, faded copies of the token logo scattered behind the content for a celebratory backdrop.
// Positions/sizes/opacities/blur mirror the Figma `Background` (percentages of the 420×344 frame).
const LOGO_BLOBS: {
  size: number
  blur: number
  opacity: number
  top?: string
  bottom?: string
  left?: string
  right?: string
}[] = [
  { size: 58, blur: 0.875, opacity: 0.54, top: '69%', left: '76%' },
  { size: 56, blur: 2.258, opacity: 0.54, top: '-4%', left: '67%' },
  { size: 56, blur: 2.258, opacity: 0.54, top: '48%', left: '-4%' },
  { size: 45, blur: 6.774, opacity: 0.24, top: '-1%', left: '16%' },
  { size: 45, blur: 6.774, opacity: 0.24, top: '37%', left: '80%' },
]

interface LaunchAuctionSuccessModalProps {
  isOpen: boolean
  tokenSymbol: string
  chainId: UniverseChainId
  /** Real on-chain launch tx hash (never a 5792 batch id); the explorer link is hidden until it's known. */
  launchHash?: string
  onClose: () => void
  onViewAuction: () => void
}

export function LaunchAuctionSuccessModal({
  isOpen,
  tokenSymbol,
  chainId,
  launchHash,
  onClose,
  onViewAuction,
}: LaunchAuctionSuccessModalProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const tokenColor = useCreateAuctionTokenColor()

  const explorerName = getChainInfo(chainId).explorer.name
  const explorerLink = launchHash
    ? getExplorerLink({ chainId, data: launchHash, type: ExplorerDataType.TRANSACTION })
    : undefined

  const handleViewOnExplorer = useEvent(() => {
    if (!explorerLink) {
      return
    }
    openUri({ uri: explorerLink }).catch((e) => {
      logger.error(e, { tags: { file: 'LaunchAuctionSuccessModal', function: 'handleViewOnExplorer' } })
    })
  })

  // Soft token-colored glow rising from the bottom, fading into the surface (transparent when the
  // token has no brand color — the floating logo blobs still carry the color).
  const glow = tokenColor ? opacifyRaw(GLOW_OPACITY, tokenColor) : colors.transparent.val
  const backgroundGlow = `radial-gradient(120% 80% at 50% 102%, ${glow} 0%, ${colors.surface1.val} 62%)`

  return (
    <Modal isModalOpen={isOpen} name={ModalName.LaunchAuctionSuccess} onClose={onClose} maxWidth={420} padding={0}>
      {/* Matches AdaptiveWebModal's own $rounded16 so the full-bleed gradient reaches the modal corners. */}
      <Flex position="relative" overflow="hidden" borderRadius="$rounded16" backgroundColor="$surface1">
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          pointerEvents="none"
          style={{ background: backgroundGlow }}
        />

        <Flex position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none">
          {LOGO_BLOBS.map((blob) => (
            <Flex
              key={`${blob.top ?? blob.bottom ?? ''}-${blob.left ?? blob.right ?? ''}`}
              position="absolute"
              pointerEvents="none"
              style={{
                top: blob.top,
                bottom: blob.bottom,
                left: blob.left,
                right: blob.right,
                opacity: blob.opacity,
                filter: `blur(${blob.blur}px)`,
              }}
            >
              <CreateAuctionTokenLogo size={blob.size} hideNetworkLogo />
            </Flex>
          ))}
        </Flex>

        <Flex
          position="relative"
          zIndex={1}
          pt="$spacing60"
          pb="$spacing12"
          px="$spacing12"
          gap="$spacing24"
          alignItems="center"
        >
          <CreateAuctionTokenLogo size={TOKEN_LOGO_SIZE} />

          <Flex gap="$spacing12" alignItems="center" width="100%">
            <Flex gap="$spacing4" alignItems="center">
              <Text variant="subheading1" color="$neutral2" textAlign="center">
                {t('toucan.createAuction.launchSuccess.title')}
              </Text>
              <Text variant="heading2" color="$neutral1" textAlign="center">
                {tokenSymbol}
              </Text>
            </Flex>

            {explorerLink ? (
              <TouchableArea onPress={handleViewOnExplorer}>
                <Flex row alignItems="center" justifyContent="center" gap="$spacing8">
                  <Text variant="buttonLabel3" color="$neutral1">
                    {t('account.wallet.action.viewExplorer', { blockExplorerName: explorerName })}
                  </Text>
                  <ExternalLink size="$icon.20" color="$neutral1" />
                </Flex>
              </TouchableArea>
            ) : null}
          </Flex>

          <Button emphasis="primary" size="small" fill={false} width="100%" onPress={onViewAuction}>
            {t('toucan.createAuction.launchSuccess.viewAuction')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
