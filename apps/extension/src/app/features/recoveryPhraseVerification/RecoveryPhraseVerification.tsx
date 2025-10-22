import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TextInput } from 'react-native'
import { Input } from 'src/app/components/Input'
import { Flex, Text } from 'ui/src'
import { Check } from 'ui/src/components/icons'
import { zIndexes } from 'ui/src/theme'
import { useDebounce } from 'utilities/src/time/timing'
import { PASSWORD_VALIDATION_DEBOUNCE_MS } from 'wallet/src/utils/password'

type InputStackBaseProps = {
  value?: string
  onChangeText: (word: string) => void
}

export function RecoveryPhraseVerification({
  mnemonic,
  numberOfTests,
  onWordVerified,
  setHasError,
  setSubtitle,
  onComplete,
}: {
  mnemonic: string[]
  numberOfTests: number
  onWordVerified: (numberOfWordsVerified: number) => void
  setHasError: (hasError: boolean) => void
  setSubtitle: (subtitle: string) => void
  onComplete: () => void
}): JSX.Element {
  const { t } = useTranslation()

  const [numberOfVerifiedWords, markCurrentWordVerified] = useReducer((v: number) => v + 1, 0)
  const [userWordInput, setUserWordInput] = useState<string>('')

  const isLastTest = numberOfVerifiedWords === numberOfTests - 1

  // Pick `numberOfTests` random words
  const testingWordIndexes = useMemo(
    () => selectRandomNumbers(mnemonic.length, numberOfTests),
    [mnemonic.length, numberOfTests],
  )

  const nextWordIndex = testingWordIndexes[numberOfVerifiedWords] ?? 0
  const nextWordNumber = nextWordIndex + 1
  const validWord = userWordInput === mnemonic[nextWordIndex]

  useEffect(() => {
    setSubtitle(t('onboarding.backup.manual.subtitle', { count: nextWordNumber, ordinal: true }))
  }, [nextWordNumber, setSubtitle, t])

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only want to run when verification state changes, not callbacks which are stable
  useEffect(() => {
    if (numberOfVerifiedWords === 0) {
      return
    }

    const isComplete = numberOfVerifiedWords === numberOfTests

    if (isComplete) {
      onComplete()
      return
    }

    onWordVerified(numberOfVerifiedWords)

    // We only want this to run when the `numberOfTests` or `numberOfVerifiedWords` changes.
  }, [numberOfTests, numberOfVerifiedWords])

  // biome-ignore lint/correctness/useExhaustiveDependencies: markCurrentWordVerified and setUserWordInput are stable, others are needed for correct behavior timing
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined

    if (validWord) {
      timeout = setTimeout(() => {
        markCurrentWordVerified()
        setUserWordInput('')
      }, 200)
    }

    return () => clearTimeout(timeout)
  }, [validWord, isLastTest, onComplete, onWordVerified, numberOfVerifiedWords])

  const debouncedWord = useDebounce(userWordInput, PASSWORD_VALIDATION_DEBOUNCE_MS)

  useEffect(() => {
    setHasError(!!debouncedWord && debouncedWord !== mnemonic[nextWordIndex])
  }, [debouncedWord, nextWordIndex, mnemonic, setHasError])

  return (
    <RecoveryPhraseInputStack
      isInputValid={validWord}
      nextWordNumber={nextWordNumber}
      numInputsBelow={numberOfTests - numberOfVerifiedWords}
      numTotalSteps={numberOfTests}
      value={userWordInput}
      onChangeText={(value) => {
        setUserWordInput(value)
        setHasError(false)
      }}
    />
  )
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
      <Flex row position="relative" width="100%" zIndex={zIndexes.background}>
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
            <Check color="$statusSuccess" size="$icon.24" />
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
      refs.current[current]?.focus()
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
