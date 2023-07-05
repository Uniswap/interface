import { useCallback, useMemo, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { UniconWithLockIcon } from 'src/app/features/onboarding/UniconWithLockIcon'
import {
  CreateOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Input, Text, XStack } from 'ui/src'
import { inputStyles } from 'ui/src/components/input/utils'

export function TestMnemonic({ numberOfTests = 4 }: { numberOfTests?: number }): JSX.Element {
  const navigate = useNavigate()

  const { pendingAddress: createdAddress, pendingMnemonic: createdMnemonic } =
    useOnboardingContext()
  const [completedTests, markTestCompleted] = useReducer((v: number) => v + 1, 0)
  const [userWordInput, setUserWordInput] = useState<string>('')

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
        `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.Naming}`
      )
    } else if (validWord) {
      markTestCompleted()
      setUserWordInput('')
    } else {
      // TODO error state / notify user in some way, not yet designed
    }
  }, [createdAddress, createdMnemonic, isLastTest, navigate, nextWordIndex, userWordInput])

  return (
    <OnboardingScreen
      nextButtonEnabled
      Icon={<UniconWithLockIcon address={createdAddress ?? ''} />}
      nextButtonText="Next"
      subtitle="Let's make sure you've recorded it down"
      title={
        <Text variant="headlineSmall">
          What's the <Text color="$magentaVibrant">{getNumberWithOrdinal(nextWordNumber)} </Text>{' '}
          word of your recovery phrase?
        </Text>
      }
      onSubmit={onNext}>
      <XStack
        borderColor="$backgroundOutline"
        borderRadius="$rounded12"
        borderWidth={1}
        focusStyle={inputStyles.inputFocus}
        hoverStyle={inputStyles.inputHover}>
        <Text
          color="$textTertiary"
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
          variant="bodyLarge">
          {String(nextWordNumber).padStart(2, '0')}
        </Text>
        <Input
          autoFocus
          backgroundColor="$background1"
          borderColor="$backgroundOutline"
          borderRadius="$rounded12"
          borderWidth={0}
          focusStyle={inputStyles.noOutline}
          height="auto"
          hoverStyle={inputStyles.noOutline}
          paddingHorizontal="$spacing16"
          paddingVertical="$spacing12"
          placeholder=""
          placeholderTextColor="$textTertiary"
          value={userWordInput}
          width="100%"
          onChangeText={setUserWordInput}
          onSubmitEditing={onNext}
        />
      </XStack>
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
