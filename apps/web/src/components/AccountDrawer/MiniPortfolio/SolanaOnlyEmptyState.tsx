import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { EmptyPoolsIcon } from 'ui/src/components/icons/EmptyPoolsIcon'
import { NoNfts } from 'ui/src/components/icons/NoNfts'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

interface SolanaOnlyEmptyStateProps {
  tab: 'nfts' | 'pools'
  showConnectButton: boolean
}

export function SolanaOnlyEmptyState({ tab, showConnectButton }: SolanaOnlyEmptyStateProps) {
  const { t } = useTranslation()
  const setMenu = useSetMenu()

  const handleConnectWallet = useCallback(() => {
    // Open the main menu with platform-specific connection for EVM
    setMenu({ variant: MenuStateVariant.CONNECT_PLATFORM, platform: Platform.EVM })
  }, [setMenu])

  const isNFTs = tab === 'nfts'
  const Icon = isNFTs ? NoNfts : EmptyPoolsIcon

  const title = isNFTs ? t('tokens.nfts.notAvailableOnSolana') : t('pool.notAvailableOnSolana')

  const description = isNFTs ? t('tokens.nfts.connectEthereumToView') : t('pool.connectEthereumToView')

  return (
    <Flex centered height="100%" width="100%" px="$spacing32" py="$spacing24">
      <Icon size="$icon.100" />

      <Text variant="subheading1" textAlign="center" marginTop="$spacing12">
        {title}
      </Text>

      {showConnectButton && (
        <>
          <Text
            variant="body2"
            textAlign="center"
            marginTop="$spacing8"
            color="$neutral2"
            $platform-web={{ textWrap: 'pretty' }}
          >
            {description}
          </Text>

          <Flex marginTop="$spacing20" row>
            <Button variant="branded" onPress={handleConnectWallet}>
              {t('common.connectAWallet.button.evm')}
            </Button>
          </Flex>
        </>
      )}
    </Flex>
  )
}
