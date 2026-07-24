import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { Button, Flex, ModalCloseIcon, Separator, SpinningLoader, Text } from 'ui/src'
import { AppleLogo } from 'ui/src/components/icons/AppleLogo'
import { Envelope } from 'ui/src/components/icons/Envelope'
import { GoogleLogoGradient } from 'ui/src/components/icons/GoogleLogoGradient'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { Person } from 'ui/src/components/icons/Person'
import { iconSizes } from 'ui/src/theme'
import { OptionRow } from 'uniswap/src/components/passkey/recovery/OptionRow'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

type OAuthProvider = 'google' | 'apple'

interface Props {
  t: TFunction
  /**
   * Default close target. Rendered as an X button in the top-right unless `headerActions`
   * is provided, in which case the caller owns the header content.
   */
  handleClose: () => void
  /**
   * Replaces the default close X in the top-right. Pass `null` to suppress the header row
   * entirely (e.g., extension popup where the Chrome window already has a close button,
   * or mobile where the Help link lives in the native nav header instead).
   */
  headerActions?: ReactNode | null
  /** Shown when provided. Omit on surfaces that just came from a failed passkey attempt. */
  onContinueWithPasskey?: () => void
  isPasskeyLoading?: boolean
  /** Defaults to true. When false, all login tiles are disabled while Privy initializes. */
  isReady?: boolean
  onSelectEmail: () => void
  onSelectApple: () => void
  onSelectGoogle: () => void
  oauthLoadingProvider?: OAuthProvider | null
}

/**
 * "Log in" method-selection screen — the entry point into the recovery-based graduation
 * flow (email / OAuth + PIN → seed-phrase export). Extracted from
 * `EmbeddedWalletModal`'s `showLoginView` branch so extension, web modal, and mobile all
 * share the same visual.
 *
 * Passkey option is opt-in (`onContinueWithPasskey`) since the recovery flow is typically
 * reached after a passkey failure — callers decide whether offering a retry makes sense.
 */
export function RecoveryLoginStep({
  t,
  handleClose,
  headerActions,
  onContinueWithPasskey,
  isPasskeyLoading,
  isReady = true,
  onSelectEmail,
  onSelectApple,
  onSelectGoogle,
  oauthLoadingProvider,
}: Props): JSX.Element {
  const anyOauthInFlight = oauthLoadingProvider !== null && oauthLoadingProvider !== undefined
  // Passkey-in-flight also blocks the email/OAuth tiles so the user doesn't kick off a
  // second ceremony before the first one finishes.
  const disableOauth = anyOauthInFlight || isPasskeyLoading === true || !isReady

  return (
    <Trace logImpression modal={ModalName.RecoverWallet}>
      {headerActions !== null && (
        <Flex row width="100%" justifyContent="flex-end" alignItems="center">
          {headerActions ?? <ModalCloseIcon testId={TestID.StepHeaderClose} size="$icon.20" onClose={handleClose} />}
        </Flex>
      )}

      <Flex gap="$gap16" alignItems="center" py="$padding16">
        <Flex
          p="$spacing12"
          backgroundColor="$accent2"
          borderRadius="$rounded16"
          width={48}
          height={48}
          alignItems="center"
          justifyContent="center"
        >
          <Person size="$icon.24" color="$accent1" />
        </Flex>
        <Text variant="subheading1">{t('nav.logIn.button')}</Text>
      </Flex>

      <Flex gap="$gap12" width="100%">
        {onContinueWithPasskey && (
          <>
            <Trace logPress element={ElementName.LoginWithPasskey}>
              <Flex row alignSelf="stretch">
                <Button
                  variant="branded"
                  size="medium"
                  disabled={isPasskeyLoading || disableOauth}
                  icon={
                    isPasskeyLoading ? (
                      <SpinningLoader size={20} color="$white" />
                    ) : (
                      <Passkey size="$icon.20" color="$white" />
                    )
                  }
                  onPress={onContinueWithPasskey}
                >
                  {isPasskeyLoading ? undefined : t('account.passkey.login.continueWithPasskey')}
                </Button>
              </Flex>
            </Trace>
            <Flex row alignItems="center" justifyContent="center" width="100%" gap="$gap16" px="$spacing12">
              <Separator />
              <Text variant="body4" color="$neutral3">
                {t('common.or')}
              </Text>
              <Separator />
            </Flex>
          </>
        )}

        <Flex borderRadius="$rounded16" overflow="hidden" gap="$spacing2" width="100%">
          <OptionRow
            icon={<AppleLogo size={iconSizes.icon20} color="$neutral1" />}
            label={t('account.passkey.backupLogin.add.apple')}
            element={ElementName.LoginWithApple}
            loading={oauthLoadingProvider === 'apple'}
            disabled={(disableOauth && oauthLoadingProvider !== 'apple') || !isReady}
            onPress={onSelectApple}
          />
          <OptionRow
            icon={<GoogleLogoGradient size={iconSizes.icon20} />}
            label={t('account.passkey.backupLogin.add.google')}
            element={ElementName.LoginWithGoogle}
            loading={oauthLoadingProvider === 'google'}
            disabled={(disableOauth && oauthLoadingProvider !== 'google') || !isReady}
            onPress={onSelectGoogle}
          />
          <OptionRow
            icon={<Envelope size="$icon.20" color="$blueBase" />}
            label={t('account.passkey.backupLogin.add.email')}
            element={ElementName.LoginWithEmail}
            disabled={disableOauth}
            onPress={onSelectEmail}
          />
        </Flex>
      </Flex>
    </Trace>
  )
}
