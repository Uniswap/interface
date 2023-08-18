import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HideContentShield } from 'src/app/components/hideContent/HideContentShield'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { OnboardingScreen } from 'src/app/features/onboarding/OnboardingScreen'
import { UniconWithLockIcon } from 'src/app/features/onboarding/UniconWithLockIcon'
import {
  CreateOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Circle, Flex, Text, XStack, YStack } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { useAsyncData } from 'utilities/src/react/hooks'
import { usePendingAccounts } from 'wallet/src/features/wallet/hooks'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring'

const ROW_SIZE = 3
const NUM_ROWS = 4

export function ViewMnemonic(): JSX.Element {
  const navigate = useNavigate()
  const {
    pendingMnemonic: createdMnemonic,
    pendingAddress: createdAddress,
    setPendingAddress: setCreatedAddress,
    setPendingMnemonic: setCreatedMnemonic,
  } = useOnboardingContext()
  const [showPhrase, setShowPhrase] = useState(false)

  const mnemonicRows: string[][] | undefined = useMemo(() => {
    if (!createdMnemonic) {
      return undefined
    }

    return [...Array(NUM_ROWS).keys()].map((v) => {
      return createdMnemonic.slice(v * ROW_SIZE, (v + 1) * ROW_SIZE)
    })
  }, [createdMnemonic])

  const pendingAccountAddress = Object.values(usePendingAccounts())?.[0]?.address

  // TODO: potentially do this in the createAccountOnNext function of Password.tsx and set mnemonic as onboarding context value instead of in a useEffect on this page
  // retrieve mnemonic and split by space to get array of words
  const splitMnemonicIntoWordArray = useCallback(async () => {
    if (!pendingAccountAddress) {
      return
    }

    setCreatedAddress(pendingAccountAddress)
    const mnemonicString = await Keyring.retrieveMnemonicUnlocked(pendingAccountAddress)
    setCreatedMnemonic(mnemonicString?.split(' '))
  }, [pendingAccountAddress, setCreatedAddress, setCreatedMnemonic])

  useAsyncData(splitMnemonicIntoWordArray)

  const onSubmit = (): void => {
    if (createdAddress) {
      navigate(
        `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.TestMnemonic}`,
        { replace: true }
      )
    }
  }

  return (
    <OnboardingScreen
      Icon={
        createdAddress ? (
          <UniconWithLockIcon address={createdAddress} />
        ) : (
          <Circle backgroundColor="$surface2" size={iconSizes.icon64} />
        )
      }
      nextButtonEnabled={!!createdAddress}
      nextButtonText="Next"
      subtitle="This is the only way you can restore your wallet."
      title="Write down your recovery phrase"
      warningSubtitle="Do not view or share with anyone"
      onBack={(): void =>
        navigate(`/${TopLevelRoutes.Onboarding}`, {
          replace: true,
        })
      }
      onSubmit={onSubmit}>
      <Flex margin="$spacing16" onHoverOut={(): void => setShowPhrase(false)}>
        <YStack
          backgroundColor="$surface2"
          borderRadius="$rounded16"
          flex={1}
          gap="$spacing12"
          padding="$spacing24"
          width="100%">
          {mnemonicRows !== undefined
            ? mnemonicRows.map((rowWords, i) => (
                <SeedPhraseRow
                  key={`${i}-row-words`}
                  indexOffset={i * ROW_SIZE + 1}
                  words={rowWords}
                />
              ))
            : // TODO: replace with proper loading placeholder
              Array.from({ length: NUM_ROWS }).map((_, i) => (
                <XStack gap="$spacing16">
                  {Array.from({ length: ROW_SIZE }).map((__, j) => (
                    <SeedPhraseWord key={j} index={j} indexOffset={i * ROW_SIZE + 1} word="..." />
                  ))}
                </XStack>
              ))}
        </YStack>
        <HideContentShield
          color="$surface2"
          visibility={showPhrase && mnemonicRows !== undefined}
          onShowContent={(): void => setShowPhrase(true)}
        />
      </Flex>
    </OnboardingScreen>
  )
}

function SeedPhraseRow({
  words,
  indexOffset,
}: {
  words: string[]
  indexOffset: number
}): JSX.Element {
  return (
    <XStack gap="$spacing16">
      {words.map((word, index) => (
        <SeedPhraseWord key={index} index={index} indexOffset={indexOffset} word={word} />
      ))}
    </XStack>
  )
}

function SeedPhraseWord({
  index,
  indexOffset,
  word,
}: {
  index: number
  indexOffset: number
  word: string
}): JSX.Element {
  return (
    <XStack
      alignContent="center"
      alignItems="center"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      gap="$spacing16"
      height={48}
      paddingHorizontal="$spacing16"
      paddingVertical={12}
      width={132}>
      <Text color="$neutral3" variant="bodySmall">
        {/* padStart adds a 0 at the start of 1-character numbers so they'll show up like "01, 02, ... 09, 10" instead of "1, 2, ... 9, 10" in order to match the designs*/}
        {String(index + indexOffset).padStart(2, '0')}
      </Text>
      <Text variant="bodySmall">{word}</Text>
    </XStack>
  )
}
