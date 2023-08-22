import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ScreenHeader } from 'src/app/components/layout/SreenHeader'
import { SettingsWalletRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { useAppDispatch } from 'src/background/store'
import { Button, Icons, Switch, Text, XStack, YStack } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import {
  EditAccountAction,
  editAccountActions,
} from 'wallet/src/features/wallet/accounts/editAccountSaga'
import { useAccount, useDisplayName } from 'wallet/src/features/wallet/hooks'

export function SettingsWalletScreen(): JSX.Element {
  const { address } = useParams()
  if (!address) throw new Error('Address not found in route params')

  return <WalletScreenContent address={address} />
}

function WalletScreenContent({ address }: { address: Address }): JSX.Element {
  const { t } = useTranslation()
  const { navigateBack } = useExtensionNavigation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const account = useAccount(address)
  const displayName = useDisplayName(address)?.name

  const handleSpamTokensToggle = async (): Promise<void> => {
    await dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.ToggleShowSpamTokens,
        address,
        enabled: !account.showSpamTokens,
      })
    )
  }

  const onPressRemoveWallet = (): void => {
    // TODO: Add warning before removing wallet to make sure last wallet is not removed
    // dispatch(
    //   editAccountActions.trigger({
    //     type: EditAccountAction.Remove,
    //     address,
    //     // TODO: Add firebase notifications enabled if we add notifications
    //   })
    // )
    navigateBack()
  }

  return (
    <YStack backgroundColor="$surface1" flex={1}>
      <ScreenHeader title={displayName ?? t('Wallet')} />
      <YStack flexGrow={1} justifyContent="space-between" padding="$spacing12">
        <YStack>
          <XStack flexGrow={1} justifyContent="space-between" paddingVertical="$spacing12">
            <YStack>
              <Text variant="bodyLarge">{t('Edit nickname')}</Text>
              <Text variant="bodyMicro">{displayName}</Text>
            </YStack>
            <Button onPress={(): void => navigate(SettingsWalletRoutes.EditNickname.valueOf())}>
              <Icons.Pencil color="$neutral2" height={iconSizes.icon24} width={iconSizes.icon24} />
            </Button>
          </XStack>
          <XStack flexGrow={1} justifyContent="space-between" paddingVertical="$spacing12">
            <YStack>
              <Text variant="bodyLarge">{t('Hide unknown tokens')}</Text>
            </YStack>
            <Switch
              alignItems="center"
              backgroundColor="$surface2"
              checked={!account.showSpamTokens}
              height={32}
              padding="$spacing4"
              width={48}
              onCheckedChange={handleSpamTokensToggle}>
              <Switch.Thumb backgroundColor="$DEP_accentBranded" size="$spacing24" />
            </Switch>
          </XStack>
        </YStack>
        <Button theme="dark_detrimental_Button" onPress={onPressRemoveWallet}>
          {t('Remove wallet')}
        </Button>
      </YStack>
    </YStack>
  )
}
