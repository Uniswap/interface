import { Currency } from '@uniswap/sdk-core'
import React, { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { HomeStackScreenProp, useHomeStackNavigation } from 'src/app/navigation/types'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Box, Flex } from 'src/components/layout'
import { ListDetailScreen } from 'src/components/layout/ListDetailScreen'
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
    <ListDetailScreen
      ItemSeparatorComponent={() => <Separator ml="md" />}
      ListEmptyComponent={
        <Box mx="md" my="sm">
          <Loading repeat={8} type="token" />
        </Box>
      }
      contentHeader={
        <Flex my="sm">
          <TotalBalance balances={balancesData} />
        </Flex>
      }
      data={balances}
      keyExtractor={(item: PortfolioBalance) => currencyId(item.amount.currency)}
      renderItem={renderItem}
      titleElement={
        <Flex centered gap="none">
          {isOtherOwner ? (
            <AddressDisplay address={owner} captionVariant="subhead" size={16} />
          ) : (
            <TotalBalance balances={balancesData} variant="subheadSmall" />
          )}
          <Text color="accentTextLightSecondary" variant="subheadSmall">
            {isOtherOwner ? t('Tokens') : t('Your tokens')}
          </Text>
        </Flex>
      }
    />
  )
}
