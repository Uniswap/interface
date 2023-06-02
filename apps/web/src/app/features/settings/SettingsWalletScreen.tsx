import { useTranslation } from 'react-i18next'
import { BackButtonHeader } from 'src/app/features/settings/BackButtonHeader'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Switch, Text, XStack, YStack } from 'ui/src'
import PencilIcon from 'ui/src/assets/icons/pencil.svg'
import { Button, LinkButton } from 'ui/src/components/button/Button'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { shortenAddress } from 'wallet/src/utils/addresses'

export function SettingsWalletScreen(): JSX.Element {
  const { t } = useTranslation()
  const { navigateBack, navigateTo } = useExtensionNavigation()
  const activeAccount = useActiveAccountWithThrow() // TODO: pass in address through navigation since this doesn't have to be active account at all times
  const address = activeAccount.address
  const ensName = undefined // TODO: Add ENS lookup logic
  const nickname = ensName || activeAccount.name || 'thomasthachil.eth' // TODO: Update after ens is defined

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUnknownTokensUpdate = (enabled: boolean): void => {
    // TODO: Dispatch update unknown tokens preference action
  }

  const onPressRemoveWallet = (): void => {
    // TODO: Dispatch remove wallet action
    navigateBack()
  }

  return (
    <YStack backgroundColor="$background0" flexGrow={1} padding="$spacing12">
      <BackButtonHeader headerText={nickname || shortenAddress(address)} />
      <YStack flexGrow={1} justifyContent="space-between" padding="$spacing12">
        <YStack>
          <XStack flexGrow={1} justifyContent="space-between" paddingVertical="$spacing12">
            <YStack>
              <Text variant="bodyLarge">{t('Edit nickname')}</Text>
              <Text variant="bodyMicro">{nickname}</Text>
            </YStack>
            <LinkButton
              to={`settings/wallet:${address}/editNickname`}
              onPress={(): void => navigateTo(`settings/wallet:${address}/editNickname`)}>
              <PencilIcon height={iconSizes.icon24} width={iconSizes.icon24} />
            </LinkButton>
          </XStack>
          <XStack flexGrow={1} justifyContent="space-between" paddingVertical="$spacing12">
            <YStack>
              <Text variant="bodyLarge">{t('Hide unknown tokens')}</Text>
            </YStack>
            <Switch
              alignItems="center"
              backgroundColor="$background2"
              height={32}
              padding="$spacing4"
              width={48}
              onCheckedChange={(value): void => handleUnknownTokensUpdate(value)}>
              <Switch.Thumb backgroundColor="$accentBranded" size="$spacing24" />
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
