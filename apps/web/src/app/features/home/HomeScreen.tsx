import { useState } from 'react'
import { PortfolioActionButtons } from 'src/app/features/home/PortfolioActionButtons'
import { PortfolioHeader } from 'src/app/features/home/PortfolioHeader'
import { NftsTab } from 'src/app/features/nfts/NftsTab'
import { ConnectPopup } from 'src/app/features/popups/ConnectPopup'
import { selectPopupState } from 'src/app/features/popups/selectors'
import { closePopup, PopupName } from 'src/app/features/popups/slice'
import { TransactionActivity } from 'src/app/features/transactions/TransactionActivity'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { Tabs } from 'tamagui'
import { Flex, Text } from 'ui/src'
import { PortfolioBalance } from 'wallet/src/features/portfolio/PortfolioBalance'
import { TokenBalanceList } from 'wallet/src/features/portfolio/TokenBalanceList'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'

enum HomeTabs {
  Tokens = 'Tokens',
  NFTs = 'NFTs',
  Activity = 'Activity',
}

export function HomeScreen(): JSX.Element {
  const address = useActiveAccountAddressWithThrow()
  const [selectedTab, setSelectedTab] = useState<HomeTabs>(HomeTabs.Tokens)
  const dispatch = useAppDispatch()
  const { isOpen: isConnectPopupOpen } = useAppSelector(selectPopupState(PopupName.Connect))

  const onCloseConnectPopup = async (): Promise<void> => {
    await dispatch(closePopup(PopupName.Connect))
  }

  return (
    <Flex grow alignItems="center" px="$spacing16" py="$spacing8" width="100%">
      {address ? (
        <Flex grow bg="$surface1" gap="$spacing8" width="100%">
          <Flex gap="$spacing12">
            <Flex position="relative">
              <PortfolioHeader address={address} />
              {isConnectPopupOpen ? (
                <ConnectPopup right={0} top="100%" onClose={onCloseConnectPopup} />
              ) : null}
            </Flex>
            <PortfolioBalance address={address} />
            <PortfolioActionButtons />
            <Tabs
              defaultValue={HomeTabs.Tokens}
              onValueChange={(v: string): void => {
                setSelectedTab(HomeTabs[v as keyof typeof HomeTabs])
              }}>
              <Flex width="100%">
                <Tabs.List unstyled gap="$spacing16" py="$spacing8">
                  <Tabs.Tab unstyled height="auto" p="$none" value={HomeTabs.Tokens}>
                    <Text
                      color={selectedTab === HomeTabs.Tokens ? '$neutral1' : '$neutral2'}
                      variant="subheading1">
                      Tokens
                    </Text>
                  </Tabs.Tab>
                  <Tabs.Tab unstyled height="auto" p="$none" value={HomeTabs.NFTs}>
                    <Text
                      color={selectedTab === HomeTabs.NFTs ? '$neutral1' : '$neutral2'}
                      variant="subheading1">
                      NFTs
                    </Text>
                  </Tabs.Tab>
                  <Tabs.Tab unstyled height="auto" p="$none" value={HomeTabs.Activity}>
                    <Text
                      color={selectedTab === HomeTabs.Activity ? '$neutral1' : '$neutral2'}
                      variant="subheading1">
                      Activity
                    </Text>
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Content value={HomeTabs.Tokens}>
                  <TokenBalanceList owner={address} />
                </Tabs.Content>
                <Tabs.Content value={HomeTabs.NFTs}>
                  <NftsTab owner={address} />
                </Tabs.Content>
                <Tabs.Content value={HomeTabs.Activity}>
                  <TransactionActivity address={address} />
                </Tabs.Content>
              </Flex>
            </Tabs>
          </Flex>
        </Flex>
      ) : (
        <Text color="$statusCritical" variant="subheading1">
          Error loading accounts
        </Text>
      )}
    </Flex>
  )
}
