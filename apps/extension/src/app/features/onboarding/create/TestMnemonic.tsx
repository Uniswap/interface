import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { Input } from 'src/app/components/Input'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { useOnboardingSteps } from 'src/app/features/onboarding/OnboardingSteps'
import { Flex, Square, Text } from 'ui/src'
import { Check, FileListCheck } from 'ui/src/components/icons'
import { iconSizes, zIndexes } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ExtensionOnboardingFlow, ExtensionOnboardingScreens } from 'uniswap/src/types/screens/extension'
import { useDebounce } from 'utilities/src/time/timing'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { PASSWORD_VALIDATION_DEBOUNCE_MS } from 'wallet/src/utils/password'

export function TestMnemonic({ numberOfTests = 3 }: { numberOfTests?: number }): JSX.Element {
  const { t } = useTranslation()

  const { getOnboardingAccountAddress, getOnboardingAccountMnemonic } = useOnboardingContext()
  const onboardingAccountAddress = getOnboardingAccountAddress()
  const onboardingAccountMnemonic = getOnboardingAccountMnemonic()

  const { goToNextStep, goToPreviousStep } = useOnboardingSteps()

  const [completedTests, markTestCompleted] = useReducer((v: number) => v + 1, 0)
  const [userWordInput, setUserWordInput] = useState<string>('')
  const [hasError, setHasError] = useState(false)

  const isLastTest = completedTests === numberOfTests - 1

  // Pick NUMBER_OF_TESTS random words
  const testingWordIndexes = useMemo(
    () =>
      onboardingAccountMnemonic ? selectRandomNumbers(onboardingAccountMnemonic.length, numberOfTests) : undefined,
    [onboardingAccountMnemonic, numberOfTests],
  )

  // Save the next word index for reuse, ensuring it's not undefined
  const nextWordIndex = useMemo(() => testingWordIndexes?.[completedTests] ?? 0, [completedTests, testingWordIndexes])
  const nextWordNumber = nextWordIndex + 1
  const validWord = userWordInput === onboardingAccountMnemonic?.[nextWordIndex]
  const isComplete = validWord && isLastTest

  useEffect(() => {
    if (validWord) {
      setTimeout(() => {
        if (!isLastTest) {
          markTestCompleted()
          setUserWordInput('')
        } else {
          goToNextStep()
        }
      }, 200)
    }
  }, [validWord, goToNextStep, isLastTest])

  const debouncedWord = useDebounce(userWordInput, PASSWORD_VALIDATION_DEBOUNCE_MS)
  useEffect(() => {
    setHasError(!!debouncedWord && debouncedWord !== onboardingAccountMnemonic?.[nextWordIndex])
  }, [debouncedWord, onboardingAccountMnemonic, nextWordIndex])

  const onNext = useCallback((): void => {
    if (!onboardingAccountMnemonic || !onboardingAccountAddress) {
      return
    }

    goToNextStep()
  }, [onboardingAccountMnemonic, goToNextStep, onboardingAccountAddress])

  return (
    <Trace
      logImpression
      properties={{ flow: ExtensionOnboardingFlow.New }}
      screen={ExtensionOnboardingScreens.ConfirmSeedPhrase}
    >
      <OnboardingScreen
        Icon={
          <Square alignSelf="center" backgroundColor="$surface2" borderRadius="$rounded12" size={iconSizes.icon48}>
            <FileListCheck color="$neutral1" size={iconSizes.icon24} />
          </Square>
        }
        nextButtonEnabled={false}
        nextButtonText={t('onboarding.backup.manual.progress', {
          completedStepsCount: isComplete ? numberOfTests : completedTests,
          totalStepsCount: numberOfTests,
        })}
        nextButtonVariant="default"
        nextButtonEmphasis="secondary"
        subtitle={t('onboarding.backup.manual.subtitle', { count: nextWordNumber, ordinal: true })}
        title={t('onboarding.backup.manual.title')}
        onBack={goToPreviousStep}
        onSkip={onNext}
        onSubmit={onNext}
      >
        <Flex fill gap="$spacing24" mb="$spacing24" width="100%">
          <RecoveryPhraseInputStack
            isInputValid={validWord}
            nextWordNumber={nextWordNumber}
            numInputsBelow={numberOfTests - completedTests}
            numTotalSteps={numberOfTests}
            value={userWordInput}
            onChangeText={(value) => {
              setUserWordInput(value)
              if (hasError) {
                setHasError(false)
              }
            }}
          />
          <Text color="$statusCritical" style={{ opacity: hasError ? 1 : 0 }} textAlign="center" variant="body3">
            {t('onboarding.backup.manual.error')}
          </Text>
        </Flex>
      </OnboardingScreen>
    </Trace>
  )
}

