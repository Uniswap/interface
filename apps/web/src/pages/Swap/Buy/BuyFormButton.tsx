import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonLight } from 'components/Button/buttons'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { Button, Flex, SpinningLoader, Text, WidthAnimator } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { AccountCTAsExperimentGroup, Experiments } from 'uniswap/src/features/gating/experiments'
import { useExperimentGroupName } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'
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

  const accountsCTAExperimentGroup = useExperimentGroupName(Experiments.AccountCTAs)
  const isSignIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.SignInSignUp
  const isLogIn = accountsCTAExperimentGroup === AccountCTAsExperimentGroup.LogInCreateAccount

  if (!account.isConnected) {
    return (
      <ButtonLight onClick={accountDrawer.open}>
        {isSignIn ? (
          <Trans i18nKey="nav.signIn.button" />
        ) : isLogIn ? (
          <Trans i18nKey="nav.logIn.button" />
        ) : (
          <Trans i18nKey="common.connectWallet.button" />
        )}
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
        <Text variant="buttonLabel1" color="$white" animation="fastHeavy" x={fetchingQuotes ? 0 : -20}>
          {t('common.button.continue')}
        </Text>
      </Flex>
    </Button>
  )
}
