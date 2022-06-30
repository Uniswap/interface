import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { BackButton } from 'src/components/buttons/BackButton'
import { Box, Flex } from 'src/components/layout'
import { BackHeader } from 'src/components/layout/BackHeader'
import { HeaderListScreen } from 'src/components/layout/screens/HeaderListScreen'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { TotalBalance } from 'src/features/balances/TotalBalance'
import { useActiveChainIds } from 'src/features/chains/utils'
import { useAllBalancesByChainId } from 'src/features/dataApi/balances'
import { PortfolioBalance } from 'src/features/dataApi/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'
import { flattenObjectOfObjects } from 'src/utils/objects'

export function PortfolioTokensScreen({
  route: {
    params: { owner },
  },
}: HomeStackScreenProp<Screens.PortfolioTokens>) {
  const { t } = useTranslation()

  // TODO: Figure out how to make nav available across stacks
  const navigation = useHomeStackNavigation()
  const accountAddress = useActiveAccount()?.address
  const activeAddress = owner ?? accountAddress
  const currentChains = useActiveChainIds()
  const { balances: balancesData } = useAllBalancesByChainId(activeAddress, currentChains)

  const balances = useMemo(() => flattenObjectOfObjects(balancesData ?? {}), [balancesData])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<PortfolioBalance>) => (
      <TokenBalanceItem
        key={currencyId(item.amount.currency)}
        balance={item}
        onPressToken={(currency: Currency) =>
          navigation.navigate(Screens.TokenDetails, { currencyId: currencyId(currency) })
        }
      />
    ),
    [navigation]
  )

  const isOtherOwner = owner && owner !== accountAddress

  return (
    <HeaderListScreen
      ItemSeparatorComponent={() => <Separator ml="md" />}
      ListEmptyComponent={
        <Box mx="md" my="sm">
          <Loading repeat={8} type="token" />
        </Box>
      }
      contentHeader={
        <Flex gap="md" my="sm">
          {isOtherOwner ? (
            <BackHeader>
              <AddressDisplay address={owner} color="textSecondary" size={16} variant="subhead" />
            </BackHeader>
          ) : (
            <BackButton showButtonLabel />
          )}
          <TotalBalance balances={balancesData} />
        </Flex>
      }
      data={balances}
      fixedHeader={
        <BackHeader>
          <Flex centered gap="none">
            {isOtherOwner ? (
              <AddressDisplay address={owner} size={16} variant="subhead" />
            ) : (
              <TotalBalance balances={balancesData} variant="subheadSmall" />
            )}
            <Text color="textSecondary" variant="subheadSmall">
              {isOtherOwner ? t('Tokens') : t('Your tokens')}
            </Text>
          </Flex>
        </BackHeader>
      }
      keyExtractor={(item: PortfolioBalance) => currencyId(item.amount.currency)}
      renderItem={renderItem}
    />
  )
}
