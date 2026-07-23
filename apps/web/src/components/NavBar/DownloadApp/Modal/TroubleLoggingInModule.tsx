import { JSX, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { HeightAnimator } from 'ui/src/animations/components/HeightAnimator'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { hasActiveNeckKey as checkHasActiveNeckKey } from 'uniswap/src/features/passkey/deviceSession'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { useListAuthenticatorsQuery } from '~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { useIsEmbeddedWallet } from '~/hooks/useIsEmbeddedWallet'
import { setOpenModal } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { useAppDispatch } from '~/state/hooks'

function LoginHelpOption({
  icon,
  title,
  subtitle,
  element,
  testID,
  onPress,
}: {
  icon: JSX.Element
  title: string
  subtitle: string
  element: ElementName
  testID: string
  onPress: () => void
}): JSX.Element {
  return (
    <Trace logImpression logPress element={element}>
      <TouchableArea
        row
        alignItems="center"
        gap="$spacing12"
        p="$spacing12"
        borderRadius="$rounded16"
        backgroundColor="$surface2"
        hoverStyle={{ backgroundColor: '$surface3' }}
        testID={testID}
        onPress={onPress}
      >
        <Flex
          centered
          width={32}
          height={32}
          borderRadius="$rounded8"
          backgroundColor="$surface1"
          borderWidth="$spacing1"
          borderColor="$surface3"
        >
          {icon}
        </Flex>
        <Flex fill alignItems="flex-start" gap="$spacing4">
          <Text variant="body2" color="$neutral1">
            {title}
          </Text>
          <Text variant="body3" color="$neutral2">
            {subtitle}
          </Text>
        </Flex>
      </TouchableArea>
    </Trace>
  )
}

/**
 * Expandable "Trouble logging in?" module at the bottom of the "Download Uniswap Mobile" pane, for
 * embedded-wallet users only. "Add a backup login" is shown only when listAuthenticators confirms no
 * recovery method exists yet (fails closed otherwise, since a wallet supports one); "Add a passkey"
 * is always shown. Both options open the existing flows via setOpenModal.
 */
export function TroubleLoggingInModule(): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isEmbeddedWallet = useIsEmbeddedWallet()
  const [expanded, setExpanded] = useState(false)

  // Only query once a NECK key is active (matches AddBackupLoginCard).
  const { walletId } = useEmbeddedWalletState()
  const hasActiveNeckKey = !!walletId && checkHasActiveNeckKey(walletId)
  const { data: authenticatorsData, isLoading, isError } = useListAuthenticatorsQuery({ skip: !hasActiveNeckKey })
  // Fail closed: require a valid response that confirms no recovery method yet.
  const showAddBackupLogin =
    !isLoading && !isError && !!authenticatorsData && authenticatorsData.recoveryMethods.length === 0

  const toggleExpanded = useEvent(() => setExpanded((prev) => !prev))
  const openAddPasskey = useEvent(() => dispatch(setOpenModal({ name: ModalName.AddPasskey })))
  const openAddBackupLogin = useEvent(() => dispatch(setOpenModal({ name: ModalName.AddBackupLogin })))

  if (!isEmbeddedWallet) {
    return null
  }

  return (
    <Flex
      width="100%"
      borderRadius="$rounded20"
      borderWidth="$spacing1"
      borderColor="$surface3"
      backgroundColor="$surface1"
      overflow="hidden"
      testID={TestID.DownloadAppLoginHelp}
    >
      <TouchableArea row alignItems="center" justifyContent="space-between" p="$spacing16" onPress={toggleExpanded}>
        <Text variant="body2" color="$neutral1">
          {t('downloadApp.modal.troubleLoggingIn')}
        </Text>
        {expanded ? (
          <ChevronsIn size="$icon.24" color="$neutral2" />
        ) : (
          <ChevronsOut size="$icon.24" color="$neutral2" />
        )}
      </TouchableArea>
      <HeightAnimator open={expanded} unmountChildrenWhenCollapsed>
        <Flex gap="$spacing4" px="$spacing16" pb="$spacing16">
          <LoginHelpOption
            icon={<Passkey size="$icon.20" color="$neutral1" />}
            title={t('common.passkeys.add')}
            subtitle={t('downloadApp.modal.addPasskey.subtitle')}
            element={ElementName.AddPasskey}
            testID={TestID.DownloadAppAddPasskey}
            onPress={openAddPasskey}
          />
          {showAddBackupLogin && (
            <LoginHelpOption
              icon={<Envelope size="$icon.20" color="$neutral1" />}
              title={t('account.passkey.backupLogin.card.title')}
              subtitle={t('downloadApp.modal.addBackupLogin.subtitle')}
              element={ElementName.AddBackupLogin}
              testID={TestID.DownloadAppAddBackupLogin}
              onPress={openAddBackupLogin}
            />
          )}
        </Flex>
      </HeightAnimator>
    </Flex>
  )
}
