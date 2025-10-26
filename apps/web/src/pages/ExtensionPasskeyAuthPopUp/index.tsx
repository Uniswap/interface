import { useExternallyConnectableExtensionId } from 'pages/ExtensionPasskeyAuthPopUp/useExternallyConnectableExtensionId'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { Anchor, Button, Flex, SpinningLoader, Text } from 'ui/src'
import { EnvelopeHeart } from 'ui/src/components/icons/EnvelopeHeart'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { parseMessage } from 'uniswap/src/extension/messagePassing/platform'
import {
  InterfaceToExtensionRequestType,
  PasskeyCredentialError,
  PasskeyCredentialRetrieved,
  PasskeyRequest,
  PasskeyRequestSchema,
  PasskeySignInFlowOpened,
} from 'uniswap/src/extension/messagePassing/types/requests'
import { authenticatePasskey } from 'uniswap/src/features/passkey/passkey'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getChromeRuntime, getChromeRuntimeWithThrow } from 'utilities/src/chrome/chrome'
import { logger } from 'utilities/src/logger/logger'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'

// Passkey Auth Flow: Extension <> Web App
// For a detailed flow chart of how the Web App and the Extension exchange messages,
// check `apps/extension/src/app/features/onboarding/import/InitiatePasskeyAuth.tsx`.

// If we don't receive a response back from the extension in this time, we will show an error.
const EXTENSION_REFERRER_VERIFICATION_TIMEOUT = ONE_SECOND_MS * 3

enum ReferrerVerification {
  Verifying = 'Verifying',
  Allowed = 'Allowed',
  Denied = 'Denied',
}

