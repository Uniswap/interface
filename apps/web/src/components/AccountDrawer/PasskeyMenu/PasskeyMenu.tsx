import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Button, Flex, Loader, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Buoy } from 'ui/src/components/icons/Buoy'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { IcloudPasswordLogo } from 'ui/src/components/icons/IcloudPasswordLogo'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Trash } from 'ui/src/components/icons/Trash'
import { Windows } from 'ui/src/components/icons/Windows'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { iconSizes } from 'ui/src/theme'
import { ContextMenu } from 'uniswap/src/components/menus/ContextMenu'
import { ContextMenuTriggerMode } from 'uniswap/src/components/menus/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import type { Authenticator, RecoveryMethod } from 'uniswap/src/features/passkey/embeddedWallet'
import { AuthenticatorNameType, listAuthenticators } from 'uniswap/src/features/passkey/embeddedWallet'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n from 'uniswap/src/i18n'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useSessionStoragePersistedQuery } from 'utilities/src/reactQuery/useSessionStoragePersistedQuery'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { MenuColumn } from '~/components/AccountDrawer/shared'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { AndroidLogo } from '~/components/Icons/AndroidLogo'
import { AppleLogo } from '~/components/Icons/AppleLogo'
import { getPrivyConfig } from '~/config'
import { setOpenModal } from '~/state/application/reducer'
import { useEmbeddedWalletState } from '~/state/embeddedWallet/store'
import { useAppDispatch } from '~/state/hooks'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

function getPrivyAppId(): string | undefined {
  return getPrivyConfig(false).appId || undefined
}

export const LIST_AUTHENTICATORS_QUERY_KEY = 'listAuthenticators'

enum AuthenticatorProvider {
  Google = 'Chrome',
  Apple = 'iCloud',
  Microsoft = 'Windows',
  Android = 'Android',
  Other = 'Other',
}

export type AuthenticatorDisplay = Pick<Authenticator, 'credentialId' | 'providerName' | 'createdAt' | 'aaguid'> & {
  provider: AuthenticatorProvider
  label: string
}

function getProviderIcon(provider: AuthenticatorProvider) {
  switch (provider) {
    case AuthenticatorProvider.Google:
      return <GoogleLogoGradient size={iconSizes.icon20} />
    case AuthenticatorProvider.Apple:
      return <IcloudPasswordLogo size={iconSizes.icon20} />
    case AuthenticatorProvider.Android:
      return <AndroidLogo height={iconSizes.icon20} width={iconSizes.icon20} />
    case AuthenticatorProvider.Microsoft:
      return <Windows size="$icon.20" color="$neutral1" />
    default:
      return <Passkey size="$icon.20" color="$neutral1" />
  }
}

function getProviderLabel(provider: AuthenticatorProvider, count?: number) {
  switch (provider) {
    case AuthenticatorProvider.Android:
    case AuthenticatorProvider.Microsoft:
    case AuthenticatorProvider.Apple:
    case AuthenticatorProvider.Google: {
      return provider
    }
    default: {
      return i18n.t('common.passkey.count', { number: count })
    }
  }
}

function getProvider(
  providerName: AuthenticatorNameType,
  nameType: typeof AuthenticatorNameType,
): AuthenticatorProvider {
  switch (providerName) {
    case nameType.GOOGLE_PASSWORD_MANAGER:
      return AuthenticatorProvider.Android
    case nameType.CHROME_MAC:
      return AuthenticatorProvider.Google
    case nameType.ICLOUD_KEYCHAIN:
    case nameType.ICLOUD_KEYCHAIN_MANAGED:
      return AuthenticatorProvider.Apple
    case nameType.WINDOWS_HELLO:
      return AuthenticatorProvider.Microsoft
    default:
      return AuthenticatorProvider.Other
  }
}

function convertAuthenticatorsToDisplay(
  authenticators: Authenticator[],
  nameType: typeof AuthenticatorNameType,
): AuthenticatorDisplay[] {
  let otherPasskeyCount = 1
  return authenticators.map((authenticator) => {
    const provider = getProvider(authenticator.providerName, nameType)
    const isOtherPasskey = provider === AuthenticatorProvider.Other
    const label = getProviderLabel(provider, otherPasskeyCount)
    isOtherPasskey && otherPasskeyCount++
    return {
      // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
      ...authenticator,
      provider,
      label,
    }
  })
}

const OverflowMenu = ({ onRemove, testID }: { onRemove: () => void; testID?: string }) => {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Flex ml="auto">
      <ContextMenu
        menuItems={[
          {
            label: t('common.button.remove'),
            onPress: onRemove,
            destructive: true,
            Icon: Trash,
            iconColor: '$statusCritical',
          },
        ]}
        isOpen={isOpen}
        closeMenu={() => setIsOpen(false)}
        openMenu={() => setIsOpen(true)}
        triggerMode={ContextMenuTriggerMode.Primary}
        isPlacementRight
        offsetY={4}
        adaptToSheet={false}
      >
        <TouchableArea testID={testID} shouldStopPropagation={false}>
          <MoreHorizontal size={20} color="$neutral2" />
        </TouchableArea>
      </ContextMenu>
    </Flex>
  )
}

