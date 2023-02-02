import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList } from 'react-native'
import { useAppSelector } from 'src/app/hooks'
import { AppStackParamList } from 'src/app/navigation/types'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Screen } from 'src/components/layout/Screen'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { useTokenDetailsNavigation } from 'src/components/TokenDetails/hooks'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { isNonPollingRequestInFlight } from 'src/data/utils'
import { useSortedPortfolioBalances } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import {
  makeSelectAccountHideSmallBalances,
  makeSelectAccountHideSpamTokens,
} from 'src/features/wallet/selectors'
import { Screens } from 'src/screens/Screens'
import { CurrencyId } from 'src/utils/currencyId'
import { useSuspendUpdatesWhenBlured } from 'src/utils/hooks'

type Props = NativeStackScreenProps<AppStackParamList, Screens.HiddenTokens>

export function HiddenTokensScreen({
  route: {
    params: { address },
  },
}: Props): JSX.Element {
  const { t } = useTranslation()
  const tokenDetailsNavigation = useTokenDetailsNavigation()
  const hideSmallBalances = useAppSelector<boolean>(makeSelectAccountHideSmallBalances(address))
  const hideSpamTokens = useAppSelector<boolean>(makeSelectAccountHideSpamTokens(address))

  const { data, networkStatus, refetch } = useSuspendUpdatesWhenBlured(
    useSortedPortfolioBalances(address, /*shouldPoll=*/ true, hideSmallBalances, hideSpamTokens)
  )

  const onPressToken = useCallback(
    (currencyId: CurrencyId) => {
      tokenDetailsNavigation.preload(currencyId)
      tokenDetailsNavigation.navigate(currencyId)
    },
    [tokenDetailsNavigation]
  )

  const sections = useMemo(() => {
    if (!data) return EMPTY_ARRAY

    return [
      ...(data.smallBalances.length > 0
        ? [{ title: t('Small balances'), data: data.smallBalances }]
        : EMPTY_ARRAY),
      ...(data.spamBalances.length > 0
        ? [{ title: t('Unknown tokens'), data: data.spamBalances }]
        : EMPTY_ARRAY),
    ]
  }, [t, data])

  return (
    <Screen>
      <BackHeader p="md">
        <Text variant="bodyLarge">{t('Hidden tokens')}</Text>
      </BackHeader>
      <Box flex={1} px="lg">
        {!data ? (
          isNonPollingRequestInFlight(networkStatus) ? (
            <Loader.Token repeat={4} />
          ) : (
            <BaseCard.ErrorState
              retryButtonLabel="Retry"
              title={t("Couldn't load token balances")}
              onRetry={(): void => refetch?.()}
            />
          )
        ) : (
          <SectionList
            keyExtractor={key}
            renderItem={({ item }: { item: PortfolioBalance }): JSX.Element => (
              <TokenBalanceItem
                isWarmLoading={false}
                portfolioBalance={item}
                onPressToken={onPressToken}
              />
            )}
            renderSectionHeader={({ section: { title } }): JSX.Element => (
              <SectionHeader title={title} />
            )}
            sections={sections}
            showsVerticalScrollIndicator={false}
            windowSize={5}
          />
        )}
      </Box>
    </Screen>
  )
}

function SectionHeader({ title }: { title: string }): JSX.Element {
  return (
    <Flex backgroundColor="background0" py="sm">
      <Text color="textSecondary" variant="subheadSmall">
        {title}
      </Text>
    </Flex>
  )
}

function key({ currencyInfo }: PortfolioBalance): CurrencyId {
  return currencyInfo.currencyId
}
