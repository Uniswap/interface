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
import { ChainId } from 'src/constants/chains'
import { useNativeCurrencyBalance, useTokenBalance } from 'src/features/balances/hooks'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'

interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  return (
    <CenterBox flexDirection="row" justifyContent="space-between" my="md">
      <BackButton ml="lg" />
      <Box alignItems="center" flexDirection="row">
        <CurrencyLogo currency={currency} size={30} />
        <Text ml="sm" variant="h2">
          {currency.symbol ?? t('Unknown token')}
        </Text>
      </Box>
      <Box height={40} mr="lg" width={40} />
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
  const { balance: ethBalance } = useNativeCurrencyBalance(currency.chainId, activeAccount?.address)

  const { t } = useTranslation()

  const onPressBuy = () => {
    const swapFormState: SwapFormState = {
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmount: '0',
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        address: currency.isToken
          ? currency.wrapped.address
          : currencyId(NativeCurrency.onChain(ChainId.Rinkeby)),
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
        address: currency.isToken ? currency.wrapped.address : currencyId(currency),
        chainId: currency.wrapped.chainId,
      },
      [CurrencyField.OUTPUT]: null,
    }
    navigation.push(Screens.Swap, { swapFormState })
  }
  return (
    <Screen>
      <TokenDetailsHeader currency={currency} />
      <ScrollView>
        <PriceChart currency={currency} />
        <Box mt="xl">
          <Text color="gray600" mx="lg" variant="bodyMd">
            {t('Your balance')}
          </Text>
          {balance ? (
            <TokenBalanceItem currencyAmount={balance} currencyPrice={undefined} />
          ) : (
            <TokenBalanceItem currencyAmount={ethBalance} currencyPrice={undefined} />
          )}
          <Box flexDirection="row" mx="lg" my="md">
            <PrimaryButton
              flex={1}
              label={t('Buy')}
              mr="sm"
              textVariant="buttonLabelLg"
              onPress={onPressBuy}
            />
            <PrimaryButton
              flex={1}
              label={t('Sell')}
              textVariant="buttonLabelLg"
              variant="gray"
              onPress={onPressSell}
            />
          </Box>
        </Box>
      </ScrollView>
    </Screen>
  )
}