const AuthenticatorRow = ({
  authenticator,
  handleDeletePasskey,
  isOnlyPasskey,
}: {
  authenticator: AuthenticatorDisplay
  handleDeletePasskey: (authenticator: AuthenticatorDisplay) => void
  isOnlyPasskey: boolean
}) => {
  const createdAtDate = authenticator.createdAt ? new Date(Number(authenticator.createdAt)) : undefined
  const isValidDate = createdAtDate instanceof Date && !isNaN(createdAtDate.getTime())
  const formattedDate = createdAtDate?.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: createdAtDate.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })

  return (
    <Flex row gap="$gap12" alignItems="center" pb="$padding16">
      <Flex
        height={40}
        width={40}
        background="$surface2"
        borderRadius="$rounded12"
        alignItems="center"
        justifyContent="center"
      >
        {getProviderIcon(authenticator.provider)}
      </Flex>
      <Flex>
        <Text variant="body2">{authenticator.label}</Text>
        {isValidDate && (
          <Text variant="body3" color="$neutral2">
            {i18n.t('common.created.date', { date: formattedDate })}
          </Text>
        )}
      </Flex>
      {!isOnlyPasskey && (
        <OverflowMenu testID={TestID.DeletePasskey} onRemove={() => handleDeletePasskey(authenticator)} />
      )}
    </Flex>
  )
}

function LoadingPasskeyRow() {
  return (
    <Flex row gap="$gap12" alignItems="center" pb="$padding16" testID={TestID.PasskeyLoadingRow}>
      <Loader.Box borderRadius="$roundedFull" height={40} width={40} opacity={0.5} />
      <Flex gap="$gap8">
        <Loader.Box borderRadius="$rounded12" height={14} width={72} opacity={0.5} />
        <Loader.Box borderRadius="$rounded12" height={12} width={112} opacity={0.5} />
      </Flex>
    </Flex>
  )
}

function getRecoveryMethodIcon(type: string, colors: UseSporeColorsReturn) {
  switch (type.toLowerCase()) {
    case 'google':
      return <GoogleLogoGradient size={iconSizes.icon20} />
    case 'apple':
      return <AppleLogo height={iconSizes.icon20} width={iconSizes.icon20} fill={colors.neutral1.val} />
    default:
      return <Envelope size="$icon.20" color="$neutral1" />
  }
}

export function getRecoveryMethodLabel(type: string): string {
  switch (type.toLowerCase()) {
    case 'google':
      return i18n.t('account.passkey.backupLogin.add.google')
    case 'apple':
      return i18n.t('account.passkey.backupLogin.add.apple')
    default:
      return i18n.t('account.passkey.backupLogin.add.email')
  }
}

const RecoveryMethodRow = ({ method, onRemove }: { method: RecoveryMethod; onRemove: () => void }) => {
  const colors = useSporeColors()

  return (
    <Flex row gap="$gap12" alignItems="center" pb="$padding16">
      <Flex
        height={40}
        width={40}
        background="$surface2"
        borderRadius="$rounded12"
        alignItems="center"
        justifyContent="center"
      >
        {getRecoveryMethodIcon(method.type, colors)}
      </Flex>
      <Flex flex={1} minWidth={0}>
        <Text variant="body2">{getRecoveryMethodLabel(method.type)}</Text>
        {method.identifier ? (
          <Text variant="body3" color="$neutral2" numberOfLines={1}>
            {method.identifier}
          </Text>
        ) : null}
      </Flex>
      <OverflowMenu testID={TestID.RemoveBackupLoginOverflow} onRemove={onRemove} />
    </Flex>
  )
}

