import { Text } from 'ui/src'

import { Flex } from 'ui/src/components/layout/Flex'
import { PortfolioBalance } from 'wallet/src/features/home/PortfolioBalance'
import { PortfolioHeader } from 'wallet/src/features/home/PortfolioHeader'
import { TokenBalanceList } from 'wallet/src/features/home/TokenBalanceList'
import { useAppSelector } from '../../state'

export function HomeScreen(): JSX.Element {
  const accounts = useAppSelector((state) => state?.wallet?.accounts)
  const account = Object.values(accounts)?.[0]
  const address = account?.address

  return (
    <Flex
      alignItems="center"
      backgroundColor="$background2"
      flexGrow={1}
      padding="$spacing12"
      width="100%">
      {address ? (
        <Flex
          backgroundColor="$background1"
          borderRadius="$rounded16"
          flexGrow={1}
          gap="$spacing8"
          paddingBottom="$spacing24"
          paddingTop="$spacing8"
          width="100%">
          <PortfolioHeader address={address} />
          <PortfolioBalance address={address} />
          <TokenBalanceList owner={address} />
        </Flex>
      ) : (
        <Text color="$accentCritical" variant="subheadLarge">
          Error loading accounts
        </Text>
      )}
    </Flex>
  )
}
