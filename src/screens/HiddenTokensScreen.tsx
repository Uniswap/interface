import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useSortedPortfolioBalances } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import {
  makeSelectAccountHideSmallBalances,
  makeSelectAccountHideSpamTokens,
} from 'src/features/wallet/selectors'
import { Screens } from 'src/screens/Screens'
import { CurrencyId } from 'src/utils/currencyId'

type Props = NativeStackScreenProps<AppStackParamList, Screens.HiddenTokens>

export function HiddenTokensScreen({
  route: {
    params: { address },
  },
}: Props) {
  const { t } = useTranslation()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const hideSmallBalances = useAppSelector(makeSelectAccountHideSmallBalances(address))
  const hideSpamTokens = useAppSelector(makeSelectAccountHideSpamTokens(address))

  const { data } = useSortedPortfolioBalances(address, hideSmallBalances, hideSpamTokens)

  const onPressToken = useCallback(
    (currencyId: CurrencyId) => {
      tokenDetailsNavigation.navigate(currencyId)
    },
    [tokenDetailsNavigation]
  )

  const onPressTokenIn = useCallback(
    (currencyId: CurrencyId) => {
      tokenDetailsNavigation.preload(currencyId)
    },
    [tokenDetailsNavigation]
  )

  const sections = useMemo(() => {
    if (!data) return EMPTY_ARRAY

    return [
      { title: t('Small balances'), data: data.smallBalances },
      { title: t('Spam tokens'), data: data.spamBalances },
    ]
  }, [t, data])

  // TODO: add loading state here
  if (!data) return null

  return (
    <Screen>
      <BackHeader p="md">
        <Text variant="bodyLarge">{t('Hidden tokens')}</Text>
      </BackHeader>
      <Box flex={1} px="sm">
        <SectionList
          keyExtractor={key}
          renderItem={({ item }: { item: PortfolioBalance }) => (
            <TokenBalanceItem
              portfolioBalance={item}
              onPressToken={onPressToken}
              onPressTokenIn={onPressTokenIn}
            />
          )}
          renderSectionHeader={({ section: { title, items } }) =>
            items?.length > 0 ? <SectionHeader title={title} /> : null
          }
          sections={sections}
          showsVerticalScrollIndicator={false}
          windowSize={5}
        />
      </Box>
    </Screen>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Flex backgroundColor="background1" p="sm">
      <Text color="textSecondary" variant="subheadSmall">
        {title}
      </Text>
    </Flex>
  )
}

function key({ currencyInfo }: PortfolioBalance) {
  return currencyInfo.currencyId
}
