import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useConnectionStatus } from 'features/accounts/store/hooks'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { useTranslation } from 'react-i18next'
import { Button, type ButtonProps, useIsShortMobileDevice } from 'ui/src'
import { MAINNET_CHAIN_INFO } from 'uniswap/src/features/chains/evm/info/mainnet'
import { SOLANA_CHAIN_INFO } from 'uniswap/src/features/chains/svm/info/solana'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useIsMissingPlatformWallet } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/hooks/useIsMissingPlatformWallet'

interface BuyFormButtonProps {
  forceDisabled?: boolean
}

export function BuyFormButton({ forceDisabled }: BuyFormButtonProps) {
  const isDisconnected = useConnectionStatus('aggregate').isDisconnected
  const accountDrawer = useAccountDrawer()
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const { buyFormState, derivedBuyFormInfo, setBuyFormState } = useBuyFormContext()
  const { inputAmount, quoteCurrency } = buyFormState

  const { notAvailableInThisRegion, quotes, fetchingQuotes, error } = derivedBuyFormInfo
  const chainId = quoteCurrency?.currencyInfo?.currency.chainId
  const isMissingPlatformWallet = useIsMissingPlatformWallet(chainId)

  const buttonSize: ButtonProps['size'] = isShortMobileDevice ? 'small' : 'large'

  if (isDisconnected || isMissingPlatformWallet) {
    return (
      <Button size={buttonSize} variant="branded" emphasis="secondary" fill onPress={accountDrawer.open}>
        {isMissingPlatformWallet
          ? t('common.connectTo', {
              platform: chainId && isSVMChain(chainId) ? SOLANA_CHAIN_INFO.name : MAINNET_CHAIN_INFO.name,
            })
          : t('common.connectWallet.button')}
      </Button>
    )
  }

  if (!inputAmount || forceDisabled || notAvailableInThisRegion || !quoteCurrency) {
    return (
      <Button size={buttonSize} key="BuyFormButton" isDisabled>
        {notAvailableInThisRegion
          ? t('common.notAvailableInRegion.error')
          : quoteCurrency
            ? t('common.noAmount.error')
            : t('common.selectToken.label')}
      </Button>
    )
  }

  return (
    <Button
      size={buttonSize}
      variant="branded"
      loading={fetchingQuotes}
      key="BuyFormButton"
      isDisabled={Boolean(fetchingQuotes || !quotes || !quotes.quotes || quotes.quotes.length === 0 || error)}
      onPress={() => {
        setBuyFormState((prev) => ({ ...prev, providerModalOpen: true }))
      }}
    >
      {t('common.button.continue')}
    </Button>
  )
}
