import { LinearGradient } from '@tamagui/linear-gradient'
import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountItem } from 'src/app/features/accounts/AccountItem'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { useSagaStatus } from 'src/background/utils/useSagaStatus'
import { Icons, ScrollView, Text, Theme, validToken, XStack, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { adjustColor, useUniconColors } from 'ui/src/components/Unicon/utils'
import { iconSizes } from 'ui/src/theme/iconSizes'
import {
  createAccountActions,
  createAccountSagaName,
} from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  pendingAccountActions,
  PendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { selectAllAccountsSorted } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'

export function AccountSwitcherScreen(): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const activeAddress = useActiveAccountAddressWithThrow()
  const accounts = useAppSelector(selectAllAccountsSorted)
  const accountAddresses = useMemo(() => {
    const addresses = accounts
      .map((account) => account.address)
      .filter((address) => address !== activeAddress)
    return [activeAddress, ...addresses]
  }, [accounts, activeAddress])

  const { glow } = useUniconColors(activeAddress)

  const onClose = useCallback(async (): Promise<void> => {
    await dispatch(pendingAccountActions.trigger(PendingAccountActions.ActivateAndSelect))
    navigate(-1)
  }, [navigate, dispatch])

  useSagaStatus(createAccountSagaName, onClose)

  const onCreateWallet = async (): Promise<void> => {
    await dispatch(createAccountActions.trigger())
  }
  const uniconAccentColor = adjustColor(glow, -100)

  return (
    <Theme name="dark">
      <LinearGradient
        colors={['$surface2', uniconAccentColor]}
        end={[0, 0]}
        height="100%"
        start={[0, 1]}
        width="100%">
        {/* TODO: generalize into a flexible header component */}
        <XStack
          alignItems="center"
          paddingBottom="$spacing12"
          paddingHorizontal="$spacing12"
          paddingTop="$spacing16">
          <Flex onPress={onClose}>
            <Icons.X color="$textSecondary" height={iconSizes.icon20} width={iconSizes.icon20} />
          </Flex>
          <Flex alignItems="center" flexGrow={1}>
            <Text variant="bodyLarge">Your wallets</Text>
          </Flex>
          {/* have an invisible X component so the title is center aligned. */}
          <Flex opacity={0}>
            <Icons.X height={iconSizes.icon20} width={iconSizes.icon20} />
          </Flex>
        </XStack>

        <ScrollView>
          <YStack>
            {accountAddresses.map((address: string) => {
              return (
                <AccountItem
                  key={address}
                  accentColor={validToken(glow)}
                  address={address}
                  selected={activeAddress === address}
                  onAccountSelect={async (): Promise<void> => {
                    await dispatch(setAccountAsActive(address))
                    navigate(-1)
                  }}
                />
              )
            })}
          </YStack>
        </ScrollView>
        <Flex alignItems="center" cursor="pointer" paddingBottom="$spacing12">
          <Text color="$neutral2" variant="bodyLarge" onPress={onCreateWallet}>
            Create another wallet
          </Text>
        </Flex>
      </LinearGradient>
    </Theme>
  )
}
