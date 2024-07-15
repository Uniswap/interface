import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonLight, ButtonPrimary, LoadingButtonSpinner } from 'components/Button'
import { useTheme } from 'lib/styled-components'
import { useBuyFormContext } from 'pages/Swap/Buy/BuyFormContext'
import { useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Flex } from 'ui/src'
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

  const buyButtonState = useMemo(() => {
    if (!account.isConnected) {
      return {
        label: <Trans i18nKey="common.connectWallet.button" />,
        disabled: false,
        onClick: accountDrawer.open,
        Component: ButtonLight,
      }
    }
    if (!inputAmount || forceDisabled) {
      return {
        label: <Trans i18nKey="common.noAmount.error" />,
        disabled: true,
        onClick: undefined,
        Component: ButtonPrimary,
      }
    }

    if (notAvailableInThisRegion) {
      return {
        label: <Trans i18nKey="common.notAvailableInRegion.error" />,
        disabled: true,
        onClick: undefined,
        Component: ButtonPrimary,
      }
    }

    return {
      label: (
        <Flex row alignItems="center" gap="$spacing12">
          {fetchingQuotes && <LoadingButtonSpinner fill={theme.neutral2} />}
          <Trans i18nKey="common.continue.button" />
        </Flex>
      ),
      disabled: Boolean(fetchingQuotes || !quotes || !quotes.quotes || quotes.quotes.length === 0 || error),
      Component: ButtonPrimary,
      onClick: () => {
        setBuyFormState((prev) => ({ ...prev, providerModalOpen: true }))
      },
    }
  }, [
    account.isConnected,
    inputAmount,
    forceDisabled,
    notAvailableInThisRegion,
    theme.neutral2,
    fetchingQuotes,
    quotes,
    error,
    accountDrawer.open,
    setBuyFormState,
  ])

  return (
    <buyButtonState.Component fontWeight={535} disabled={buyButtonState.disabled} onClick={buyButtonState.onClick}>
      {buyButtonState.label}
    </buyButtonState.Component>
  )
}
