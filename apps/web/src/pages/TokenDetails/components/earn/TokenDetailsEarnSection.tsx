import { Platform } from '@universe/chains'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { TestID } from '@universe/test'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { TokenDetailsEarnSection as SharedTokenDetailsEarnSection } from 'uniswap/src/components/tokenDetails/TokenDetailsEarnSection'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { useEarnLifetimeEarningsUsd } from 'uniswap/src/features/earn/hooks/useEarnLifetimeEarningsUsd'
import { EARN_VAULT_MODAL_QUERY_PARAM, EARN_VAULT_MODAL_QUERY_VALUE } from 'uniswap/src/utils/linking'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultConnectFlow } from '~/features/earn/hooks/useEarnVaultConnectFlow'
import { useEarnVaultModalState } from '~/features/earn/hooks/useEarnVaultModalState'
import {
  EARN_ENTRY_POINT_QUERY_PARAM,
  parseEarnEntryPointQuery,
} from '~/pages/TokenDetails/components/earn/earnEntryPointQuery'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'

type TokenDetailsEarnSectionProps = {
  earnData: TokenDetailsEarnData
}

export function TokenDetailsEarnSection({ earnData }: TokenDetailsEarnSectionProps): JSX.Element | null {
  const { closeModal, openDepositModal, openModal, openWithdrawModal, selectedVaultState } = useEarnVaultModalState()
  const [searchParams, setSearchParams] = useSearchParams()
  const shouldAutoOpenModal = searchParams.get(EARN_VAULT_MODAL_QUERY_PARAM) === EARN_VAULT_MODAL_QUERY_VALUE
  const modalAnalyticsEntryPoint =
    parseEarnEntryPointQuery(searchParams.get(EARN_ENTRY_POINT_QUERY_PARAM)) ?? EarnEntryPoint.TokenDetailsEarnSection
  const selectedVault = selectedVaultState?.vault ?? null
  const setSelectedVaultState = useCallback(
    (state: typeof selectedVaultState): void => {
      if (state) {
        const { vault, ...options } = state
        openModal(vault, options)
      } else {
        closeModal()
      }
    },
    [closeModal, openModal],
  )
  const { onConnectWallet } = useEarnVaultConnectFlow({
    selectedVault: selectedVaultState,
    setSelectedVault: setSelectedVaultState,
  })

  const { earnPosition, earnVault, refetch, showEarnError, userHasEarnPosition } = earnData

  // ListEarnPositions has no lifetime PnL, so fetch it per-vault (same pattern as the Portfolio section).
  const evmAccountAddress = useActiveAddress(Platform.EVM)
  const lifetimeEarningsVaults = useMemo(
    () => (earnVault && userHasEarnPosition ? [earnVault] : []),
    [earnVault, userHasEarnPosition],
  )
  const {
    lifetimeEarningsUsd,
    isLoading: isLoadingLifetimeEarnings,
    isError: lifetimeEarningsError,
  } = useEarnLifetimeEarningsUsd({
    walletAddress: evmAccountAddress,
    vaults: lifetimeEarningsVaults,
  })

  // Auto-open the modal when deep-linked via ?modal=earn-vault (e.g., from the extension's
  // earn positions list). Waits for `earnVault` to load before opening, then strips the param
  // so refresh/back-nav doesn't re-trigger.
  useEffect(() => {
    if (!shouldAutoOpenModal || !earnVault) {
      return
    }
    openModal(earnVault, { analyticsEntryPoint: modalAnalyticsEntryPoint })
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete(EARN_VAULT_MODAL_QUERY_PARAM)
        next.delete(EARN_ENTRY_POINT_QUERY_PARAM)
        return next
      },
      { replace: true },
    )
  }, [shouldAutoOpenModal, earnVault, modalAnalyticsEntryPoint, openModal, setSearchParams])

  if (!earnVault) {
    return null
  }

  return (
    <>
      {earnPosition && userHasEarnPosition ? (
        <SharedTokenDetailsEarnSection
          earnVault={earnVault}
          earnPosition={earnPosition}
          lifetimeEarningsUsd={isLoadingLifetimeEarnings ? undefined : lifetimeEarningsUsd}
          lifetimeEarningsError={lifetimeEarningsError}
          onPositionPress={(vault) => openModal(vault, { analyticsEntryPoint: EarnEntryPoint.TokenDetailsEarnSection })}
          onWithdrawPress={(vault) =>
            openWithdrawModal(vault, { analyticsEntryPoint: EarnEntryPoint.TokenDetailsEarnSection })
          }
          onDepositPress={(vault) =>
            openDepositModal(vault, { analyticsEntryPoint: EarnEntryPoint.TokenDetailsEarnSection })
          }
        />
      ) : showEarnError ? (
        <TokenDetailsEarnErrorSection onRetry={refetch} />
      ) : null}

      <EarnVaultModal
        analyticsEntryPoint={selectedVaultState?.analyticsEntryPoint ?? EarnEntryPoint.TokenDetailsEarnSection}
        vault={selectedVault}
        prefetchedPosition={selectedVaultState ? earnPosition : undefined}
        initialView={selectedVaultState?.initialView}
        isOpen={selectedVaultState !== null}
        onClose={closeModal}
        onConnectWallet={onConnectWallet}
      />
    </>
  )
}

function TokenDetailsEarnErrorSection({ onRetry }: { onRetry: () => void }): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing8" width="100%" testID={TestID.EarnBalanceError}>
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="body1" color="$neutral1">
          {t('explore.earn.title')}
        </Text>
        <AlertTriangleFilled color="$neutral2" size="$icon.20" />
      </Flex>
      <Text variant="body3" color="$neutral2">
        {t('portfolio.overview.earn.errorLoadingBalance')}
      </Text>
      <TouchableArea testID={TestID.EarnBalanceErrorRetry} onPress={onRetry}>
        <Text variant="body3" color="$neutral1">
          {t('common.button.tryAgain')}
        </Text>
      </TouchableArea>
    </Flex>
  )
}
