import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { useEthBalance, useTokenBalance } from 'src/features/balances/hooks'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  return (
    <CenterBox flexDirection="row" my="md" justifyContent="space-between">
      <BackButton ml="lg" size={30} />
      <Box alignItems="center" flexDirection="row">
        <CurrencyLogo currency={currency} size={30} />
        <Text variant="h2" ml="sm">
          {currency.symbol ?? t('Unknown token')}
        </Text>
      </Box>
      <Box width={40} height={40} mr="lg" />
    </CenterBox>
  )
}

export function TokenDetailsScreen({
  route,
  navigation,
}: AppStackScreenProp<Screens.TokenDetails>) {
  const { currency } = route.params

  const activeAccount = useActiveAccount()
  const { balance } = useTokenBalance(
    currency.isToken ? currency : undefined,
    activeAccount?.address
  )
  const { balance: ethBalance } = useEthBalance(currency.chainId, activeAccount?.address)

  const { t } = useTranslation()

  const onPressBuy = () => {
    const swapFormState: SwapFormState = {
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmount: '0',
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: currency.isToken ? currency.wrapped.address : 'ETH',
        chainId: currency.wrapped.chainId,
      },
    }
    navigation.push(Screens.Swap, { swapFormState })
  }

  const onPressSell = () => {
    const swapFormState: SwapFormState = {
      exactCurrencyField: CurrencyField.INPUT,
      exactAmount: '0',
      [CurrencyField.INPUT]: {
        address: currency.isToken ? currency.wrapped.address : 'ETH',
        chainId: currency.wrapped.chainId,
      },
      [CurrencyField.OUTPUT]: null,
    }
    navigation.push(Screens.Swap, { swapFormState })
  }
  return (
    <Screen>
      <TokenDetailsHeader currency={currency} />
      <CenterBox>
        <Text variant="h4" color="gray200">
          {currency.name ?? t('Unknown token')}
        </Text>
      </CenterBox>
      <ScrollView>
        <PriceChart token={currency.wrapped} />
        <Box mt="xl">
          <Text variant="h5" color="gray200" mx="lg">
            {t('Your balance')}
          </Text>
          {balance ? (
            <TokenBalanceItem currencyAmount={balance} currencyPrice={undefined} />
          ) : (
            <TokenBalanceItem currencyAmount={ethBalance} currencyPrice={undefined} />
          )}
          <Box flexDirection="row" my="md" mx="lg">
            <PrimaryButton
              flex={1}
              label={t('Buy')}
              textVariant="buttonLabelLg"
              onPress={onPressBuy}
              mr="sm"
            />
            <PrimaryButton
              variant="gray"
              flex={1}
              label={t('Sell')}
              textVariant="buttonLabelLg"
              onPress={onPressSell}
            />
          </Box>
        </Box>
      </ScrollView>
    </Screen>
  )
}
