import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'ui/src'
import { TokenDetailsEarnBanner as SharedTokenDetailsEarnBanner } from 'uniswap/src/components/tokenDetails/TokenDetailsEarnBanner'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { EarnVaultModal } from '~/features/earn/EarnVaultModal'
import type { TokenDetailsEarnData } from '~/pages/TokenDetails/components/earn/useTokenDetailsEarnData'

type TokenDetailsEarnBannerProps = {
  earnData: TokenDetailsEarnData
}

export function TokenDetailsEarnBanner({ earnData }: TokenDetailsEarnBannerProps): JSX.Element | null {
  const { t } = useTranslation()
  const [selectedVault, setSelectedVault] = useState<EarnVaultInfo | null>(null)
  const {
    balanceUsd,
    earnVault,
    hasLoadedPositions,
    isLoggedIn,
    projectedAnnualEarningsUsd,
    tokenSymbol,
    userHasEarnPosition,
  } = earnData

  if (!isLoggedIn || !earnVault || !hasLoadedPositions || userHasEarnPosition) {
    return null
  }

  return (
    <>
      <SharedTokenDetailsEarnBanner
        apyPercent={earnVault.apyPercent}
        tokenSymbol={tokenSymbol}
        balanceUsd={balanceUsd}
        projectedAnnualEarningsUsd={projectedAnnualEarningsUsd}
        responsive
        trailingElement={
          <Button
            size="small"
            variant="branded"
            fill={false}
            onPress={() => setSelectedVault(earnVault)}
            $sm={{ width: '100%' }}
          >
            {t('common.getStarted')}
          </Button>
        }
      />
      <EarnVaultModal vault={selectedVault} isOpen={selectedVault !== null} onClose={() => setSelectedVault(null)} />
    </>
  )
}
