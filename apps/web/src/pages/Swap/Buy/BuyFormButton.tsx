import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonLight, LoadingButtonSpinner } from 'components/Button'
import { useTheme } from 'lib/styled-components'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { AnimatePresence, Button, Flex, Text } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'
import { useAccount } from 'wagmi'

interface BuyFormButtonProps {
  forceDisabled?: boolean
}

export function BuyFormButton({ forceDisabled }: BuyFormButtonProps) {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const theme = useTheme()

  const { buyFormState, derivedBuyFormInfo, setBuyFormState } = useBuyFormContext()
  const { inputAmount } = buyFormState
  const { notAvailableInThisRegion, quotes, fetchingQuotes, error } = derivedBuyFormInfo

  if (!account.isConnected) {
    return (
      <ButtonLight onClick={accountDrawer.open}>
        <Trans i18nKey="common.connectWallet.button" />
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
          {notAvailableInThisRegion ? (
            <Trans i18nKey="common.notAvailableInRegion.error" />
          ) : (
            <Trans i18nKey="common.noAmount.error" />
          )}
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
      <Flex row alignItems="center" gap="$spacing12">
        <LoadingButtonSpinner opacity={fetchingQuotes ? 1 : 0} fill={theme.neutral1} />
        <AnimatePresence>
          <Flex
            animation="fastHeavy"
            enterStyle={{
              opacity: 0,
              x: -20,
            }}
          >
            <Text variant="buttonLabel1" color="$white" animation="fastHeavy" x={fetchingQuotes ? 0 : -20}>
              <Trans i18nKey="common.button.continue" />
            </Text>
          </Flex>
        </AnimatePresence>
      </Flex>
    </Button>
  )
}
