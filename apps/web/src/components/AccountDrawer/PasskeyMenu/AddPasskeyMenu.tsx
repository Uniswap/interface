import { GenericPasskeyMenuModal, PasskeyMenuModalState } from 'components/AccountDrawer/PasskeyMenu/PasskeyMenuModal'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { Cloud } from 'ui/src/components/icons/Cloud'
import { Mobile } from 'ui/src/components/icons/Mobile'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { colors, iconSizes } from 'ui/src/theme'
import { AuthenticatorAttachment, registerNewAuthenticator } from 'uniswap/src/features/passkey/embeddedWallet'

export function AddPasskeyMenu({
  show,
  setPasskeyMenuModalState,
  refreshAuthenticators,
}: {
  show: boolean
  setPasskeyMenuModalState: Dispatch<SetStateAction<PasskeyMenuModalState | undefined>>
  refreshAuthenticators: () => void
}) {
  const { t } = useTranslation()
  return (
    <GenericPasskeyMenuModal show={show}>
      <Flex
        alignItems="center"
        justifyContent="center"
        background="$surface2"
        borderRadius="$rounded12"
        p="$padding12"
        width="min-content"
      >
        <Passkey size={iconSizes.icon24} color="$neutral1" />
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
        onPress={async () => {
          await registerNewAuthenticator({ authenticatorAttachment: AuthenticatorAttachment.PLATFORM })
          await refreshAuthenticators()
          setPasskeyMenuModalState(undefined)
        }}
        width="100%"
      >
        <Flex row gap="$gap12" justifyContent="center" alignItems="center" width="100%" {...ClickableTamaguiStyle}>
          <Flex p="$padding6" background={colors.pinkLight} borderRadius="$rounded6" height="min-content">
            <Cloud size={iconSizes.icon20} color="$accent1" />
          </Flex>
          <Flex>
            <Text variant="body2">{t('common.device')}</Text>
            <Text variant="body3" color="$neutral2">
              {t('account.passkey.type.platform')}
            </Text>
          </Flex>
          <Chevron size={iconSizes.icon16} color="$neutral2" rotate="180deg" ml="auto" />
        </Flex>
      </TouchableArea>
      <TouchableArea
        onPress={async () => {
          await registerNewAuthenticator({ authenticatorAttachment: AuthenticatorAttachment.CROSS_PLATFORM })
          await refreshAuthenticators()
          setPasskeyMenuModalState(undefined)
        }}
        width="100%"
      >
        <Flex row gap="$gap12" justifyContent="center" alignItems="center" width="100%" {...ClickableTamaguiStyle}>
          <Flex p="$padding6" background={colors.pinkLight} borderRadius="$rounded6" height="min-content">
            <Mobile size={iconSizes.icon20} color="$accent1" />
          </Flex>
          <Flex>
            <Text variant="body2">{t('common.device.other')}</Text>
            <Text variant="body3" color="$neutral2">
              {t('account.passkey.type.crossplatform')}
            </Text>
          </Flex>
          <Chevron size={iconSizes.icon16} color="$neutral2" rotate="180deg" ml="auto" />
        </Flex>
      </TouchableArea>
    </GenericPasskeyMenuModal>
  )
}
