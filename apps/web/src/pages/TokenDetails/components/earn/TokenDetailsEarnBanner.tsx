import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { TokenDetailsEarnBanner as SharedTokenDetailsEarnBanner } from 'uniswap/src/components/tokenDetails/TokenDetailsEarnBanner'
import { EarnAnalyticsSurface, EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import { EarnVaultView } from 'uniswap/src/features/earn/hooks/useEarnVaultModalFlow'
import { useLogEarnSurfaceViewed } from 'uniswap/src/features/earn/hooks/useLogEarnSurfaceViewed'
import { shouldShowTokenDetailsEarnBanner } from 'uniswap/src/features/earn/tokenDetails'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import { useEarnVaultConnectFlow } from '~/features/earn/hooks/useEarnVaultConnectFlow'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'

type TokenDetailsEarnBannerProps = {
  earnData: TokenDetailsEarnData
}

export function TokenDetailsEarnBanner({ earnData }: TokenDetailsEarnBannerProps): JSX.Element | null {
  const { t } = useTranslation()
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)
  const { balanceUsd, earnVault, projectedAnnualEarningsUsd, tokenSymbol } = earnData
  const selectedVaultMatchesPage = selectedVaultId !== null && selectedVaultId === earnVault?.id
  const modalVault = selectedVaultMatchesPage ? earnVault : null
  const { onConnectWallet } = useEarnVaultConnectFlow({
    selectedVault: modalVault?.id ?? null,
    setSelectedVault: setSelectedVaultId,
  })
  const normallyVisibleVault = shouldShowTokenDetailsEarnBanner(earnData) ? earnVault : undefined
  const canKeepOpenModalBannerVisible =
    selectedVaultMatchesPage && earnData.isLoggedIn && !earnData.hasLoadedPositions && !earnData.userHasEarnPosition
  const visibleVault = normallyVisibleVault ?? (canKeepOpenModalBannerVisible ? earnVault : undefined)
  useLogEarnSurfaceViewed({
    entryPoint: EarnEntryPoint.TokenDetailsEarnBanner,
    isVisible: !!visibleVault,
    surface: EarnAnalyticsSurface.Web,
  })

  if (!visibleVault && !modalVault) {
    return null
  }

  return (
    <>
      {visibleVault ? (
        <SharedTokenDetailsEarnBanner
          apyPercent={visibleVault.apyPercent}
          tokenSymbol={tokenSymbol}
          balanceUsd={balanceUsd}
          projectedAnnualEarningsUsd={projectedAnnualEarningsUsd}
          responsive
          trailingElement={
            <Button
              size="small"
              variant="branded"
              fill={false}
              onPress={() => setSelectedVaultId(visibleVault.id)}
              $sm={{ width: '100%' }}
            >
              {t('common.getStarted')}
            </Button>
          }
        />
      ) : null}
      <EarnVaultModal
        analyticsEntryPoint={EarnEntryPoint.TokenDetailsEarnBanner}
        vault={modalVault}
        initialView={EarnVaultView.Vault}
        isOpen={modalVault !== null}
        onClose={() => setSelectedVaultId(null)}
        onConnectWallet={onConnectWallet}
      />
    </>
  )
}
