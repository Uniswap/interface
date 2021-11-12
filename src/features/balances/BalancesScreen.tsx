import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { ALL_ACCOUNTS, fetchBalancesActions } from 'src/features/balances/fetchBalances'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { getKeys } from 'src/utils/objects'

export function BalancesScreen() {
  const dispatch = useAppDispatch()
  const accounts = useAppSelector((state) => state.wallet.accounts)

  const chainIdToTokens = useAllTokens()

  // TODO match tokens against balances in store to get balance for each

  const onPressRefresh = () => {
    dispatch(fetchBalancesActions.trigger(ALL_ACCOUNTS))
  }

  const { t } = useTranslation()

  return (
    <Screen>
      <ScrollView>
        <Box alignItems="center">
          <Text variant="h2">{t('Tokens')}</Text>
          {getKeys(chainIdToTokens).map((chainId) => (
            <View key={chainId}>
              <Text variant="h3">{t('ChainId {{chainId}}', { chainId })}</Text>
              {Object.values(chainIdToTokens[chainId]!).map((token) => (
                <Box key={token.address}>
                  <Text>{token.symbol || token.address}</Text>
                </Box>
              ))}
            </View>
          ))}
          <Text variant="h2" mt="lg">
            {t('Accounts')}
          </Text>
          {Object.values(accounts).map((account) => (
            <Text key={account.address}>{account.address}</Text>
          ))}
          <Button label={t('Refresh')} onPress={onPressRefresh} mt="md" />
        </Box>
      </ScrollView>
    </Screen>
  )
}
