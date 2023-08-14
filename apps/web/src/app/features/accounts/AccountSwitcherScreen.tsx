import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ScreenHeader } from 'src/app/components/layout/SreenHeader'
import { AccountItem } from 'src/app/features/accounts/AccountItem'
import { useAppDispatch, useAppSelector } from 'src/background/store'
import { useSagaStatus } from 'src/background/utils/useSagaStatus'
import { Icons, ScrollView, Text, validToken, XStack, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { useUniconColors } from 'ui/src/components/Unicon/utils'
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
  const { t } = useTranslation()

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

  return (
    <YStack
      backgroundColor="$surface1"
      gap="$spacing12"
      paddingHorizontal="$spacing12"
      paddingVertical="$spacing8">
      <ScreenHeader title={t('Your wallets')} />
      <ScrollView backgroundColor="$surface1" borderBottomEndRadius="$rounded16" height="auto">
        <YStack gap="$spacing12">
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
        <XStack alignItems="center" cursor="pointer" gap="$spacing12" marginTop="$spacing12">
          <Flex
            centered
            borderColor="$surface2"
            borderRadius="$roundedFull"
            borderWidth={1}
            height={iconSizes.icon36}
            width={iconSizes.icon36}>
            <Icons.Plus color="$neutral2" height={iconSizes.icon20} width={iconSizes.icon20} />
          </Flex>
          <Text
            color="$neutral2"
            paddingVertical="$spacing8"
            variant="bodyLarge"
            onPress={onCreateWallet}>
            Add wallet
          </Text>
        </XStack>
      </ScrollView>
    </YStack>
  )
}
