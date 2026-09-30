import { Flex, spacing, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { useExploreSectionTitleProps } from 'src/components/explore/ExploreSections/useExploreSectionTitleProps'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnVaultChip, EarnVaultChipSkeleton } from 'uniswap/src/features/earn/EarnVaultChip'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import { getEarnVaultsSortedForExplore } from 'uniswap/src/features/earn/utils'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

const MOBILE_EARN_VAULT_CHIP_WIDTH = 224
const SKELETON_CHIP_COUNT = 3

function SectionTitle({ title }: { title: string }): JSX.Element {
  const titleProps = useExploreSectionTitleProps()
  return (
    <Text {...titleProps} mx="$spacing20">
      {title}
    </Text>
  )
}

export function StartEarningSection(): JSX.Element | null {
  const { t } = useTranslation()
  const { isTestnetModeEnabled } = useEnabledChains()
  const activeAddress = useActiveAccountAddress() ?? undefined
  const { navigateToEarnVault } = useWalletNavigation()

  const enabled = !isTestnetModeEnabled
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
      <SectionTitle title={t('explore.earn.startEarning')} />
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
      <SectionTitle title={title} />
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
