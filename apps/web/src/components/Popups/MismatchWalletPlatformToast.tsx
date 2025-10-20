import { ToastRegularSimple } from 'components/Popups/ToastRegularSimple'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

export const MismatchWalletPlatformToastItem = React.memo(
  ({ expectedPlatform, onDismiss }: { expectedPlatform: Platform | undefined; onDismiss: () => void }): JSX.Element => {
    const { t } = useTranslation()

    const platformToSwitchToText = expectedPlatform === Platform.SVM ? SOLANA_CHAIN_INFO.name : MAINNET_CHAIN_INFO.name

    return (
      <ToastRegularSimple
        text={
          <Flex gap="$spacing4" flex={1}>
            <Flex row gap="$spacing6" alignItems="center">
              <NetworkLogo size={20} chainId={expectedPlatform === Platform.SVM ? UniverseChainId.Solana : null} />
              <Text variant="body4">{t('common.connectTo', { platform: platformToSwitchToText })}</Text>
            </Flex>
            <Text variant="body4" color="$neutral2">
              {t('settings.connectWalletPlatform.warning', { platform: platformToSwitchToText })}
            </Text>
          </Flex>
        }
        onDismiss={onDismiss}
      />
    )
  },
)

MismatchWalletPlatformToastItem.displayName = 'MismatchWalletPlatformToastItem'
