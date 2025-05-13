import { GenericPasskeyMenuModal, PasskeyMenuModalState } from 'components/AccountDrawer/PasskeyMenu/PasskeyMenuModal'
import { useAccount } from 'hooks/useAccount'
import { usePasskeyAuthWithHelpModal } from 'hooks/usePasskeyAuthWithHelpModal'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Loader, Text, TouchableArea } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { Cloud } from 'ui/src/components/icons/Cloud'
import { Mobile } from 'ui/src/components/icons/Mobile'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { colors } from 'ui/src/theme'
import { AuthenticatorAttachment, registerNewAuthenticator } from 'uniswap/src/features/passkey/embeddedWallet'
import { useUnitagByAddress } from 'uniswap/src/features/unitags/hooks'

export function AddPasskeyMenu({
  show,
  setPasskeyMenuModalState,
  refreshAuthenticators,
  credential,
  numAuthenticators,
}: {
  show: boolean
  setPasskeyMenuModalState: Dispatch<SetStateAction<PasskeyMenuModalState | undefined>>
  refreshAuthenticators: () => void
  credential?: string
  numAuthenticators: number
}) {
  const { t } = useTranslation()
  const account = useAccount()
  const { unitag, loading: unitagLoading } = useUnitagByAddress(account.address)
  const newPasskeyUsername = unitag?.username ? `${unitag.username} (${numAuthenticators + 1})` : undefined

  const { mutate: registerAuthenticator } = usePasskeyAuthWithHelpModal(
    async (authenticatorAttachment: AuthenticatorAttachment) => {
      await registerNewAuthenticator({
        authenticatorAttachment,
        existingCredential: credential,
        username: newPasskeyUsername,
      })
    },
    {
      onSettled: async () => {
        await refreshAuthenticators()
        setPasskeyMenuModalState(undefined)
      },
    },
  )

  return (
    <GenericPasskeyMenuModal show={show} onClose={() => setPasskeyMenuModalState(undefined)}>
      <Flex
        alignItems="center"
        justifyContent="center"
        background="$surface2"
        borderRadius="$rounded12"
        p="$padding12"
        width="min-content"
      >
        <Passkey size="$icon.24" color="$neutral1" />
      </Flex>
      <Flex gap="$gap8" pb="$padding8">
        <Text textAlign="center" variant="subheading1">
          {t('common.passkeys.add')}
        </Text>
        <Text textAlign="center" variant="body3" color="$neutral2">
          {t('common.passkeys.add.description')}
        </Text>
      </Flex>
      <TouchableArea
        onPress={() => registerAuthenticator(AuthenticatorAttachment.PLATFORM)}
        width="100%"
        disabled={unitagLoading}
      >
        {unitagLoading ? (
          <Loader.Box height={40} width={250} />
        ) : (
          <Flex row gap="$gap12" justifyContent="center" alignItems="center" width="100%" {...ClickableTamaguiStyle}>
            <Flex p="$padding6" background={colors.pinkLight} borderRadius="$rounded6" height="min-content">
              <Cloud size="$icon.20" color="$accent1" />
            </Flex>
            <Flex>
              <Text variant="body2">{t('common.device')}</Text>
              <Text variant="body3" color="$neutral2">
                {t('account.passkey.type.platform')}
              </Text>
            </Flex>
            <Chevron size="$icon.16" color="$neutral2" rotate="180deg" ml="auto" />
          </Flex>
        )}
      </TouchableArea>
      <TouchableArea
        onPress={() => registerAuthenticator(AuthenticatorAttachment.CROSS_PLATFORM)}
        width="100%"
        disabled={unitagLoading}
      >
        {unitagLoading ? (
          <Loader.Box height={40} width={250} />
        ) : (
          <Flex row gap="$gap12" justifyContent="center" alignItems="center" width="100%" {...ClickableTamaguiStyle}>
            <Flex p="$padding6" background={colors.pinkLight} borderRadius="$rounded6" height="min-content">
              <Mobile size="$icon.20" color="$accent1" />
            </Flex>
            <Flex>
              <Text variant="body2">{t('common.device.other')}</Text>
              <Text variant="body3" color="$neutral2">
                {t('account.passkey.type.crossplatform')}
              </Text>
            </Flex>
            <Chevron size="$icon.16" color="$neutral2" rotate="180deg" ml="auto" />
          </Flex>
        )}
      </TouchableArea>
    </GenericPasskeyMenuModal>
  )
}
