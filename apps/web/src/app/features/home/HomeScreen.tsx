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
    <Flex alignItems="center" flexGrow={1} width="100%">
      {address ? (
        <Flex
          backgroundColor="$DEP_background1"
          flexGrow={1}
          gap="$spacing8"
          paddingBottom="$spacing24"
          paddingTop="$spacing8"
          width="100%">
          <PortfolioHeader address={address} />
          <PortfolioBalance address={address} />
          <Tabs
            defaultValue={HomeTabs.Tokens}
            onValueChange={(v: string): void => {
              setSelectedTab(HomeTabs[v as keyof typeof HomeTabs])
            }}>
            <YStack width="100%">
              <Flex flex={1} marginHorizontal="$spacing12" marginTop="$spacing16">
                <Tabs.List unstyled>
                  <Tabs.Tab unstyled backgroundColor={undefined} value={HomeTabs.Tokens}>
                    <Text
                      color={
                        selectedTab === HomeTabs.Tokens ? '$DEP_textPrimary' : '$DEP_textSecondary'
                      }
                      variant="subheadSmall">
                      Tokens
                    </Text>
                  </Tabs.Tab>
                  <Tabs.Tab unstyled backgroundColor={undefined} value={HomeTabs.Activity}>
                    <Text
                      color={
                        selectedTab === HomeTabs.Activity
                          ? '$DEP_textPrimary'
                          : '$DEP_textSecondary'
                      }
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
        <Text color="$DEP_accentCritical" variant="subheadLarge">
          Error loading accounts
        </Text>
      )}
    </Flex>
  )
}
