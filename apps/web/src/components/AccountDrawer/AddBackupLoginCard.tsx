import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { iconSizes } from 'ui/src/theme'
import { hasActiveNeckKey as checkHasActiveNeckKey } from 'uniswap/src/features/passkey/deviceSession'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useEvent } from 'utilities/src/react/hooks'
import { useListAuthenticatorsQuery } from '~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { getPrivyAppId } from '~/config'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'
import { useIsPortfolioZero } from '~/pages/Portfolio/Overview/hooks/useIsPortfolioZero'
import { setOpenModal } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'

/**
 * Decides whether the "Add a backup login" card is visible.
 *
 * Fail closed: the card is only shown when a valid listAuthenticators response
 * confirms the wallet has no recovery method yet (matches TroubleLoggingInModule).
 * A skipped or not-yet-fetched query — e.g. right after logging out and into a
 * different wallet, before its NECK key is active — must not imply "no recovery
 * method": a disabled query reports `isLoading: false` with `authData: undefined`.
 */
export function getShowAddBackupLoginCard({
  isEmbeddedWallet,
  isPortfolioZero,
  isLoading,
  isError,
  authData,
  hasPrivyAppId,
}: {
  isEmbeddedWallet: boolean
  isPortfolioZero: boolean
  isLoading: boolean
  isError: boolean
  authData: { recoveryMethods: readonly unknown[] } | undefined
  hasPrivyAppId: boolean
}): boolean {
  const confirmedNoRecoveryMethod = !isLoading && !isError && !!authData && authData.recoveryMethods.length === 0
  return isEmbeddedWallet && !isPortfolioZero && confirmedNoRecoveryMethod && hasPrivyAppId
}

export function AddBackupLoginCard(): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const isEmbeddedWallet = useIsEmbeddedWallet()
  const isPortfolioZero = useIsPortfolioZero()
  const { walletId } = useEmbeddedWalletState()
  const hasActiveNeckKey = !!walletId && checkHasActiveNeckKey(walletId)
  const { data: authData, isLoading, isError } = useListAuthenticatorsQuery({ skip: !hasActiveNeckKey })

  const onPressCard = useEvent(() => {
    dispatch(setOpenModal({ name: ModalName.AddBackupLogin }))
  })
  const showCard = getShowAddBackupLoginCard({
    isEmbeddedWallet,
    isPortfolioZero,
    isLoading,
    isError,
    authData,
    hasPrivyAppId: !!getPrivyAppId(),
  })

  if (!showCard) {
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
              <Envelope size="$icon.24" color="$DEP_blue400" />
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
