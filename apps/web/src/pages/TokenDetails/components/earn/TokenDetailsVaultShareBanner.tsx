import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex } from 'ui/src'
import { TokenDetailsVaultShareBanner as SharedTokenDetailsVaultShareBanner } from 'uniswap/src/components/tokenDetails/TokenDetailsVaultShareBanner'
import { currencyIdToAddress, currencyIdToChain } from 'uniswap/src/utils/currencyId'
import {
  EARN_VAULT_MODAL_QUERY_PARAM,
  EARN_VAULT_MODAL_QUERY_VALUE,
  getTokenDetailsURL,
} from 'uniswap/src/utils/linking'
import { useEvent } from 'utilities/src/react/hooks'
import type { TokenDetailsVaultShareData } from '~/pages/TokenDetails/components/earn/useTokenDetailsVaultShareData'

type TokenDetailsVaultShareBannerProps = {
  vaultShareData: TokenDetailsVaultShareData
}

export function TokenDetailsVaultShareBanner({
  vaultShareData,
}: TokenDetailsVaultShareBannerProps): JSX.Element | null {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { vault, underlyingCurrencyInfo, isLoggedIn, hasLoadedPositions, userHasPosition } = vaultShareData

  // Both CTAs route to the underlying token's TDP and auto-open the earn vault modal (see
  // TokenDetailsEarnSection, which reads ?modal=earn-vault on load).
  const goToVault = useEvent(() => {
    if (!vault) {
      return
    }
    const chainId = currencyIdToChain(vault.displayCurrencyId)
    if (!chainId) {
      return
    }
    const tokenUrl = getTokenDetailsURL({ address: currencyIdToAddress(vault.displayCurrencyId), chain: chainId })
    navigate(`${tokenUrl}?${EARN_VAULT_MODAL_QUERY_PARAM}=${EARN_VAULT_MODAL_QUERY_VALUE}`)
  })

  // Only shown to connected users — the earn vault modal's connect flow isn't wired up from this
  // banner's deep link. Wait for positions to load so we don't flash the deposit variant before
  // switching to "manage".
  if (!vault || !isLoggedIn || !hasLoadedPositions) {
    return null
  }

  return (
    <Flex width="100%" px="$spacing40" mt="$spacing24" $lg={{ px: '$padding20' }}>
      <SharedTokenDetailsVaultShareBanner
        apyPercent={vault.apyPercent}
        underlyingCurrencyInfo={underlyingCurrencyInfo}
        hasPosition={userHasPosition}
        responsive
        trailingElement={
          <Button
            size="small"
            emphasis={userHasPosition ? 'primary' : 'secondary'}
            fill={false}
            onPress={goToVault}
            $sm={{ width: '100%' }}
          >
            {userHasPosition ? t('common.manage') : t('explore.earn.startEarning')}
          </Button>
        }
      />
    </Flex>
  )
}
