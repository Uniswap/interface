import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnVaultChip } from 'uniswap/src/features/earn/EarnVaultChip'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { getEarnVaultsSortedForExplore } from 'uniswap/src/features/earn/utils'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const CHIP_WIDTH = 200

export function StartEarningSection(): JSX.Element | null {
  const { t } = useTranslation()
  const isEarnEnabled = useIsEarnEnabled()
  const { isTestnetModeEnabled } = useEnabledChains()
  const activeAddress = useActiveAccountAddress() ?? undefined
  const { navigateToEarnVault } = useWalletNavigation()

  const enabled = isEarnEnabled && !isTestnetModeEnabled
  const { vaults, positionsByVaultId } = useEarnVaults({ account: activeAddress, enabled })
  const exploreVaults = useMemo(() => getEarnVaultsSortedForExplore(vaults), [vaults])

  if (!enabled || exploreVaults.length === 0) {
    return null
  }

  return (
    <Flex gap="$spacing8" pt="$spacing8" pb="$spacing16">
      <Text color="$neutral2" variant="subheading2" mx="$spacing20">
        {t('explore.earn.startEarning')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {exploreVaults.map((vault) => {
          const position = positionsByVaultId.get(vault.id)
          return (
            <Flex key={vault.id} width={CHIP_WIDTH}>
              <EarnVaultChip
                vault={vault}
                position={position}
                onPress={() =>
                  navigateToEarnVault({ analyticsEntryPoint: EarnEntryPoint.ExploreChip, vault, position })
                }
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
