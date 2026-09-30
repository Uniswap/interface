import { Platform } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Coachmark } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import {
  EARN_VAULT_CHIP_FRAME_PROPS,
  EARN_VAULT_CHIP_MAX_WIDTH,
  EarnVaultChip,
} from 'uniswap/src/features/earn/EarnVaultChip'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnVaultsSortedForExplore } from 'uniswap/src/features/earn/utils'
import { LoadingBubble } from '~/components/Tokens/loading'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultConnectFlow } from '~/features/earn/hooks/useEarnVaultConnectFlow'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'
import { useExploreEarnDeepLink } from '~/pages/Explore/hooks/useExploreEarnDeepLink'

const EARN_VAULT_CHIP_SKELETON_COUNT = 3
const EARN_VAULT_CHIP_GRID_MIN_WIDTH = 220
const EARN_VAULT_CHIP_SKELETON_TITLE_HEIGHT = 18
const EARN_VAULT_CHIP_SKELETON_SUBTITLE_HEIGHT = 16
const EARN_COACHMARK_WIDTH = 215

export function EarnVaultsSection() {
  const { t } = useTranslation()
  const { dismissCoachmark, earnSectionRef, shouldShowCoachmark } = useExploreEarnDeepLink()
  const evmAccountAddress = useActiveAddress(Platform.EVM)
  const { isLoadingVaults, positionsByVaultId, vaults } = useEarnVaults({ account: evmAccountAddress })
  const exploreVaults = useMemo(() => getEarnVaultsSortedForExplore(vaults), [vaults])
  const { closeModal, openModal, selectedVaultState } = useEarnVaultModalState()
  useLogEarnSurfaceViewed({
    entryPoint: EarnEntryPoint.ExploreChip,
    isVisible: !isLoadingVaults && exploreVaults.length > 0,
    surface: EarnAnalyticsSurface.Web,
  })

  const selectedVault = selectedVaultState?.vault ?? null
  const setSelectedVault = useCallback(
    (vault: EarnVaultInfo | null) => {
      if (vault) {
        openModal(vault)
      } else {
        closeModal()
      }
    },
    [closeModal, openModal],
  )
  const { onConnectWallet } = useEarnVaultConnectFlow({ selectedVault, setSelectedVault })

  return (
    <>
      <Flex
        width="100%"
        my="$spacing24"
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        mx="auto"
        row
        alignItems="center"
        gap="$spacing16"
        $xl={{ row: false, flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <Flex ref={earnSectionRef} minWidth={200} gap="$spacing4" $xl={{ width: '100%' }}>
          <Coachmark
            open={shouldShowCoachmark}
            onDismiss={dismissCoachmark}
            placement="top-start"
            offset={{ mainAxis: 8 }}
            title={t('explore.earn.startEarning')}
            text={t('explore.earn.coachmark.body')}
            width={EARN_COACHMARK_WIDTH}
            testID={TestID.ExploreEarnCoachmark}
          >
            <Text variant="heading3" color="$neutral1">
              {t('explore.earn.title')}
            </Text>
          </Coachmark>
          <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
            {t('explore.earn.subtitle')}
          </Text>
        </Flex>
        <Flex
          flex={1}
          gap="$spacing12"
          justifyContent="flex-end"
          $platform-web={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${EARN_VAULT_CHIP_GRID_MIN_WIDTH}px, ${EARN_VAULT_CHIP_MAX_WIDTH}px))`,
            justifyContent: 'flex-end',
          }}
          $xl={{ width: '100%', '$platform-web': { justifyContent: 'flex-start' } }}
          $md={{ '$platform-web': { gridTemplateColumns: '1fr' } }}
        >
          {isLoadingVaults
            ? Array.from({ length: EARN_VAULT_CHIP_SKELETON_COUNT }, (_, index) => (
                <EarnVaultChipSkeleton key={index} index={index} />
              ))
            : exploreVaults.map((vault) => (
                <EarnVaultChip key={vault.id} vault={vault} onPress={() => openModal(vault)} />
              ))}
        </Flex>
      </Flex>
      <EarnVaultModal
        analyticsEntryPoint={EarnEntryPoint.ExploreChip}
        vault={selectedVaultState?.vault ?? null}
        prefetchedPosition={selectedVaultState?.vault ? positionsByVaultId.get(selectedVaultState.vault.id) : undefined}
        initialView={selectedVaultState?.initialView}
        isOpen={selectedVaultState !== null}
        onClose={closeModal}
        onConnectWallet={onConnectWallet}
      />
    </>
  )
}

function EarnVaultChipSkeleton({ index }: { index: number }): JSX.Element {
  const delay = `${index * 0.1}s`

  return (
    <Flex {...EARN_VAULT_CHIP_FRAME_PROPS}>
      <LoadingBubble
        round
        height={iconSizes.icon32}
        width={iconSizes.icon32}
        delay={delay}
        containerProps={{ width: iconSizes.icon32, height: iconSizes.icon32, flexShrink: 0 }}
      />
      <Flex flex={1} gap="$spacing4" minWidth={0}>
        <LoadingBubble
          height={EARN_VAULT_CHIP_SKELETON_TITLE_HEIGHT}
          width="45%"
          delay={delay}
          containerProps={{ width: '100%' }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
        <LoadingBubble
          height={EARN_VAULT_CHIP_SKELETON_SUBTITLE_HEIGHT}
          width="70%"
          delay={delay}
          containerProps={{ width: '100%' }}
          skeletonProps={{ borderRadius: '$rounded8' }}
        />
      </Flex>
    </Flex>
  )
}
