import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { IconButton } from 'src/components/buttons/IconButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Star } from 'src/components/icons/Star'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { ChainId } from 'src/constants/chains'
import { useSingleBalance } from 'src/features/dataApi/balances'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { addFavoriteToken, removeFavoriteToken } from 'src/features/favorites/slice'
import { CurrencyField, SwapFormState } from 'src/features/swap/swapFormSlice'
import { ElementName } from 'src/features/telemetry/constants'
import { NativeCurrency } from 'src/features/tokenLists/NativeCurrency'
import { Screens } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'

interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(currencyId(currency))

  const onFavoritePress = () => {
    if (isFavoriteToken) {
      dispatch(removeFavoriteToken({ currencyId: currencyId(currency) }))
    } else {
      dispatch(addFavoriteToken({ currencyId: currencyId(currency) }))
    }
  }

  return (
    <CenterBox flexDirection="row" justifyContent="space-between" my="md">
      <BackButton ml="lg" />
      <Flex centered row gap="sm">
        <CurrencyLogo currency={currency} size={30} />
        <Text variant="h2">{currency.symbol ?? t('Unknown token')}</Text>
      </Flex>
      <IconButton
        icon={<Star active={isFavoriteToken} size={24} />}
        mr="sm"
        variant="transparent"
        onPress={onFavoritePress}
      />
    </CenterBox>
  )
}

export function TokenDetailsScreen({
  route,
  navigation,
}: AppStackScreenProp<Screens.TokenDetails>) {
  const { currency } = route.params

  const balance = useSingleBalance(currency)

  const { t } = useTranslation()

  const onPressBuy = () => {
    const swapFormState: SwapFormState = {
      exactCurrencyField: CurrencyField.OUTPUT,
      exactAmount: '0',
      [CurrencyField.INPUT]: null,
      [CurrencyField.OUTPUT]: {
        currencyId: currency.isToken
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
        currencyId: currency.isToken ? currency.wrapped.address : currencyId(currency),
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
        <Flex gap="lg">
          <PriceChart currency={currency} />
          <Box>
            {balance && (
              <>
                <Text color="gray600" mx="lg" variant="bodyMd">
                  {t('Your balance')}
                </Text>
                <TokenBalanceItem balance={balance} />
              </>
            )}
            <Box flexDirection="row" mx="lg" my="md">
              <PrimaryButton
                flex={1}
                label={t('Buy')}
                mr="sm"
                name={ElementName.BuyToken}
                textVariant="buttonLabelLg"
                onPress={onPressBuy}
              />
              <PrimaryButton
                disabled={!balance}
                flex={1}
                label={t('Sell')}
                name={ElementName.SellToken}
                textVariant="buttonLabelLg"
                variant="gray"
                onPress={onPressSell}
              />
            </Box>
          </Box>
        </Flex>
      </ScrollView>
    </Screen>
  )
}
