import { AddPasskeyMenu } from 'components/AccountDrawer/PasskeyMenu/AddPasskeyMenu'
import { DeletePasskeyMenu } from 'components/AccountDrawer/PasskeyMenu/DeletePasskeyMenu'
import { DeletePasskeySpeedbumpMenu } from 'components/AccountDrawer/PasskeyMenu/DeletePasskeySpeedbumpMenu'
import { PasskeyMenuModalState } from 'components/AccountDrawer/PasskeyMenu/PasskeyMenuModal'
import { VerifyPasskeyMenu } from 'components/AccountDrawer/PasskeyMenu/VerifyPasskeyMenu'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { MenuColumn } from 'components/AccountDrawer/shared'
import { AndroidLogo } from 'components/Icons/AndroidLogo'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { useAccount } from 'hooks/useAccount'
import { usePasskeyAuthWithHelpModal } from 'hooks/usePasskeyAuthWithHelpModal'
import { useCallback, useEffect, useState } from 'react'
import { LifeBuoy } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Button, Flex, Loader, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Trash } from 'ui/src/components/icons/Trash'
import { Windows } from 'ui/src/components/icons/Windows'
import { GoogleChromeLogo } from 'ui/src/components/logos/GoogleChromeLogo'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import {
  Action,
  Authenticator,
  AuthenticatorNameType,
  authenticateWithPasskey,
  listAuthenticators,
} from 'uniswap/src/features/passkey/embeddedWallet'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import i18n from 'uniswap/src/i18n'
import { isMobileWeb } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

enum AuthenticatorProvider {
  Google = 'Chrome',
  Apple = 'iCloud',
  Microsoft = 'Windows',
  Android = 'Android',
  Other = 'Other',
}

type AuthenticatorDisplay = Authenticator & {
  provider: AuthenticatorProvider
  label: string
}

function getProviderIcon(provider: AuthenticatorProvider, colors: UseSporeColorsReturn) {
  switch (provider) {
    case AuthenticatorProvider.Google:
      return <GoogleChromeLogo size={iconSizes.icon20} />
    case AuthenticatorProvider.Apple:
      return <AppleLogo height={iconSizes.icon20} width={iconSizes.icon20} fill={colors.neutral1.val} />
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

function getProvider(providerName: AuthenticatorNameType): AuthenticatorProvider {
  switch (providerName) {
    case AuthenticatorNameType.GOOGLE_PASSWORD_MANAGER:
      return AuthenticatorProvider.Android
    case AuthenticatorNameType.CHROME_MAC:
      return AuthenticatorProvider.Google
    case AuthenticatorNameType.ICLOUD_KEYCHAIN:
    case AuthenticatorNameType.ICLOUD_KEYCHAIN_MANAGED:
      return AuthenticatorProvider.Apple
    case AuthenticatorNameType.WINDOWS_HELLO:
      return AuthenticatorProvider.Microsoft
    default:
      return AuthenticatorProvider.Other
  }
}

function convertAuthenticatorsToDisplay(authenticators: Authenticator[]): AuthenticatorDisplay[] {
  let otherPasskeyCount = 1
  return authenticators.map((authenticator) => {
    const provider = getProvider(authenticator.providerName)
    const isOtherPasskey = provider === AuthenticatorProvider.Other
    const label = getProviderLabel(provider, otherPasskeyCount)
    isOtherPasskey && otherPasskeyCount++
    return {
      ...authenticator,
      provider,
      label,
    } as AuthenticatorDisplay
  })
}

const AuthenticatorRow = ({
  authenticator,
  handleDeletePasskey,
}: {
  authenticator: AuthenticatorDisplay
  handleDeletePasskey: (authenticator: AuthenticatorDisplay) => void
}) => {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [showDeleteIcon, setShowDeleteIcon] = useState(false)
  const createdAtDate = authenticator.creationTime?.toDate()
  const isValidDate = createdAtDate instanceof Date && !isNaN(createdAtDate.getTime())
  const formattedDate = createdAtDate?.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: createdAtDate.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })

  return (
    <Flex
      row
      gap="$gap12"
      alignItems="center"
      onHoverIn={() => setShowDeleteIcon(true)}
      onHoverOut={() => setShowDeleteIcon(false)}
      pb="$padding16"
    >
      <Flex
        height={40}
        width={40}
        background="$surface2"
        borderRadius="$rounded12"
        alignItems="center"
        justifyContent="center"
      >
        {getProviderIcon(authenticator.provider, colors)}
      </Flex>
      <Flex>
        <Text variant="body2">{authenticator.label}</Text>
        {isValidDate && (
          <Text variant="body3" color="$neutral2">
            {t('common.created.date', { date: formattedDate })}
          </Text>
        )}
      </Flex>
      {(showDeleteIcon || isMobileWeb) && (
        <Trace logPress element={ElementName.DeletePasskey}>
          <TouchableArea
            ml="auto"
            onPress={() => {
              handleDeletePasskey(authenticator)
            }}
          >
            <Trash color="$statusCritical" size={24} />
          </TouchableArea>
        </Trace>
      )}
    </Flex>
  )
}

