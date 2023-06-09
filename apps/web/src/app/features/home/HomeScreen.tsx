import { PortfolioHeader } from 'src/app/features/home/PortfolioHeader'
import { useAppDispatch } from 'src/background/store'
import { Text } from 'ui'
import { Flex } from 'ui/components/layout/Flex'
import { authActions } from 'wallet/src/features/auth/saga'
import { PortfolioBalance } from 'wallet/src/features/portfolio/PortfolioBalance'
import { TokenBalanceList } from 'wallet/src/features/portfolio/TokenBalanceList'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

export function HomeScreen(): JSX.Element {
  const address = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()

  return (
    <Flex alignItems="center" flexGrow={1} width="100%">
      {address ? (
        <Flex
          backgroundColor="$background1"
          flexGrow={1}
          gap="$spacing8"
          paddingBottom="$spacing24"
          paddingTop="$spacing8"
          width="100%">
          <PortfolioHeader
            address={address}
            onLockPress={(): void => dispatch(authActions.reset())}
          />
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
