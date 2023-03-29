import { H1, Stack } from 'tamagui'
import { Text } from 'ui/src'

import { useAppSelector } from '../../state'

export function HomeScreen(): JSX.Element {
  const accounts = useAppSelector((state) => state?.wallet?.accounts)

  return (
    <Stack
      alignItems="center"
      backgroundColor="$background3"
      padding="$spacing12"
      space="$spacing16">
      <H1>Uniswap Wallet</H1>
      {Object.values(accounts).map((a) => (
        <Stack
          key={a.address}
          backgroundColor="$background2"
          padding="$spacing16">
          <Text variant="bodyLarge">{a.address}</Text>
        </Stack>
      ))}
    </Stack>
  )
}
