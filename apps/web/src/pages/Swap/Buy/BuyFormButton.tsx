import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useAccount } from 'hooks/useAccount'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { useTranslation } from 'react-i18next'
import { Button, useIsShortMobileDevice, type ButtonProps } from 'ui/src'

interface BuyFormButtonProps {
  forceDisabled?: boolean
}

export function BuyFormButton({ forceDisabled }: BuyFormButtonProps) {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const { buyFormState, derivedBuyFormInfo, setBuyFormState } = useBuyFormContext()
  const { inputAmount, quoteCurrency } = buyFormState
  const { notAvailableInThisRegion, quotes, fetchingQuotes, error } = derivedBuyFormInfo

  const buttonSize: ButtonProps['size'] = isShortMobileDevice ? 'small' : 'large'

  if (!account.isConnected) {
    return (
      <Button size={buttonSize} variant="branded" emphasis="secondary" fill onPress={accountDrawer.open}>
        {t('common.connectWallet.button')}
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
