import { useState } from 'react'
import { PortfolioHeader } from 'src/app/features/home/PortfolioHeader'
import { TransactionActivity } from 'src/app/features/transactions/TransactionActivity'
import { useAppDispatch } from 'src/background/store'
import { Tabs } from 'tamagui'
import { Text, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { authActions } from 'wallet/src/features/auth/saga'
import { PortfolioBalance } from 'wallet/src/features/portfolio/PortfolioBalance'
import { TokenBalanceList } from 'wallet/src/features/portfolio/TokenBalanceList'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

enum HomeTabs {
  Tokens = 'Tokens',
  Activity = 'Activity',
}

export function HomeScreen(): JSX.Element {
  const address = useActiveAccountAddressWithThrow()
  const dispatch = useAppDispatch()

  const [selectedTab, setSelectedTab] = useState<HomeTabs>(HomeTabs.Tokens)

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
            onLockPress={(): void => {
              dispatch(authActions.reset())
            }}
          />
          <PortfolioBalance address={address} />
          <Tabs
            defaultValue={HomeTabs.Tokens}
            onValueChange={(v: string): void => {
              setSelectedTab(HomeTabs[v as keyof typeof HomeTabs])
            }}>
            <YStack>
              <Flex flex={1} marginHorizontal="$spacing12" marginTop="$spacing16">
                <Tabs.List unstyled>
                  <Tabs.Tab unstyled backgroundColor={undefined} value={HomeTabs.Tokens}>
                    <Text
                      color={selectedTab === HomeTabs.Tokens ? '$textPrimary' : '$textSecondary'}
                      variant="subheadSmall">
                      Tokens
                    </Text>
                  </Tabs.Tab>
                  <Tabs.Tab unstyled backgroundColor={undefined} value={HomeTabs.Activity}>
                    <Text
                      color={selectedTab === HomeTabs.Activity ? '$textPrimary' : '$textSecondary'}
                      variant="subheadSmall">
                      Activity
                    </Text>
                  </Tabs.Tab>
                </Tabs.List>
              </Flex>

              <Tabs.Content value={HomeTabs.Tokens}>
                <TokenBalanceList owner={address} />
              </Tabs.Content>
              <Tabs.Content value={HomeTabs.Activity}>
                <TransactionActivity address={address} />
              </Tabs.Content>
            </YStack>
          </Tabs>
        </Flex>
      ) : (
        <Text color="$accentCritical" variant="subheadLarge">
          Error loading accounts
        </Text>
      )}
    </Flex>
  )
}
