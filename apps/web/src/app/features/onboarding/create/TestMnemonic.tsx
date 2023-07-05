import { useCallback, useMemo, useReducer, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { UniconWithLockIcon } from 'src/app/features/onboarding/UniconWithLockIcon'
import {
  CreateOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Input, Stack, Text, XStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { inputStyles } from 'ui/src/components/input/utils'
import { EMPTY_ARRAY } from 'wallet/src/constants/misc'

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
  const testingWordIndexes: number[] = useMemo(() => {
    return createdMnemonic
      ? selectRandomNumbers(createdMnemonic.length, numberOfTests)
      : EMPTY_ARRAY
  }, [createdMnemonic, numberOfTests])

  // Save the next word index for reuse, ensuring it's not undefined
  const nextWordIndex = useMemo(
    () => testingWordIndexes[completedTests] || 0,
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
    <Stack alignItems="center" gap="$spacing36" minWidth={450}>
      <UniconWithLockIcon address={createdAddress ?? ''} />
      <Text variant="headlineSmall">
        What's the <Text color="$magentaVibrant">{getNumberWithOrdinal(nextWordNumber)} </Text> word
        of your recovery phrase?
      </Text>
      <Text color="$textTertiary" variant="bodyLarge">
        Let's make sure you've recorded it down
      </Text>
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
        />
      </XStack>
      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <Button flexGrow={1} theme="primary" onPress={onNext}>
          Next
        </Button>
      </XStack>
    </Stack>
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
