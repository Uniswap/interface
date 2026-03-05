import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatableCopyIcon, Flex, FlexProps, Text } from 'ui/src'
import { ShareArrow } from 'ui/src/components/icons/ShareArrow'
import { XTwitter } from 'ui/src/components/icons/XTwitter'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import { baseActionButtonStyles } from '~/components/Dropdowns/FilterButton'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import useCopyClipboard from '~/hooks/useCopyClipboard'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { buildPortfolioUrl } from '~/pages/Portfolio/utils/portfolioUrls'
import { openTwitterShareWindow } from '~/utils/sharing'

type ShareAccountItem = {
  platform: Platform
  address: string
}

interface SharePortfolioButtonProps {
  size?: 'small' | 'medium'
  transition?: FlexProps['transition']
  showLabel?: boolean
}

export function SharePortfolioButton({
  size = 'medium',
  transition,
  showLabel = true,
}: SharePortfolioButtonProps): JSX.Element | null {
  const { t } = useTranslation()
  const [isCopied, copyToClipboard] = useCopyClipboard(ONE_SECOND_MS)
  const [isOpen, setIsOpen] = useState(false)
  const copiedAddressRef = useRef<string | null>(null)
  const { externalAddress, isExternalWallet } = usePortfolioRoutes()
  const activeAddresses = useActiveAddresses()

  const isCopiedAddress = useCallback((address: string) => isCopied && copiedAddressRef.current === address, [isCopied])

  const connectedAccounts: ShareAccountItem[] = useMemo(() => {
    if (isExternalWallet) {
      return []
    }

    const accounts: ShareAccountItem[] = []
    if (activeAddresses.evmAddress) {
      accounts.push({
        address: activeAddresses.evmAddress,
        platform: Platform.EVM,
      })
    }
    if (activeAddresses.svmAddress) {
      accounts.push({
        address: activeAddresses.svmAddress,
        platform: Platform.SVM,
      })
    }
    return accounts
  }, [isExternalWallet, activeAddresses.evmAddress, activeAddresses.svmAddress])

  const hasMultipleConnectedWallets = connectedAccounts.length > 1

  // For external wallet or single connected wallet, this is the primary address
  const primaryAddress = externalAddress?.address ?? connectedAccounts[0]?.address

  const getShareUrl = useEvent((address: string) => {
    const portfolioPath = buildPortfolioUrl({ externalAddress: address })
    return `${window.location.origin}${portfolioPath}`
  })

  const handleCopyLink = useEvent((address: string) => {
    const shareUrl = getShareUrl(address)
    copiedAddressRef.current = address
    copyToClipboard(shareUrl)
  })

  const handleShareToX = useEvent(() => {
    if (primaryAddress) {
      openTwitterShareWindow({ text: t('common.share.twitter.wallet'), url: getShareUrl(primaryAddress) })
    }
    setIsOpen(false)
  })

  if (!isExternalWallet && connectedAccounts.length === 0) {
    return null
  }

  const iconSize = size === 'small' ? iconSizes.icon16 : iconSizes.icon20
  const textVariant = size === 'small' ? 'buttonLabel4' : 'buttonLabel3'

  return (
    <Trace logPress element={ElementName.PortfolioShareButton}>
      <Dropdown
        isOpen={isOpen}
        toggleOpen={setIsOpen}
        menuLabel={
          <Flex testID={TestID.PortfolioShareButton} row alignItems="center" gap="$gap8">
            <ShareArrow size={iconSize} color="$neutral1" />
            {showLabel && (
              <Text variant={textVariant} color="$neutral1">
                {t('common.button.share')}
              </Text>
            )}
          </Flex>
        }
        hideChevron
        buttonStyle={{
          ...baseActionButtonStyles,
          height: size === 'small' ? 32 : 40,
          gap: size === 'small' ? '$gap6' : '$gap8',
          px: '$spacing12',
        }}
        dropdownStyle={{ minWidth: 220 }}
        alignRight
        transition={transition}
      >
        {/* Multi-wallet: show copy link for each wallet with chain icon */}
        {hasMultipleConnectedWallets ? (
          <>
            {connectedAccounts.map((account) => (
              <InternalMenuItem key={account.address} onPress={() => handleCopyLink(account.address)}>
                <Flex row alignItems="center" gap="$gap12">
                  {isCopiedAddress(account.address) ? (
                    <AnimatableCopyIcon isCopied size={iconSizes.icon16} textColor="$neutral1" />
                  ) : (
                    <NetworkLogo
                      chainId={account.platform === Platform.SVM ? UniverseChainId.Solana : UniverseChainId.Mainnet}
                      size={iconSizes.icon16}
                    />
                  )}
                  <Text variant="buttonLabel3" color="$neutral1">
                    {t('common.share.copyPortfolioLink')}
                  </Text>
                </Flex>
              </InternalMenuItem>
            ))}
          </>
        ) : (
          /* Single wallet or external wallet: show copy link with copy icon */
          <InternalMenuItem onPress={() => primaryAddress && handleCopyLink(primaryAddress)}>
            <Flex row alignItems="center" gap="$gap12">
              <AnimatableCopyIcon
                isCopied={primaryAddress ? isCopiedAddress(primaryAddress) : false}
                size={iconSizes.icon16}
                textColor="$neutral1"
              />
              <Text variant="buttonLabel3" color="$neutral1">
                {t('common.share.copyPortfolioLink')}
              </Text>
            </Flex>
          </InternalMenuItem>
        )}

        {/* Share to X button */}
        <InternalMenuItem onPress={handleShareToX}>
          <Flex row alignItems="center" gap="$gap12">
            <XTwitter size="$icon.16" color="$neutral1" />
            <Text variant="buttonLabel3" color="$neutral1">
              {t('common.share.shareToTwitter')}
            </Text>
          </Flex>
        </InternalMenuItem>
      </Dropdown>
    </Trace>
  )
}
