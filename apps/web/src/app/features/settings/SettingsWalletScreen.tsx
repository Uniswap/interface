import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { BackButtonHeader } from 'src/app/features/settings/BackButtonHeader'
import { SettingsWalletRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { Switch, Text, XStack, YStack } from 'ui/src'
import PencilIcon from 'ui/src/assets/icons/pencil.svg'
import { Button, LinkButton } from 'ui/src/components/button/Button'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { shortenAddress } from 'wallet/src/utils/addresses'

export function SettingsWalletScreen(): JSX.Element {
  const { address } = useParams()
  const { t } = useTranslation()
  const { navigateBack } = useExtensionNavigation()

  if (!address) {
    throw new Error('Address is required')
  }

  const ensName = undefined // TODO: Add ENS lookup logic
  const nickname = ensName || 'thomasthachil.eth' // TODO: Update after ens is defined

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUnknownTokensUpdate = (enabled: boolean): void => {
    // TODO: Dispatch update unknown tokens preference action
  }

  const onPressRemoveWallet = (): void => {
    // TODO: Dispatch remove wallet action
    navigateBack()
  }

  return (
    <YStack backgroundColor="$background0" flex={1}>
      <BackButtonHeader headerText={nickname || shortenAddress(address)} />
      <YStack flexGrow={1} justifyContent="space-between" padding="$spacing12">
        <YStack>
          <XStack flexGrow={1} justifyContent="space-between" paddingVertical="$spacing12">
            <YStack>
              <Text variant="bodyLarge">{t('Edit nickname')}</Text>
              <Text variant="bodyMicro">{nickname}</Text>
            </YStack>
            <LinkButton to={SettingsWalletRoutes.EditNickname.valueOf()}>
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
