import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { EarnVaultChip } from 'uniswap/src/features/earn/EarnVaultChip'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultConnectFlow } from '~/features/earn/hooks/useEarnVaultConnectFlow'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'

export function EarnVaultsSection() {
  const { t } = useTranslation()
  const evmAccountAddress = useActiveAddress(Platform.EVM)
  const { positionsByVaultId, vaults } = useEarnVaults({ account: evmAccountAddress })
  const { closeModal, openModal, selectedVaultState } = useEarnVaultModalState()

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
        maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
        mx="auto"
        row
        alignItems="center"
        gap="$spacing16"
        $lg={{ row: false, flexDirection: 'column', alignItems: 'flex-start' }}
      >
        <Flex minWidth={200} gap="$spacing4" $lg={{ width: '100%' }}>
          <Text variant="heading3" color="$neutral1">
            {t('explore.earn.title')}
          </Text>
          <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
            {t('explore.earn.subtitle')}
          </Text>
        </Flex>
        <Flex
          flex={1}
          row
          gap="$spacing12"
          justifyContent="flex-end"
          $lg={{ width: '100%' }}
          $md={{ flexDirection: 'column' }}
        >
          {vaults.map((vault) => (
            <EarnVaultChip
              key={vault.id}
              vault={vault}
              position={positionsByVaultId.get(vault.id)}
              onPress={() => openModal(vault)}
            />
          ))}
        </Flex>
      </Flex>
      <EarnVaultModal
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
