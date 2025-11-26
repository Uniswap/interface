import { createRef, RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NativeSyntheticEvent, TextInput, TextInputChangeEventData, TextInputKeyPressEventData } from 'react-native'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { useScantasticContext } from 'src/app/features/onboarding/scan/ScantasticContextProvider'
import { decryptMessage } from 'src/app/features/onboarding/scan/utils'
import { Flex, Input, inputStyles, Square, Text } from 'ui/src'
import { Mobile } from 'ui/src/components/icons'
import { fonts, iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { logger } from 'utilities/src/logger/logger'
import { arraysAreEqual } from 'utilities/src/primitives/array'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useInterval, useTimeout } from 'utilities/src/time/timing'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { getOtpDurationString } from 'wallet/src/utils/duration'

const MAX_FAILED_OTP_ATTEMPTS = 3

type CharacterSequence = [string, string, string, string, string, string]
const INITIAL_CHARACTER_SEQUENCE: CharacterSequence = ['', '', '', '', '', '']

export function OTPInput(): JSX.Element {
  const { t } = useTranslation()
  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()

  const { addOnboardingAccountMnemonic } = useOnboardingContext()
  const { privateKey, resetScantastic, sessionUUID, expirationTimestamp } = useScantasticContext()
  const resetFlowAndNavBack = useCallback((): void => {
    resetScantastic()
    goToPreviousStep()
  }, [goToPreviousStep, resetScantastic])

  const [expiryText, setExpiryText] = useState(getOtpDurationString(expirationTimestamp))

  const setExpirationText = useCallback(() => {
    const expirationString = getOtpDurationString(expirationTimestamp)
    setExpiryText(expirationString)
  }, [expirationTimestamp])
  useInterval(setExpirationText, ONE_SECOND_MS)

  if (!sessionUUID || !privateKey) {
    resetFlowAndNavBack()
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [failedAttemptCount, setFailedAttemptCount] = useState<number>(0)
  const [characterSequence, setCharacterSequence] = useState<CharacterSequence>(INITIAL_CHARACTER_SEQUENCE)

  const inputRefs = useRef<RefObject<TextInput | null>[]>([])
  inputRefs.current = new Array(6).fill(null).map((_, i) => inputRefs.current[i] || createRef<TextInput>())

  // Add all accounts from mnemonic.
  const onSubmit = useCallback(
    async (mnemonic: string[]) => {
      addOnboardingAccountMnemonic(mnemonic)
      goToNextStep()
    },
    [goToNextStep, addOnboardingAccountMnemonic],
  )

  useEffect(() => {
    if (error && !arraysAreEqual(characterSequence, INITIAL_CHARACTER_SEQUENCE)) {
      setCharacterSequence(INITIAL_CHARACTER_SEQUENCE)
    }
  }, [error, characterSequence])

  const submitOTP = useCallback(async (): Promise<void> => {
    if (!privateKey || !sessionUUID) {
      return
    }
    setError(false)
    setLoading(true)
    // submit OTP to receive blob
    const response = await fetch(`${uniswapUrls.scantasticApiUrl}/otp`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uuid: sessionUUID,
        otp: characterSequence.join(''),
      }),
    })

    if (!response.ok) {
      setCharacterSequence(INITIAL_CHARACTER_SEQUENCE)
      throw new Error(`Failed to submit OTP: ${await response.text()}`)
    }

    const data = (await response.json()) as { encryptedSeed?: string; OTPFailedAttempts?: number }
    if (!data.encryptedSeed) {
      if (data.OTPFailedAttempts) {
        if (Number(data.OTPFailedAttempts) === MAX_FAILED_OTP_ATTEMPTS) {
          resetFlowAndNavBack()
          return
        } else {
          setFailedAttemptCount(data.OTPFailedAttempts)
          return
        }
      }
      throw new Error(`fetch(${uniswapUrls.scantasticApiUrl}/otp failed to include an encrypted seed`)
    }
    const preImage = await decryptMessage(privateKey, data.encryptedSeed)
    const words = preImage.split(' ')

    const newMnemonic = Array(24)
      .fill('')
      .map((_, i) => (words[i] || '') as string)
      .filter((word) => !!word)

    await onSubmit(newMnemonic)
  }, [privateKey, sessionUUID, characterSequence, onSubmit, resetFlowAndNavBack])

  const handleChange = useCallback(
    (index: number) =>
      (event: NativeSyntheticEvent<TextInputChangeEventData>): void => {
        setError(false)
        const newCharacters: CharacterSequence = [...characterSequence]
        newCharacters[index] = event.nativeEvent.text
        setCharacterSequence(newCharacters)

        if (newCharacters[index]?.length === 1 && inputRefs.current[index + 1]?.current) {
          inputRefs.current[index + 1]?.current?.focus()
        }
      },
    [characterSequence],
  )

  const handleKeyPress = useCallback(
    (index: number) =>
      (event: NativeSyntheticEvent<TextInputKeyPressEventData>): void => {
        if (index !== 0 && event.nativeEvent.key === 'Backspace') {
          inputRefs.current[index - 1]?.current?.focus()
        }
      },
    [],
  )

  useEffect(() => {
    const allCharactersFilled = characterSequence.every((element) => element !== '')
    if (allCharactersFilled && !loading && !error) {
      submitOTP()
        .catch((e) => {
          inputRefs.current[0]?.current?.focus()
          logger.error(e, {
            tags: { file: 'OTPInput.tsx', function: 'submitOTP' },
            extra: { uuid: sessionUUID },
          })
          setError(true)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [characterSequence, loading, error, sessionUUID, submitOTP])

  useTimeout(resetFlowAndNavBack, expirationTimestamp - Date.now())

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.Scantastic }}
      screen={ExtensionOnboardingScreens.EnterOTP}
    >
      <OnboardingScreen
        Icon={
          <Square
            backgroundColor="$surface2"
            borderRadius="$rounded12"
            height={iconSizes.icon48}
            width={iconSizes.icon48}
          >
            <Mobile color="$neutral1" size="$icon.24" />
          </Square>
        }
        nextButtonEnabled={false}
        nextButtonText={expiryText}
        nextButtonVariant="default"
        nextButtonEmphasis="secondary"
        subtitle={t('onboarding.scan.otp.subtitle')}
        title={t('onboarding.scan.otp.title')}
        onBack={resetFlowAndNavBack}
        onSubmit={(): void => undefined}
      >
        <Flex gap="$spacing16" mb="$spacing60" mt="$spacing48">
          <Flex alignContent="center" alignItems="center" flexDirection="row" gap="$spacing8" position="relative">
            {characterSequence.map((character, index) => (
              <Input
                key={index}
                ref={inputRefs.current[index]}
                autoFocus={index === 0}
                backgroundColor={character ? '$surface1' : '$surface2'}
                borderColor="$surface3"
                borderRadius="$rounded16"
                borderWidth="$spacing1"
                disabled={loading}
                focusStyle={inputStyles.inputFocus}
                fontSize={fonts.heading3.fontSize}
                height="$spacing60"
                hoverStyle={inputStyles.inputHover}
                maxLength={1}
                p="$spacing20"
                placeholderTextColor="$neutral3"
                textAlign="center"
                value={character}
                width="$spacing60"
                onChange={handleChange(index)}
                onKeyPress={handleKeyPress(index)}
              />
            ))}
          </Flex>

          {error && (
            <Text color="$statusCritical" textAlign="center" variant="body2">
              {t('onboarding.scan.otp.error')}
            </Text>
          )}
          {failedAttemptCount > 0 && (
            <Text color="$statusCritical" textAlign="center" variant="body2">
              {t('onboarding.scan.otp.failed', { number: failedAttemptCount })}
            </Text>
          )}
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}