export default function ExtensionPasskeyAuthPopUp() {
  const { t } = useTranslation()
  const extensionId = useExternallyConnectableExtensionId()

  const [signInAttemptStatus, setSignInAttemptStatus] = useState<ReferrerVerification>(ReferrerVerification.Verifying)
  const [passkeyRequestData, setPasskeyRequestData] = useState<PasskeyRequest | null>(null)

  const [searchParams] = useSearchParams()

  // biome-ignore lint/correctness/useExhaustiveDependencies: Intentionally only runs once on mount
  useEffect(() => {
    const chromeRuntime = getChromeRuntime()

    if (!chromeRuntime?.sendMessage) {
      // `chrome.runtime.sendMessage` should exist when the Extension is installed
      // and the URL matches the Extension's `externally_connectable` manifest field.
      logger.debug('ExtensionPasskeyAuthPopUp/index.tsx', 'useEffect', 'No `chrome.runtime` found')
      setSignInAttemptStatus(ReferrerVerification.Denied)
      return
    }

    const requestId = searchParams.get('request_id')

    if (!requestId) {
      logger.debug('ExtensionPasskeyAuthPopUp/index.tsx', 'useEffect', 'No `request_id` found')
      setSignInAttemptStatus(ReferrerVerification.Denied)
      return
    }

    const handleMessageRequestPasskey = async (message: unknown) => {
      const parsedMessage = parseMessage(message, PasskeyRequestSchema)

      if (!parsedMessage) {
        setSignInAttemptStatus(ReferrerVerification.Denied)
        return
      }

      logger.debug(
        'ExtensionPasskeyAuthPopUp/index.tsx',
        'handleMessageRequestPasskey',
        `Message received: ${parsedMessage.type}`,
      )

      setSignInAttemptStatus(ReferrerVerification.Allowed)
      setPasskeyRequestData(parsedMessage)
    }

    logger.debug(
      'ExtensionPasskeyAuthPopUp/index.tsx',
      'useEffect',
      `Sending PasskeySignInFlowOpened message to extension ID ${extensionId}`,
    )

    chromeRuntime.sendMessage(
      extensionId,
      {
        type: InterfaceToExtensionRequestType.PasskeySignInFlowOpened,
        requestId,
      } satisfies PasskeySignInFlowOpened,
      handleMessageRequestPasskey,
    )
  }, [])

  const onPressSignIn = async () => {
    if (signInAttemptStatus !== ReferrerVerification.Allowed || !passkeyRequestData) {
      logger.debug('ExtensionPasskeyAuthPopUp/index.tsx', 'onPressSignIn', 'Invalid state', {
        signInAttemptStatus,
        passkeyRequestData,
      })
      return
    }

    const chromeRuntime = getChromeRuntimeWithThrow()

    try {
      const credential = await authenticatePasskey(passkeyRequestData.challengeJson)

      if (!credential) {
        logger.debug(
          'ExtensionPasskeyAuthPopUp/index.tsx',
          'onPressSignIn',
          `Sending PasskeyCredentialError message to extension ID ${extensionId}`,
        )

        chromeRuntime.sendMessage(extensionId, {
          type: InterfaceToExtensionRequestType.PasskeyCredentialError,
          requestId: passkeyRequestData.requestId,
          error: 'No credential returned',
        } satisfies PasskeyCredentialError)

        return
      }

      logger.debug(
        'ExtensionPasskeyAuthPopUp/index.tsx',
        'onPressSignIn',
        `Sending PasskeyCredentialRetrieved message to extension ID ${extensionId}`,
      )

      chromeRuntime.sendMessage(extensionId, {
        type: InterfaceToExtensionRequestType.PasskeyCredentialRetrieved,
        requestId: passkeyRequestData.requestId,
        credential,
      } satisfies PasskeyCredentialRetrieved)
    } catch (error) {
      logger.error(error, {
        tags: {
          file: 'ExtensionPasskeyAuthPopUp/index.tsx',
          function: 'onPressSignIn',
        },
      })
    }
  }

  useTimeout(() => {
    setSignInAttemptStatus((currentStatus) => {
      return currentStatus === ReferrerVerification.Verifying ? ReferrerVerification.Denied : currentStatus
    })
  }, EXTENSION_REFERRER_VERIFICATION_TIMEOUT)

  return (
    <Trace logImpression page={InterfacePageName.ExtensionPasskeySignInPage}>
      <Flex flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
        <Flex width="400px" padding="$spacing16" flexDirection="column" gap="$spacing16">
          <Flex row justifyContent="flex-end">
            <Flex row width="fit-content">
              <Anchor
                target="_blank"
                rel="noreferrer"
                href={uniswapUrls.helpArticleUrls.passkeysInfo}
                textDecorationLine="none"
              >
                <Button icon={<EnvelopeHeart size="$icon.16" color="$neutral2" />} size="xxsmall" emphasis="secondary">
                  {t('common.getHelp.button')}
                </Button>
              </Anchor>
            </Flex>
          </Flex>

          <Flex alignItems="center">
            <UniswapLogo size="$icon.40" color="$accent1" />
          </Flex>

          {signInAttemptStatus === ReferrerVerification.Denied ? (
            <Flex alignItems="center" px="$spacing60">
              <Text variant="body3" textAlign="center">
                {/* TODO(6376): confirm what we want this to say */}
                {t('extensionPasskeyLogInPopUp.invalidReferrer')}
              </Text>
            </Flex>
          ) : (
            <>
              <Flex alignItems="center">
                <Text variant="subheading1">{t('nav.logIn.button')}</Text>
              </Flex>

              <Flex alignItems="center" px="$spacing60">
                <Text variant="body3" textAlign="center">
                  {t('extensionPasskeyLogInPopUp.description')}
                </Text>
              </Flex>

              <Flex row py="$spacing16">
                <Button
                  icon={signInAttemptStatus === ReferrerVerification.Verifying ? <SpinningLoader /> : <Passkey />}
                  size="large"
                  variant="branded"
                  onPress={onPressSignIn}
                  isDisabled={signInAttemptStatus !== ReferrerVerification.Allowed}
                >
                  {signInAttemptStatus === ReferrerVerification.Allowed ? t('nav.logIn.button') : undefined}
                </Button>
              </Flex>
            </>
          )}
        </Flex>
      </Flex>
    </Trace>
  )
}
