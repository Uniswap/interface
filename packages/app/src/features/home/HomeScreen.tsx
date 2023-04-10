import { Stack } from 'tamagui'
import { Text } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { authActions } from '../auth/saga'

import { useAppDispatch, useAppSelector } from '../../state'
import { PortfolioBalance } from './PortfolioBalance'
import { TokenBalanceList } from './TokenBalanceList'

export function HomeScreen(): JSX.Element {
  const accounts = useAppSelector((state) => state?.wallet?.accounts)
  const dispatch = useAppDispatch()

  return (
    <Stack
      alignItems="center"
      backgroundColor="$background3"
      padding="$spacing12"
      space="$spacing16">
      <Text variant="headlineLarge">Uniswap Wallet</Text>
      {Object.values(accounts).map((a) => (
        <Stack
          key={a.address}
          backgroundColor="$background2"
          padding="$spacing16">
          <Text variant="bodyLarge">{a.address}</Text>
          <PortfolioBalance address={a.address} />
          <TokenBalanceList owner={a.address} />
        </Stack>
      ))}
      <Button
        onPress={(): void => {
          return dispatch(authActions.reset())
        }}>
        Lock
      </Button>
    </Stack>
  )
}
