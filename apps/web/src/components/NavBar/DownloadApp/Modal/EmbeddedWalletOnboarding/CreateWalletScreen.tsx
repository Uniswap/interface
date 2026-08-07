import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { type EmbeddedWalletUnitagSource } from 'uniswap/src/features/telemetry/types'
import { useCanClaimUnitagName } from 'uniswap/src/features/unitags/hooks/useCanClaimUnitagName'
import type { SuggestedUnitag } from 'uniswap/src/features/unitags/suggestions/useSuggestedUnitag'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useEvent } from 'utilities/src/react/hooks'
import { ModalContent } from '~/components/NavBar/DownloadApp/Modal/Content'
import { SuggestedUnitagInput } from '~/components/NavBar/DownloadApp/Modal/EmbeddedWalletOnboarding/SuggestedUnitagInput'
import { PasskeyIconHeader } from '~/components/NavBar/DownloadApp/Modal/PasskeyIconHeader'
import { useSignInWithPasskey } from '~/hooks/useSignInWithPasskey'

// How long the success state (checkmark + copy) stays visible before the modal closes.
const SUCCESS_STATE_DISPLAY_MS = 500

export function CreateWalletScreen({
  suggested,
  onClose,
  goBack,
}: {
  suggested: SuggestedUnitag
  onClose: () => void
  goBack: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const [unitagSource, setUnitagSource] = useState<EmbeddedWalletUnitagSource>('prefilled')
  const [hasWalletCreationSuccess, setHasWalletCreationSuccess] = useState(false)

  // Adopt the suggested name whenever it changes (initial prefill + each shuffle), unless the user
  // has manually edited the field: a late-arriving suggestion must not clobber typed input.
  useEffect(() => {
    if (suggested.suggestion && unitagSource !== 'edited') {
      setValue(suggested.suggestion)
    }
  }, [suggested.suggestion, unitagSource])

  const handleChangeText = useEvent((text: string) => {
    setValue(text)
    setUnitagSource('edited')
  })

  // shuffle() updates suggested.suggestion, which the effect above adopts; mark the source first.
  const handleShuffle = useEvent(() => {
    setUnitagSource('shuffled')
    suggested.shuffle()
  })

  const { error, loading, isDebouncing } = useCanClaimUnitagName({
    unitag: value || undefined,
    unavailableErrorMessage: t('embeddedWallet.onboarding.create.error.unavailable'),
  })
  // The check lags typing by the debounce, so only trust it once it has caught up.
  const isChecked = !isDebouncing && !loading
  const checkedError = isChecked ? error : undefined
  // Generator suggestions are pre-verified available, so trust them immediately instead of blinking
  // the CTA disabled while the debounced check re-confirms each prefill/shuffle. Typed input stays
  // gated on the caught-up check; a rare disagreement on a suggestion still lands via checkedError.
  const isAvailable = Boolean(value) && (unitagSource === 'edited' ? isChecked && !error : !checkedError)

  const onSuccess = useEvent(async () => {
    setHasWalletCreationSuccess(true)
    await new Promise((resolve) => setTimeout(resolve, SUCCESS_STATE_DISPLAY_MS))
    onClose()
  })

  const { signInWithPasskey, isPending } = useSignInWithPasskey({
    createNewWallet: true,
    unitag: value,
    unitagSource,
    onSuccess,
  })

  const canCreate = isAvailable && !isPending && !suggested.isInitializing && !hasWalletCreationSuccess

  // Hide the error while the check hasn't caught up with fresh input (per design, editing clears it),
  // and once creation starts: the availability query can refetch and report the now self-claimed
  // unitag as taken, which would be a false error through the success state.
  const displayedError = isPending || hasWalletCreationSuccess ? undefined : checkedError

  return (
    <Trace logImpression modal={ModalName.EmbeddedWalletCreate}>
      <ModalContent
        title={t('onboarding.keyManagement.title')}
        subtext={
          // Max width per the mock so the copy wraps after "and".
          <Text variant="body2" color="$neutral2" textAlign="center" maxWidth={386}>
            {t('embeddedWallet.onboarding.create.subtitle')}
          </Text>
        }
        header={<PasskeyIconHeader />}
        onClose={onClose}
        goBack={goBack}
        // 24px between the body copy and the input, per the mock.
        gap="$spacing24"
      >
        <Flex width="100%" gap="$spacing24">
          <SuggestedUnitagInput
            value={value}
            isShuffling={suggested.isShuffling}
            error={displayedError}
            onChangeText={handleChangeText}
            onShuffle={handleShuffle}
          />
          <Flex row alignSelf="stretch">
            <Trace logPress element={ElementName.CreatePasskey}>
              <Button
                testID={TestID.CreatePasskey}
                variant="branded"
                size="large"
                icon={hasWalletCreationSuccess ? <Check size="$icon.24" color="$neutral2" /> : undefined}
                disabled={!canCreate}
                loading={isPending && !hasWalletCreationSuccess}
                onPress={() => signInWithPasskey()}
              >
                {hasWalletCreationSuccess
                  ? t('onboarding.passkey.create.success')
                  : isPending
                    ? t('onboarding.passkey.create.pending')
                    : t('embeddedWallet.onboarding.create.button')}
              </Button>
            </Trace>
          </Flex>
        </Flex>
      </ModalContent>
    </Trace>
  )
}
