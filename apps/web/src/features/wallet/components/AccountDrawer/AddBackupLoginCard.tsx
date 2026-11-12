import { Flex, iconSizes, Text, TouchableArea } from '@universe/mycelium'
import { AppleLogo } from '@universe/mycelium/icons/AppleLogo'
import { Envelope } from '@universe/mycelium/icons/Envelope'
import { GoogleLogoGradient } from '@universe/mycelium/icons/GoogleLogoGradient'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { useEmbeddedWalletBackupStatus } from '~/features/wallet/components/AccountDrawer/PasskeyMenu/hooks/useEmbeddedWalletBackupStatus'
import { useIsUnfundedAccount } from '~/features/wallet/hooks/useIsUnfundedAccount'
import { setOpenModal } from '~/state/application/reducer'
export function AddBackupLoginCard(): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const isUnfundedAccount = useIsUnfundedAccount()
  const { hasBackupLogin } = useEmbeddedWalletBackupStatus()

  const onPressCard = useEvent(() => {
    dispatch(setOpenModal({ name: ModalName.AddBackupLogin }))
  })

  if (isUnfundedAccount || hasBackupLogin !== false) {
    return null
  }

  return (
    <Trace logImpression logPress element={ElementName.AddBackupLogin}>
      <TouchableArea onPress={onPressCard}>
        <Flex
          row
          alignItems="center"
          my="$spacing8"
          borderRadius="$rounded20"
          backgroundColor="$surface1"
          borderWidth="$spacing1"
          borderColor="$surface3"
          overflow="hidden"
          pl="$spacing16"
          pr="$spacing12"
        >
          <Flex flex={1} gap="$spacing4" py="$spacing16">
            <Text variant="body3" color="$neutral1">
              {t('account.passkey.backupLogin.card.title')}
            </Text>
            <Text variant="body4" color="$neutral2">
              {t('account.passkey.backupLogin.card.subtitle')}
            </Text>
          </Flex>
          <Flex
            height={76}
            width={88}
            position="relative"
            style={{
              maskImage:
                'linear-gradient(180deg, rgba(0, 0, 0, 0.30) 1.54%, rgba(0, 0, 0, 0.80) 14.7%, #000 47.69%, rgba(0, 0, 0, 0.80) 85.44%, rgba(0, 0, 0, 0.30) 98.48%)',
              WebkitMaskImage:
                'linear-gradient(180deg, rgba(0, 0, 0, 0.30) 1.54%, rgba(0, 0, 0, 0.80) 14.7%, #000 47.69%, rgba(0, 0, 0, 0.80) 85.44%, rgba(0, 0, 0, 0.30) 98.48%)',
            }}
          >
            <Flex
              position="absolute"
              left={2}
              top={-6}
              width={42}
              height={42}
              p={9}
              borderRadius="$rounded12"
              backgroundColor="$surface1"
              borderWidth="$spacing1"
              borderColor="$surface3"
              alignItems="center"
              justifyContent="center"
              style={{
                transform: 'rotate(35.216deg)',
                maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
              }}
            >
              <Envelope size="$icon.24" color="$blueBase" />
            </Flex>
            <Flex
              position="absolute"
              left={53}
              top={-1}
              width={42}
              height={42}
              p={9}
              borderRadius="$rounded12"
              backgroundColor="$surface1"
              borderWidth="$spacing1"
              borderColor="$surface3"
              alignItems="center"
              justifyContent="center"
              style={{
                transform: 'rotate(35.216deg)',
                maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
              }}
            >
              <GoogleLogoGradient size={iconSizes.icon24} />
            </Flex>
            <Flex
              position="absolute"
              left={27}
              top={38}
              width={42}
              height={42}
              p={9}
              borderRadius="$rounded12"
              backgroundColor="$surface1"
              borderWidth="$spacing1"
              borderColor="$surface3"
              alignItems="center"
              justifyContent="center"
              style={{
                transform: 'rotate(35.216deg)',
                maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
              }}
            >
              <AppleLogo size="$icon.24" color="$neutral1" />
            </Flex>
          </Flex>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}
