import { LinearGradient } from '@tamagui/linear-gradient'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountItem } from 'src/app/features/accounts/AccountItem'
import {
  createAndActivateAccountActions,
  createAndActivateAccountSagaName,
} from 'src/app/features/accounts/createAndActivateAccountSaga'
import { useAppDispatch } from 'src/background/store'
import { useSagaStatus } from 'src/background/utils/useSagaStatus'
import { ScrollView, Text, XStack, YStack } from 'ui/src'
import XIcon from 'ui/src/assets/icons/x.svg'
import { Flex } from 'ui/src/components/layout/Flex'
import { adjustColor, useUniconColors } from 'ui/src/components/Unicon/utils'
import { colorsDark } from 'ui/src/theme/color'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useAccounts, useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { activateAccount } from 'wallet/src/features/wallet/slice'

export function AccountSwitcherScreen(): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const activeAddress = useActiveAccountAddressWithThrow()
  const accounts = useAccounts()

  const accountAddresses = useMemo(() => {
    const addresses = Object.keys(accounts)
    addresses.sort((a: Address, b: Address) => {
      return a === activeAddress ? -1 : b === activeAddress ? 1 : 0
    })
    return addresses
  }, [accounts, activeAddress])

  const { glow } = useUniconColors(activeAddress)

  useSagaStatus(createAndActivateAccountSagaName, () => {
    navigate(-1)
  })

  const onCreateWallet = (): void => {
    dispatch(createAndActivateAccountActions.trigger())
  }

  const onClose = (): void => {
    navigate(-1)
  }

  const uniconAccentColor = adjustColor(glow, -100)

  return (
    <LinearGradient
      colors={['$background1', uniconAccentColor]}
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
          <XIcon
            color={colorsDark.textSecondary}
            height={iconSizes.icon20}
            width={iconSizes.icon20}
          />
        </Flex>
        <Flex alignItems="center" flexGrow={1}>
          <Text variant="bodyLarge">Your wallets</Text>
        </Flex>
        {/* have an invisible X component so the title is center aligned. */}
        <Flex opacity={0}>
          <XIcon
            color={colorsDark.textSecondary}
            height={iconSizes.icon20}
            width={iconSizes.icon20}
          />
        </Flex>
      </XStack>

      <ScrollView>
        <YStack>
          {accountAddresses.map((address: string) => {
            return (
              <AccountItem
                key={address}
                accentColor={glow}
                address={address}
                selected={activeAddress === address}
                onAccountSelect={(): void => {
                  dispatch(activateAccount(address))
                  navigate(-1)
                }}
              />
            )
          })}
        </YStack>
      </ScrollView>
      <Flex alignItems="center" paddingBottom="$spacing12">
        <Text color="$textSecondary" variant="bodyLarge" onPress={onCreateWallet}>
          Create another wallet
        </Text>
      </Flex>
    </LinearGradient>
  )
}
