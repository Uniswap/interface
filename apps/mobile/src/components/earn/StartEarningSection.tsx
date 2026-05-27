import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EarnVaultChip } from 'uniswap/src/features/earn/EarnVaultChip'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const CHIP_WIDTH = 200

export function StartEarningSection(): JSX.Element | null {
  const { t } = useTranslation()
  const isEarnEnabled = useFeatureFlag(FeatureFlags.Earn)
  const { isTestnetModeEnabled } = useEnabledChains()
  const activeAddress = useActiveAccountAddress() ?? undefined
  const { navigateToEarnVault } = useWalletNavigation()

  const enabled = isEarnEnabled && !isTestnetModeEnabled
  const { vaults, positionsByVaultId } = useEarnVaults({ account: activeAddress, enabled })

  if (!enabled || vaults.length === 0) {
    return null
  }

  return (
    <Flex gap="$spacing8" pt="$spacing8" pb="$spacing16">
      <Text color="$neutral2" variant="subheading2" mx="$spacing20">
        {t('explore.earn.startEarning')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {vaults.map((vault) => {
          const position = positionsByVaultId.get(vault.id)
          return (
            <Flex key={vault.id} width={CHIP_WIDTH}>
              <EarnVaultChip
                vault={vault}
                position={position}
                onPress={() => navigateToEarnVault({ vault, position })}
              />
            </Flex>
          )
        })}
      </ScrollView>
    </Flex>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.spacing12,
    paddingHorizontal: spacing.spacing12,
  },
})
