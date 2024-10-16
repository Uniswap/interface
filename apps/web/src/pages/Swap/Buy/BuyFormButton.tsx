import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonLight } from 'components/Button/buttons'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { Button, Flex, SpinningLoader, Text, WidthAnimator } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useTranslation } from 'uniswap/src/i18n'
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
    <Button
      key="BuyFormButton-animation"
      size="large"
      animation="fastHeavy"
      disabled={Boolean(fetchingQuotes || !quotes || !quotes.quotes || quotes.quotes.length === 0 || error)}
      onPress={() => {
        setBuyFormState((prev) => ({ ...prev, providerModalOpen: true }))
      }}
    >
      <Flex row alignItems="center" gap="$spacing8">
        <WidthAnimator open={fetchingQuotes} height={iconSizes.icon24}>
          <Flex justifyContent="center" alignItems="center" width={iconSizes.icon24}>
            <SpinningLoader color="$white" />
          </Flex>
        </WidthAnimator>
        <Text variant="buttonLabel1" color="$white" animation="fastHeavy">
          {t('common.button.continue')}
        </Text>
      </Flex>
    </Button>
  )
}
