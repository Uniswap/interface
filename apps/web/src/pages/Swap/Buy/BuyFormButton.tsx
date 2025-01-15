import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LoaderButton } from 'components/Button/LoaderButton'
import { ButtonLight } from 'components/Button/buttons'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { useTranslation } from 'react-i18next'
import { Button, Text } from 'ui/src'
import { useAccount } from 'wagmi'

interface BuyFormButtonProps {
  forceDisabled?: boolean
}

export function BuyFormButton({ forceDisabled }: BuyFormButtonProps) {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const { t } = useTranslation()

  const { buyFormState, derivedBuyFormInfo, setBuyFormState } = useBuyFormContext()
  const { inputAmount } = buyFormState
  const { notAvailableInThisRegion, quotes, fetchingQuotes, error } = derivedBuyFormInfo

  if (!account.isConnected) {
    return (
      <ButtonLight onClick={accountDrawer.open}>
        <ConnectWalletButtonText />
      </ButtonLight>
    )
  }

  if (!inputAmount || forceDisabled || notAvailableInThisRegion) {
    return (
      <Button
        key="BuyFormButton"
        disabled
        size="large"
        disabledStyle={{
          backgroundColor: '$surface3',
        }}
      >
        <Text variant="buttonLabel1">
          {notAvailableInThisRegion ? t('common.notAvailableInRegion.error') : t('common.noAmount.error')}
        </Text>
      </Button>
    )
  }

  return (
    <LoaderButton
      buttonKey="BuyFormButton"
      disabled={Boolean(fetchingQuotes || !quotes || !quotes.quotes || quotes.quotes.length === 0 || error)}
      onPress={() => {
        setBuyFormState((prev) => ({ ...prev, providerModalOpen: true }))
      }}
      loading={fetchingQuotes}
    >
      <Text variant="buttonLabel1" color="$white">
        {t('common.button.continue')}
      </Text>
    </LoaderButton>
  )
}
