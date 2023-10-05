import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { SettingsWalletRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { useAppDispatch } from 'src/background/store'
import { Button, Flex, Icons, Switch, Text } from 'ui/src'
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
    <Flex fill bg="$surface1">
      <ScreenHeader title={displayName ?? t('Wallet')} />
      <Flex grow justifyContent="space-between" p="$spacing12">
        <Flex>
          <Flex grow row justifyContent="space-between" py="$spacing12">
            <Flex>
              <Text variant="body1">{t('Edit nickname')}</Text>
              <Text variant="body3">{displayName}</Text>
            </Flex>
            <Button onPress={(): void => navigate(SettingsWalletRoutes.EditNickname.valueOf())}>
              <Icons.Pencil color="$neutral2" size="$icon.24" />
            </Button>
          </Flex>
          <Flex grow row justifyContent="space-between" py="$spacing12">
            <Flex>
              <Text variant="body1">{t('Hide unknown tokens')}</Text>
            </Flex>
            <Switch
              alignItems="center"
              backgroundColor="$surface2"
              checked={!account.showSpamTokens}
              height={32}
              p="$spacing4"
              width={48}
              onCheckedChange={handleSpamTokensToggle}>
              <Switch.Thumb backgroundColor="$DEP_accentBranded" size="$spacing24" />
            </Switch>
          </Flex>
        </Flex>
        <Button theme="dark_detrimental_Button" onPress={onPressRemoveWallet}>
          {t('Remove wallet')}
        </Button>
      </Flex>
    </Flex>
  )
}