export function PasskeyMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { walletId } = useEmbeddedWalletState()
  // Mirror to sessionStorage so the cache survives the top-level OAuth redirect.
  // Without this, the post-redirect refetch loses the in-memory NECK and re-prompts
  // for the passkey to derive a fresh one.
  useSessionStoragePersistedQuery({
    queryKey: [LIST_AUTHENTICATORS_QUERY_KEY, walletId],
    storageKey: `listAuth:${walletId ?? ''}`,
    enabled: !!walletId,
  })
  const { data, isLoading, isError } = useQuery({
    queryKey: [LIST_AUTHENTICATORS_QUERY_KEY, walletId],
    queryFn: async () => {
      const result = await listAuthenticators(walletId ?? undefined)
      const display = convertAuthenticatorsToDisplay(result.authenticators, AuthenticatorNameType)
      display.sort((a, b) => {
        const aTime = Number(a.createdAt) || 0
        const bTime = Number(b.createdAt) || 0
        return aTime - bTime
      })
      return { authenticators: display, recoveryMethods: result.recoveryMethods }
    },
    enabled: !!walletId,
    staleTime: 20 * ONE_MINUTE_MS,
  })
  const authenticators = data?.authenticators ?? []
  const recoveryMethods = data?.recoveryMethods ?? []

  // Bail back to Settings if the listAuthenticators query errors or returns an
  // empty response (no authenticators and no recovery methods). The passkey menu
  // should never render with zero login methods, so empty == malformed here.
  useEffect(() => {
    if (isError) {
      logger.error(new Error('PasskeyMenu: listAuthenticators query failed'), {
        tags: { file: 'PasskeyMenu.tsx', function: 'PasskeyMenu' },
      })
      onClose()
      return
    }
    if (!isLoading && data && authenticators.length + recoveryMethods.length === 0) {
      logger.error(new Error('PasskeyMenu: malformed response with 0 authenticators and 0 recovery methods'), {
        tags: { file: 'PasskeyMenu.tsx', function: 'PasskeyMenu' },
      })
      onClose()
    }
  }, [isError, isLoading, data, authenticators.length, recoveryMethods.length, onClose])

  const handleAddPasskey = useEvent(() => {
    dispatch(setOpenModal({ name: ModalName.AddPasskey }))
  })

  const handleDeletePasskey = useEvent((authenticator: AuthenticatorDisplay) => {
    dispatch(
      setOpenModal({
        name: ModalName.DeletePasskey,
        initialState: {
          authenticatorId: authenticator.credentialId,
          isLastAuthenticator: authenticators.length === 1,
        },
      }),
    )
  })

  const handleRemoveBackupLogin = useEvent((method: RecoveryMethod) => {
    dispatch(
      setOpenModal({
        name: ModalName.RemoveBackupLogin,
        initialState: {
          recoveryMethodType: method.type,
          recoveryMethodIdentifier: method.identifier || undefined,
        },
      }),
    )
  })

  const handleAddBackupLogin = useEvent(() => {
    dispatch(setOpenModal({ name: ModalName.AddBackupLogin }))
  })

  useEffect(() => {
    if (!getPrivyAppId()) {
      logger.error(new Error('PasskeyMenu opened without PRIVY_APP_ID — backup login section hidden'), {
        tags: { file: 'PasskeyMenu.tsx', function: 'PasskeyMenu' },
      })
    }
  }, [])

  return (
    <Trace logImpression modal={ModalName.PasskeyManagement}>
      <SlideOutMenu
        title={t('settings.setting.loginMethods')}
        onClose={onClose}
        rightIcon={
          <Trace logPress element={ElementName.GetHelp}>
            <Anchor
              target="_blank"
              rel="noreferrer"
              href={uniswapUrls.helpArticleUrls.passkeysInfo}
              height="$padding20"
              {...ClickableTamaguiStyle}
            >
              <Buoy size="$icon.20" color="$neutral2" />
            </Anchor>
          </Trace>
        }
      >
        <MenuColumn gap="12px">
          <Text variant="subheading2" color="$neutral1">
            {t('common.passkeys')}
          </Text>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <LoadingPasskeyRow key={index} />)
          ) : authenticators.length ? (
            <>
              {authenticators.map((authenticator) => (
                <AuthenticatorRow
                  key={authenticator.credentialId}
                  authenticator={authenticator}
                  handleDeletePasskey={handleDeletePasskey}
                  isOnlyPasskey={authenticators.length === 1}
                />
              ))}
              <Flex row alignSelf="stretch">
                <Trace logPress element={ElementName.AddPasskey}>
                  <Button variant="default" emphasis="secondary" size="medium" onPress={handleAddPasskey}>
                    <Text variant="buttonLabel2">{t('common.passkeys.add')}</Text>
                  </Button>
                </Trace>
              </Flex>
            </>
          ) : null}

          {getPrivyAppId() ? (
            <>
              <Flex row alignItems="center" gap="$gap4" pt="$padding8">
                <Text variant="subheading2" color="$neutral1">
                  {t('account.passkey.sections.backupLogin')}
                </Text>
              </Flex>
              {recoveryMethods.length > 0 ? (
                recoveryMethods.map((method, index) => (
                  <RecoveryMethodRow
                    key={`${method.type}-${method.identifier}-${index}`}
                    method={method}
                    onRemove={() => handleRemoveBackupLogin(method)}
                  />
                ))
              ) : (
                <Flex row alignSelf="stretch">
                  <Trace logPress element={ElementName.AddBackupLogin}>
                    <Button variant="default" emphasis="secondary" size="medium" onPress={handleAddBackupLogin}>
                      <Text variant="buttonLabel2">{t('account.passkey.backupLogin.addButton')}</Text>
                    </Button>
                  </Trace>
                </Flex>
              )}
            </>
          ) : null}
        </MenuColumn>
      </SlideOutMenu>
    </Trace>
  )
}
