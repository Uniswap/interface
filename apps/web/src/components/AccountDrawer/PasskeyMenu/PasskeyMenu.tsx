import { type QueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Anchor, Button, Flex, Loader, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { Buoy } from 'ui/src/components/icons/Buoy'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import type { RecoveryMethod } from 'uniswap/src/features/passkey/embeddedWallet'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n from 'uniswap/src/i18n'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import {
  type AuthenticatorDisplay,
  getListAuthenticatorsStorageKey,
  useListAuthenticatorsQuery,
} from '~/components/AccountDrawer/PasskeyMenu/hooks/useListAuthenticatorsQuery'
import { MenuColumn } from '~/components/AccountDrawer/shared'
import { SlideOutMenu } from '~/components/AccountDrawer/SlideOutMenu'
import { getProviderIcon } from '~/components/Passkey/authenticatorProvider'
import { OverflowMenu } from '~/components/Passkey/OverflowMenu'
import { getPrivyAppId } from '~/config'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

// Use resetQueries (not invalidateQueries) and manually clear the sessionStorage
// mirror: the mirror's subscription only writes for active observers, so when
// PasskeyMenu is unmounted a plain invalidate leaves stale sessionStorage that
// rehydrates back into the cache on re-mount and masks the invalidation.
export function resetListAuthenticators(queryClient: QueryClient, walletId: string | null | undefined): Promise<void> {
  sessionStorage.removeItem(getListAuthenticatorsStorageKey(walletId))
  return queryClient.resetQueries({
    queryKey: [ReactQueryCacheKey.ListAuthenticators],
  })
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
    <Flex row gap="$gap12" alignItems="center">
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
            {i18n.t('common.created.date', { date: formattedDate ?? i18n.t('common.unknown') })}
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
    <Flex row gap="$gap12" alignItems="center" testID={TestID.PasskeyLoadingRow}>
      <Loader.Box borderRadius="$roundedFull" height={40} width={40} opacity={0.5} />
      <Flex gap="$gap8">
        <Loader.Box borderRadius="$rounded12" height={14} width={72} opacity={0.5} />
        <Loader.Box borderRadius="$rounded12" height={12} width={112} opacity={0.5} />
      </Flex>
    </Flex>
  )
}

function getRecoveryMethodIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'google':
      return <GoogleLogoGradient size="$icon.20" />
    case 'apple':
      return <AppleLogo color="$neutral1" size="$icon.20" />
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

const RecoveryMethodRow = ({
  method,
  onRemove,
  actionRequired,
}: {
  method: RecoveryMethod
  onRemove: () => void
  actionRequired?: boolean
}) => {
  return (
    <Flex row gap="$gap12" alignItems="center">
      <Flex
        height={40}
        width={40}
        background="$surface2"
        borderRadius="$rounded12"
        alignItems="center"
        justifyContent="center"
        opacity={actionRequired ? 0.5 : undefined}
      >
        {getRecoveryMethodIcon(method.type)}
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

const ActionRequiredRow = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation()
  return (
    <TouchableArea
      row
      alignItems="center"
      gap="$gap8"
      p="$padding12"
      backgroundColor="$surface3"
      borderRadius="$rounded12"
      hoverStyle={{ opacity: 0.8 }}
      onPress={onPress}
      testID={TestID.ReconnectBackupLogin}
    >
      <AlertTriangleFilled size="$icon.20" color="$neutral1" />
      <Text variant="body3" color="$neutral1" flex={1}>
        {t('account.passkey.reconnect.actionRequired')}
      </Text>
      <RotatableChevron color="$neutral2" direction="right" size="$icon.20" />
    </TouchableArea>
  )
}

export function PasskeyMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { data, isLoading, isError } = useListAuthenticatorsQuery()
  const authenticators = data?.authenticators ?? []
  const recoveryMethods = data?.recoveryMethods ?? []
  const lastExportedMs = data?.lastExportedMs

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
          authenticatorLabel: authenticator.label,
          authenticatorProvider: authenticator.provider,
          isLastAuthenticator: authenticators.length === 1,
          lastExportedMs,
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

  const handleReconnectBackupLogin = useEvent(() => {
    dispatch(setOpenModal({ name: ModalName.ReconnectBackupLogin }))
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
              href={UniswapHelpUrls.articles.passkeysInfo}
              height="$padding20"
              {...ClickableTamaguiStyle}
            >
              <Buoy size="$icon.20" color="$neutral2" />
            </Anchor>
          </Trace>
        }
      >
        <MenuColumn px="$padding8" gap="$spacing24">
          <Flex gap="$spacing16">
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
                <Flex row alignSelf="stretch" mt="$spacing4">
                  <Trace logPress element={ElementName.AddPasskey}>
                    <Button variant="default" emphasis="secondary" size="medium" onPress={handleAddPasskey}>
                      <Text variant="buttonLabel2">{t('common.passkeys.add')}</Text>
                    </Button>
                  </Trace>
                </Flex>
              </>
            ) : null}
          </Flex>

          {getPrivyAppId() ? (
            <Flex gap="$spacing16">
              <Text variant="subheading2" color="$neutral1">
                {t('account.passkey.sections.backupLogin')}
              </Text>
              {recoveryMethods.length > 0 ? (
                recoveryMethods.map((method, index) => (
                  <Flex key={`${method.type}-${method.identifier}-${index}`} gap="$gap12">
                    <RecoveryMethodRow
                      method={method}
                      onRemove={() => handleRemoveBackupLogin(method)}
                      actionRequired={method.shouldRotate}
                    />
                    {method.shouldRotate ? <ActionRequiredRow onPress={handleReconnectBackupLogin} /> : null}
                  </Flex>
                ))
              ) : (
                <Flex row alignSelf="stretch" mt="$spacing4">
                  <Trace logPress element={ElementName.AddBackupLogin}>
                    <Button variant="default" emphasis="secondary" size="medium" onPress={handleAddBackupLogin}>
                      <Text variant="buttonLabel2">{t('account.passkey.backupLogin.addButton')}</Text>
                    </Button>
                  </Trace>
                </Flex>
              )}
            </Flex>
          ) : null}
        </MenuColumn>
      </SlideOutMenu>
    </Trace>
  )
}
