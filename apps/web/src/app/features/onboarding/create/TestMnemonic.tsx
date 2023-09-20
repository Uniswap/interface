import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import { TextInput } from 'react-native'
import { useNavigate } from 'react-router-dom'
import { Input } from 'src/app/components/Input'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { UniconWithLockIcon } from 'src/app/features/onboarding/UniconWithLockIcon'
import {
  CreateOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Flex, Text } from 'ui/src'

export function TestMnemonic({ numberOfTests = 4 }: { numberOfTests?: number }): JSX.Element {
  const navigate = useNavigate()

  const { pendingAddress: createdAddress, pendingMnemonic: createdMnemonic } =
    useOnboardingContext()
  const [completedTests, markTestCompleted] = useReducer((v: number) => v + 1, 0)
  const [userWordInput, setUserWordInput] = useState<string>('')
  const inputRef = useRef<TextInput>(null)

  const isLastTest = useCallback(
    (): boolean => completedTests === numberOfTests - 1,
    [completedTests, numberOfTests]
  )

  // Pick NUMBER_OF_TESTS random words
  const testingWordIndexes = useMemo(
    () =>
      createdMnemonic ? selectRandomNumbers(createdMnemonic.length, numberOfTests) : undefined,
    [createdMnemonic, numberOfTests]
  )

  // Save the next word index for reuse, ensuring it's not undefined
  const nextWordIndex = useMemo(
    () => testingWordIndexes?.[completedTests] ?? 0,
    [completedTests, testingWordIndexes]
  )
  const nextWordNumber = nextWordIndex + 1

  const onNext = useCallback((): void => {
    if (!createdMnemonic || !createdAddress) {
      return
    }
    const validWord = userWordInput === createdMnemonic[nextWordIndex]
    if (validWord && isLastTest()) {
      navigate(
        `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.Naming}`,
        { replace: true }
      )
    } else if (validWord) {
      markTestCompleted()
      setUserWordInput('')
      // Wait until the next tick to focus the input, otherwise the state update interferes with the focus event.
      setTimeout(() => inputRef.current?.focus(), 1)
    } else {
      // TODO error state / notify user in some way, not yet designed
    }
  }, [createdAddress, createdMnemonic, isLastTest, navigate, nextWordIndex, userWordInput])

  return (
    <OnboardingScreen
      nextButtonEnabled
      Icon={<UniconWithLockIcon address={createdAddress ?? ''} />}
      nextButtonText="Next"
      subtitle="Let's make sure you’ve recorded it down"
      title={
        <Flex px="$spacing36">
          <Text variant="headlineMedium">
            What's the <Text color="$accent1">{getNumberWithOrdinal(nextWordNumber)} </Text> word of
            your recovery phrase?
          </Text>
        </Flex>
      }
      onBack={(): void =>
        navigate(
          `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.ViewMnemonic}`,
          {
            replace: true,
          }
        )
      }
      onSubmit={onNext}>
      <Flex row position="relative" width="100%">
        <Text color="$neutral3" p="$spacing24" position="absolute" variant="headlineSmall">
          {String(nextWordNumber).padStart(2, '0')}
        </Text>
        <Input
          ref={inputRef}
          centered
          large
          placeholder=""
          value={userWordInput}
          onChangeText={setUserWordInput}
          onSubmitEditing={onNext}
        />
      </Flex>
    </OnboardingScreen>
  )
}

// https://stackoverflow.com/a/31615643
function getNumberWithOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

function selectRandomNumbers(maxNumber: number, numberOfNumbers: number): number[] {
  const shuffledIndexes = [...Array(maxNumber).keys()].sort(() => 0.5 - Math.random())
  const selectedIndexes = shuffledIndexes.slice(0, numberOfNumbers)
  selectedIndexes.sort((a, b) => a - b)
  return selectedIndexes
}
