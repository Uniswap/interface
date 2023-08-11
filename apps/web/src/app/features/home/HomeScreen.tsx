import { useState } from 'react'
import { PortfolioHeader } from 'src/app/features/home/PortfolioHeader'
import { TransactionActivity } from 'src/app/features/transactions/TransactionActivity'
import { Tabs } from 'tamagui'
import { Text, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { PortfolioBalance } from 'wallet/src/features/portfolio/PortfolioBalance'
import { TokenBalanceList } from 'wallet/src/features/portfolio/TokenBalanceList'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

enum HomeTabs {
  Tokens = 'Tokens',
  Activity = 'Activity',
}

export function HomeScreen(): JSX.Element {
  const address = useActiveAccountAddressWithThrow()
  const [selectedTab, setSelectedTab] = useState<HomeTabs>(HomeTabs.Tokens)

  return (
    <Flex
      alignItems="center"
      flexGrow={1}
      paddingHorizontal="$spacing16"
      paddingVertical="$spacing8"
      width="100%">
      {address ? (
        <Flex backgroundColor="$surface1" flexGrow={1} gap="$spacing8" width="100%">
          <YStack gap="$spacing12">
            <PortfolioHeader address={address} />
            <PortfolioBalance address={address} />
            <Tabs
              defaultValue={HomeTabs.Tokens}
              onValueChange={(v: string): void => {
                setSelectedTab(HomeTabs[v as keyof typeof HomeTabs])
              }}>
              <YStack width="100%">
                <Tabs.List unstyled gap="$spacing16" paddingVertical="$spacing8">
                  <Tabs.Tab unstyled height="auto" padding="$none" value={HomeTabs.Tokens}>
                    <Text
                      color={selectedTab === HomeTabs.Tokens ? '$neutral1' : '$neutral2'}
                      variant="subheadLarge">
                      Tokens
                    </Text>
                  </Tabs.Tab>
                  <Tabs.Tab unstyled height="auto" padding="$none" value={HomeTabs.Activity}>
                    <Text
                      color={selectedTab === HomeTabs.Activity ? '$neutral1' : '$neutral2'}
                      variant="subheadLarge">
                      Activity
                    </Text>
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Content value={HomeTabs.Tokens}>
                  <TokenBalanceList owner={address} />
                </Tabs.Content>
                <Tabs.Content value={HomeTabs.Activity}>
                  <TransactionActivity address={address} />
                </Tabs.Content>
              </YStack>
            </Tabs>
          </YStack>
        </Flex>
      ) : (
        <Text color="$statusCritical" variant="subheadLarge">
          Error loading accounts
        </Text>
      )}
    </Flex>
  )
}