function LoadingPasskeyRow() {
  return (
    <Flex row gap="$gap12" alignItems="center" pb="$padding16">
      <Loader.Box borderRadius="$roundedFull" height={40} width={40} opacity={0.5} />
      <Flex gap="$gap8">
        <Loader.Box borderRadius="$rounded12" height={14} width={72} opacity={0.5} />
        <Loader.Box borderRadius="$rounded12" height={12} width={112} opacity={0.5} />
      </Flex>
    </Flex>
  )
}

export default function PasskeyMenu({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const account = useAccount()
  const [authenticators, setAuthenticators] = useState<AuthenticatorDisplay[]>([])
  const [passkeyMenuModalState, setPasskeyMenuModalState] = useState<PasskeyMenuModalState | undefined>(undefined)
  const [selectedAuthenticator, setSelectedAuthenticator] = useState<AuthenticatorDisplay | undefined>(undefined)
  const [credential, setCredential] = useState<string | undefined>(undefined)
  // Used by the verify passkey modal to determine the next action add or delete
  const [actionAfterVerify, setActionAfterVerify] = useState<
    PasskeyMenuModalState.ADD_PASSKEY | PasskeyMenuModalState.DELETE_PASSKEY_SPEEDBUMP | undefined
  >(undefined)

  const { mutate: refreshAuthenticators, isPending: areAuthenticatorsLoading } = usePasskeyAuthWithHelpModal(
    async () => {
      const authenticators = await listAuthenticators(account.address)
      const authenticatorsDisplay = convertAuthenticatorsToDisplay(authenticators)
      // Sort by creation time, oldest to newest
      authenticatorsDisplay.sort((a, b) => {
        const aDate = a.creationTime?.toDate()
        const bDate = b.creationTime?.toDate()
        if (!aDate || !bDate) {
          return 0
        }
        return aDate.getTime() - bDate.getTime()
      })
      return authenticatorsDisplay
    },
    {
      onSuccess: (authenticatorsDisplay) => {
        setAuthenticators(authenticatorsDisplay)
      },
    },
  )

  const { mutate: verifyPasskey } = usePasskeyAuthWithHelpModal(
    async () => {
      return await authenticateWithPasskey(
        actionAfterVerify === PasskeyMenuModalState.ADD_PASSKEY
          ? Action.REGISTER_NEW_AUTHENTICATION_TYPES
          : Action.DELETE_RECORD,
      )
    },
    {
      onSuccess: (credential) => {
        setCredential(credential)
        setPasskeyMenuModalState(actionAfterVerify)
        setActionAfterVerify(undefined)
      },
    },
  )

  useEffect(() => {
    refreshAuthenticators()
  }, [refreshAuthenticators])

  const handleCloseDrawer = useCallback(() => {
    if (passkeyMenuModalState !== undefined && isMobileWeb) {
      setPasskeyMenuModalState(undefined)
    } else {
      onClose()
    }
  }, [onClose, passkeyMenuModalState])

  const handleAddPasskey = useEvent(() => {
    setActionAfterVerify(PasskeyMenuModalState.ADD_PASSKEY)
    setPasskeyMenuModalState(PasskeyMenuModalState.VERIFY_PASSKEY)
  })

  const handleDeletePasskey = useEvent((authenticator: AuthenticatorDisplay) => {
    setSelectedAuthenticator(authenticator)
    setActionAfterVerify(PasskeyMenuModalState.DELETE_PASSKEY_SPEEDBUMP)
    setPasskeyMenuModalState(PasskeyMenuModalState.VERIFY_PASSKEY)
  })

  const handleVerification = useCallback(async () => {
    if (!actionAfterVerify) {
      return
    }
    verifyPasskey()
  }, [actionAfterVerify, verifyPasskey])

  return (
    <Trace logImpression modal={ModalName.PasskeyManagement}>
      <Flex
        display={passkeyMenuModalState !== undefined && !isMobileWeb ? 'flex' : 'none'}
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundColor="$scrim"
        zIndex={1}
        opacity={0.6}
        borderRadius={isMobileWeb ? 0 : 12}
        alignItems="center"
        justifyContent="center"
        onPress={() => setPasskeyMenuModalState(undefined)}
      />

      <SlideOutMenu
        title={t('common.passkeys')}
        onClose={handleCloseDrawer}
        rightIcon={
          <Trace logPress element={ElementName.GetHelp}>
            <Anchor
              target="_blank"
              rel="noreferrer"
              href={uniswapUrls.helpArticleUrls.passkeysInfo}
              {...ClickableTamaguiStyle}
            >
              <LifeBuoy size={20} color={colors.neutral2.val} />
            </Anchor>
          </Trace>
        }
      >
        <VerifyPasskeyMenu
          show={passkeyMenuModalState === PasskeyMenuModalState.VERIFY_PASSKEY}
          onVerify={handleVerification}
          onClose={() => setPasskeyMenuModalState(undefined)}
        />
        <AddPasskeyMenu
          show={passkeyMenuModalState === PasskeyMenuModalState.ADD_PASSKEY}
          setPasskeyMenuModalState={setPasskeyMenuModalState}
          refreshAuthenticators={refreshAuthenticators}
          credential={credential}
          numAuthenticators={authenticators.length}
        />
        <DeletePasskeySpeedbumpMenu
          show={passkeyMenuModalState === PasskeyMenuModalState.DELETE_PASSKEY_SPEEDBUMP}
          setPasskeyMenuModalState={setPasskeyMenuModalState}
        />
        {selectedAuthenticator && (
          <DeletePasskeyMenu
            show={passkeyMenuModalState === PasskeyMenuModalState.DELETE_PASSKEY}
            setPasskeyMenuModalState={setPasskeyMenuModalState}
            refreshAuthenticators={refreshAuthenticators}
            authenticator={selectedAuthenticator}
            isLastAuthenticator={authenticators.length === 1}
            credential={credential}
          />
        )}
        {passkeyMenuModalState === undefined || !isMobileWeb ? (
          <MenuColumn gap="12px">
            {!areAuthenticatorsLoading && authenticators.length ? (
              <>
                {authenticators.map((authenticator) => (
                  <AuthenticatorRow
                    key={authenticator.id}
                    authenticator={authenticator}
                    handleDeletePasskey={handleDeletePasskey}
                  />
                ))}
                <Flex row alignSelf="stretch">
                  <Trace logPress element={ElementName.AddPasskey}>
                    <Button py="$padding16" variant="branded" emphasis="secondary" onPress={handleAddPasskey}>
                      <Text variant="buttonLabel2" color="$accent1">
                        {t('common.passkeys.add')}
                      </Text>
                    </Button>
                  </Trace>
                </Flex>
              </>
            ) : (
              Array.from({ length: 3 }).map((_, index) => <LoadingPasskeyRow key={index} />)
            )}
          </MenuColumn>
        ) : null}
      </SlideOutMenu>
    </Trace>
  )
}
