import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { useAllTokens } from 'src/features/tokens/useTokens'

type Props = NativeStackScreenProps<RootStackParamList, Screens.TokenDetails>

export function TokenDetailsScreen({ route }: Props) {
  const { tokenAddress, chainId } = route.params

  const chainIdToTokens = useAllTokens()
  const token = chainIdToTokens[chainId]?.[tokenAddress]

  if (!token) {
    // TODO show some UI instead of throwing here
    throw new Error(`Unknown token ${tokenAddress}`)
  }

  const { t } = useTranslation()

  return (
    <Screen>
      <Box alignItems="center">
        <Text variant="h3" textAlign="center">
          {t('Token {{addr}}', { addr: tokenAddress })}
        </Text>
        <Text variant="h3" mt="lg">
          {t('Name: {{name}}', { name: token.name ?? 'Unknown name' })}
        </Text>
        <Text variant="h3" mt="lg">
          {t('Symbol: {{symbol}}', { symbol: token.symbol ?? 'Unknown symbol' })}
        </Text>
      </Box>
      <PriceChart token={token} />
    </Screen>
  )
}