type InputStackBaseProps = {
  value?: string
  onChangeText: (word: string) => void
}

function RecoveryPhraseInputStack({
  nextWordNumber,
  numInputsBelow,
  numTotalSteps,
  isInputValid,
  value,
  onChangeText,
}: InputStackBaseProps & {
  numInputsBelow: number
  numTotalSteps: number
  nextWordNumber: number
  isInputValid: boolean
}): JSX.Element {
  return (
    <Flex gap="$spacing12">
      <Flex row position="relative" width="100%">
        {isInputValid ? (
          <Flex
            fill
            row
            bottom="$spacing16"
            justifyContent="flex-end"
            position="absolute"
            right="$spacing24"
            width="100%"
            zIndex={zIndexes.fixed}
          >
            <Check color="$statusSuccess" size={iconSizes.icon24} />
          </Flex>
        ) : null}
        <InputStack
          current={numTotalSteps - numInputsBelow}
          prefixText={String(nextWordNumber).padStart(2, '0')}
          total={numTotalSteps}
          value={value}
          onChangeText={onChangeText}
        />
      </Flex>
    </Flex>
  )
}

type InputStackProps = InputStackBaseProps & {
  total: number
  current: number
  prefixText: string
}

function InputStack({ onChangeText, total, value, current, prefixText }: InputStackProps): JSX.Element {
  const { t } = useTranslation()
  const refs = useRef<TextInput[]>([])
  const prefixTexts = useRef<string[]>([])

  // this is weird because we only get the new word as it renders
  // but avoiding a bit of a refactor before beta release, should be safe:
  prefixTexts.current[current] ||= prefixText

  useEffect(() => {
    // Wait until the next tick to focus the input, otherwise the state update interferes with the focus event.
    setTimeout(() => {
      refs.current?.[current]?.focus()
    }, 1)
  }, [current])

  return (
    <Flex height={60} mt={20 + total * 10} width="100%">
      {new Array(total).fill(0).map((_, i) => {
        const isHidden = i < current
        const isCurrentlyActive = i === current
        const isBelow = i > current
        const belowOffset = i - current

        return (
          <Flex
            key={i}
            animation={isHidden ? 'stiff' : 'quickishDelayed'}
            bottom={0}
            left={0}
            opacity={1}
            pointerEvents={isCurrentlyActive ? 'auto' : 'none'}
            position="absolute"
            right={0}
            scale={1}
            top={0}
            y={0}
            {...(isBelow && {
              zIndex: -belowOffset,
              y: belowOffset * -12,
              opacity: 1,
            })}
            {...(isHidden && {
              y: 12,
              opacity: 0,
              scale: 0.97,
              zIndex: 100,
            })}
          >
            <Text
              color="$neutral2"
              mt={20}
              position="absolute"
              px="$spacing24"
              variant="subheading1"
              zIndex={zIndexes.fixed}
            >
              {prefixTexts.current[i] || ''}
            </Text>
            <Input
              ref={(inputNode) => {
                if (inputNode) {
                  refs.current[i] = inputNode
                }
              }}
              centered
              large
              borderColor="$surface3"
              borderRadius="$rounded20"
              flex={1}
              placeholder={t('onboarding.backup.manual.placeholder')}
              shadowColor="$shadowColor"
              shadowOffset={{ width: 0, height: 4 }}
              shadowOpacity={0.4}
              shadowRadius={10}
              value={value}
              zIndex={zIndexes.sticky}
              onChangeText={onChangeText}
            />
          </Flex>
        )
      })}
    </Flex>
  )
}

function selectRandomNumbers(maxNumber: number, numberOfNumbers: number): number[] {
  const shuffledIndexes = [...Array(maxNumber).keys()].sort(() => 0.5 - Math.random())
  const selectedIndexes = shuffledIndexes.slice(0, numberOfNumbers)
  selectedIndexes.sort((a, b) => a - b)
  return selectedIndexes
}
