import { AddPasskeyMenu } from 'components/AccountDrawer/PasskeyMenu/AddPasskeyMenu'
import { DeletePasskeyMenu } from 'components/AccountDrawer/PasskeyMenu/DeletePasskeyMenu'
import { DeletePasskeySpeedbumpMenu } from 'components/AccountDrawer/PasskeyMenu/DeletePasskeySpeedbumpMenu'
import { PasskeyMenuModalState } from 'components/AccountDrawer/PasskeyMenu/PasskeyMenuModal'
import { SlideOutMenu } from 'components/AccountDrawer/SlideOutMenu'
import { MenuColumn } from 'components/AccountDrawer/shared'
import { AndroidLogo } from 'components/Icons/AndroidLogo'
import { AppleLogo } from 'components/Icons/AppleLogo'
import { t } from 'i18next'
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react'
import { LifeBuoy } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Button, Flex, Image, Loader, Text, TouchableArea, useSporeColors } from 'ui/src'
import { CHROME_LOGO } from 'ui/src/assets'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Trash } from 'ui/src/components/icons/Trash'
import { Windows } from 'ui/src/components/icons/Windows'
import { UseSporeColorsReturn } from 'ui/src/hooks/useSporeColors'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Authenticator, AuthenticatorNameType, listAuthenticators } from 'uniswap/src/features/passkey/embeddedWallet'
import { isMobileWeb } from 'utilities/src/platform'

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
      return <Image height={iconSizes.icon20} source={CHROME_LOGO} width={iconSizes.icon20} />
    case AuthenticatorProvider.Apple:
      return <AppleLogo height={iconSizes.icon20} width={iconSizes.icon20} fill={colors.neutral1.val} />
    case AuthenticatorProvider.Android:
      return <AndroidLogo height={iconSizes.icon20} width={iconSizes.icon20} />
    case AuthenticatorProvider.Microsoft:
      return <Windows size={iconSizes.icon20} color="$neutral1" />
    default:
      return <Passkey size={iconSizes.icon20} color="$neutral1" />
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
      return t('common.passkey.count', { number: count })
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
  setPasskeyMenuModalState,
  setSelectedAuthenticator,
}: {
  authenticator: AuthenticatorDisplay
  setPasskeyMenuModalState: Dispatch<SetStateAction<PasskeyMenuModalState | undefined>>
  setSelectedAuthenticator: Dispatch<SetStateAction<AuthenticatorDisplay | undefined>>
}) => {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [showDeleteIcon, setShowDeleteIcon] = useState(false)
  const createdAtDate = authenticator.creationTime?.toDate()
  const isValidDate = createdAtDate instanceof Date && !isNaN(createdAtDate.getTime())
  const formattedDate = createdAtDate?.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: createdAtDate?.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
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
        <TouchableArea
          ml="auto"
          onPress={() => {
            setSelectedAuthenticator(authenticator)
            setPasskeyMenuModalState(PasskeyMenuModalState.DELETE_PASSKEY_SPEEDBUMP)
          }}
        >
          <Trash color="$statusCritical" size={24} />
        </TouchableArea>
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
  const [authenticators, setAuthenticators] = useState<AuthenticatorDisplay[]>([])
  const [passkeyMenuModalState, setPasskeyMenuModalState] = useState<PasskeyMenuModalState | undefined>(undefined)
  const [selectedAuthenticator, setSelectedAuthenticator] = useState<AuthenticatorDisplay | undefined>(undefined)

  const refreshAuthenticators = useCallback(async () => {
    const fetchAuthenticators = async () => {
      const authenticators = await listAuthenticators()
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
      setAuthenticators(authenticatorsDisplay)
    }
    fetchAuthenticators()
  }, [])

  useEffect(() => {
    refreshAuthenticators()
  }, [refreshAuthenticators])

  const handleClose = useCallback(() => {
    if (passkeyMenuModalState !== undefined && isMobileWeb) {
      setPasskeyMenuModalState(undefined)
    } else {
      onClose()
    }
  }, [onClose, passkeyMenuModalState])

  return (
    <SlideOutMenu
      title={t('common.passkeys')}
      onClose={handleClose}
      rightIcon={
        <Anchor target="_blank" rel="noreferrer" href={uniswapUrls.helpUrl} {...ClickableTamaguiStyle}>
          <LifeBuoy size={20} color={colors.neutral2.val} />
        </Anchor>
      }
    >
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
      <AddPasskeyMenu
        show={passkeyMenuModalState === PasskeyMenuModalState.ADD_PASSKEY}
        setPasskeyMenuModalState={setPasskeyMenuModalState}
        refreshAuthenticators={refreshAuthenticators}
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
        />
      )}
      {passkeyMenuModalState === undefined || !isMobileWeb ? (
        <MenuColumn gap="12px">
          {authenticators.length ? (
            <>
              {authenticators.map((authenticator) => (
                <AuthenticatorRow
                  key={authenticator.id}
                  authenticator={authenticator}
                  setPasskeyMenuModalState={setPasskeyMenuModalState}
                  setSelectedAuthenticator={setSelectedAuthenticator}
                />
              ))}
              <Flex row alignSelf="stretch">
                <Button
                  py="$padding16"
                  variant="branded"
                  emphasis="secondary"
                  onPress={() => setPasskeyMenuModalState(PasskeyMenuModalState.ADD_PASSKEY)}
                >
                  <Text variant="buttonLabel2" color="$accent1">
                    {t('common.passkeys.add')}
                  </Text>
                </Button>
              </Flex>
            </>
          ) : (
            Array.from({ length: 3 }).map((_, index) => <LoadingPasskeyRow key={index} />)
          )}
        </MenuColumn>
      ) : null}
    </SlideOutMenu>
  )
}
