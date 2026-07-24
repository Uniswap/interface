import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { Flex, Text } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnVaultChip, EarnVaultChipSkeleton } from 'uniswap/src/features/earn/EarnVaultChip'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import { getEarnVaultsSortedForExplore } from 'uniswap/src/features/earn/utils'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const MOBILE_EARN_VAULT_CHIP_WIDTH = 224
const SKELETON_CHIP_COUNT = 3

export function StartEarningSection(): JSX.Element | null {
  const { t } = useTranslation()
  const isEarnEnabled = useIsEarnEnabled()
  const { isTestnetModeEnabled } = useEnabledChains()
  const activeAddress = useActiveAccountAddress() ?? undefined
  const { navigateToEarnVault } = useWalletNavigation()

  const enabled = isEarnEnabled && !isTestnetModeEnabled
  const { vaults, positionsByVaultId, isLoadingVaults } = useEarnVaults({ account: activeAddress, enabled })
  const exploreVaults = useMemo(() => getEarnVaultsSortedForExplore(vaults), [vaults])
  useLogEarnSurfaceViewed({
    entryPoint: EarnEntryPoint.ExploreChip,
    isVisible: enabled && exploreVaults.length > 0,
    surface: EarnAnalyticsSurface.Mobile,
  })

  if (!enabled) {
    return null
  }

  if (isLoadingVaults) {
    return <StartEarningSectionSkeleton title={t('explore.earn.startEarning')} />
  }

  if (exploreVaults.length === 0) {
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
            <Flex key={vault.id} width={MOBILE_EARN_VAULT_CHIP_WIDTH}>
              <EarnVaultChip
                vault={vault}
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

function StartEarningSectionSkeleton({ title }: { title: string }): JSX.Element {
  return (
    <Flex gap="$spacing8" pt="$spacing8" pb="$spacing16" testID={TestID.StartEarningSectionSkeleton}>
      <Text color="$neutral2" variant="subheading2" mx="$spacing20">
        {title}
      </Text>
      <ScrollView
        horizontal
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {new Array(SKELETON_CHIP_COUNT).fill(null).map((_, i) => (
          <Flex key={i} width={MOBILE_EARN_VAULT_CHIP_WIDTH}>
            <EarnVaultChipSkeleton />
          </Flex>
        ))}
      </ScrollView>
    </Flex>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: spacing.spacing8,
    paddingHorizontal: spacing.spacing12,
  },
})
