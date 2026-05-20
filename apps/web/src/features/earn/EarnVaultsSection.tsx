import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import {
  getListEarnPositionsQueryOptions,
  getListEarnVaultsQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/earn'
import { EARN_SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/earn/constants'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { getEarnPositionInfosByVaultId, getEarnVaultInfos } from 'uniswap/src/features/earn/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { EarnVaultChip } from '~/features/earn/EarnVaultChip'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'

export function EarnVaultsSection() {
  const { t } = useTranslation()
  const evmAccount = useActiveAccount(Platform.EVM)
  const [selectedVault, setSelectedVault] = useState<EarnVaultInfo | null>(null)

  const vaultsQueryParams = useMemo(() => ({ chainIds: EARN_SUPPORTED_CHAIN_IDS }), [])
  const positionsQueryParams = useMemo(
    () => (evmAccount?.address ? { walletAddress: evmAccount.address, chainIds: EARN_SUPPORTED_CHAIN_IDS } : undefined),
    [evmAccount?.address],
  )

  const vaultsQuery = useQuery(getListEarnVaultsQueryOptions({ params: vaultsQueryParams }))
  const positionsQuery = useQuery(
    getListEarnPositionsQueryOptions({
      params: positionsQueryParams,
      enabled: !!positionsQueryParams,
    }),
  )

  const vaults = useMemo(() => getEarnVaultInfos(vaultsQuery.data?.vaults), [vaultsQuery.data?.vaults])

  const positionsByVaultId = useMemo(
    () => getEarnPositionInfosByVaultId(positionsQuery.data?.positions),
    [positionsQuery.data?.positions],
  )

  const handleClose = useCallback(() => {
    setSelectedVault(null)
  }, [])

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
            <EarnVaultChip key={vault.id} vault={vault} onPress={() => setSelectedVault(vault)} />
          ))}
        </Flex>
      </Flex>
      <EarnVaultModal
        vault={selectedVault}
        prefetchedPosition={selectedVault ? positionsByVaultId.get(selectedVault.id) : undefined}
        isOpen={selectedVault !== null}
        onClose={handleClose}
      />
    </>
  )
}
