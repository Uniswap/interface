import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { LoaderButton } from 'components/Button/LoaderButton'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { useTranslation } from 'react-i18next'
import { DeprecatedButton, Text } from 'ui/src'
import { useAccount } from 'wagmi'

interface BuyFormButtonProps {
  forceDisabled?: boolean
}

export function BuyFormButton({ forceDisabled }: BuyFormButtonProps) {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const { t } = useTranslation()

  const { buyFormState, derivedBuyFormInfo, setBuyFormState } = useBuyFormContext()
  const { inputAmount, quoteCurrency } = buyFormState
  const { notAvailableInThisRegion, quotes, fetchingQuotes, error } = derivedBuyFormInfo

  if (!account.isConnected) {
    return (
      <DeprecatedButton
        animation="fast"
        size="large"
        borderRadius="$rounded16"
        width="100%"
        pressStyle={{ scale: 0.98 }}
        opacity={1}
        onPress={accountDrawer.open}
        backgroundColor="$accent2"
        hoverStyle={{
          backgroundColor: '$accent2Hovered',
        }}
      >
        <Text variant="buttonLabel1" color="$accent1">
          <ConnectWalletButtonText />
        </Text>
      </DeprecatedButton>
    )
  }

  if (!inputAmount || forceDisabled || notAvailableInThisRegion || !quoteCurrency) {
    return (
      <DeprecatedButton
        key="BuyFormButton"
        isDisabled
        size="large"
        borderRadius="$rounded16"
        opacity={1}
        backgroundColor="surface2"
      >
        <Text variant="buttonLabel1" color="$neutral2">
          {notAvailableInThisRegion
            ? t('common.notAvailableInRegion.error')
            : quoteCurrency
              ? t('common.noAmount.error')
              : t('common.selectToken.label')}
        </Text>
      </DeprecatedButton>
    )
  }

  return (
    <LoaderButton
      buttonKey="BuyFormButton"
      isDisabled={Boolean(fetchingQuotes || !quotes || !quotes.quotes || quotes.quotes.length === 0 || error)}
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
