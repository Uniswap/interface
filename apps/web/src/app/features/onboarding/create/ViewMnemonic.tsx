import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HideContentShield } from 'src/app/components/hideContent/HideContentShield'
import { useOnboardingContext } from 'src/app/features/onboarding/OnboardingContextProvider'
import { UniconWithLockIcon } from 'src/app/features/onboarding/UniconWithLockIcon'
import {
  CreateOnboardingRoutes,
  OnboardingRoutes,
  TopLevelRoutes,
} from 'src/app/navigation/constants'
import { Stack, XStack } from 'tamagui'
import { Text, YStack } from 'ui/src'
import { Button } from 'ui/src/components/button/Button'
import { Flex } from 'ui/src/components/layout/Flex'
import { colorsDark } from 'ui/src/theme/color'
import { Keyring } from 'wallet/src/features/wallet/Keyring/Keyring.web'

const ROW_SIZE = 3
const NUM_ROWS = 4

export function ViewMnemonic(): JSX.Element {
  const navigate = useNavigate()
  const {
    password,
    pendingMnemonic: createdMnemonic,
    pendingAddress: createdAddress,
    setPendingAddress: setCreatedAddress,
    setPendingMnemonic: setCreatedMnemonic,
  } = useOnboardingContext()
  const [showPhrase, setShowPhrase] = useState(false)

  const mnemonicRows: string[][] = useMemo(() => {
    if (!createdMnemonic) {
      return []
    }

    return [...Array(NUM_ROWS).keys()].map((v) => {
      return createdMnemonic.slice(v * ROW_SIZE, (v + 1) * ROW_SIZE)
    })
  }, [createdMnemonic])

  // Generate a mnemonic and address if none exist but there's a password
  useEffect(() => {
    async function generateNewWallet(): Promise<void> {
      if (!password) {
        // TODO handle this case better
        // navigate back if there's no password available (should always be once we get to this screen)
        navigate(-1)
        return
      }
      if (!createdAddress) {
        const newAddress = await Keyring.generateAndStoreMnemonic(password)
        setCreatedAddress(newAddress)
        const mnemonicString = await Keyring.retrieveMnemonicUnlocked(newAddress)
        setCreatedMnemonic(mnemonicString?.split(' '))
      }
    }

    generateNewWallet()
  }, [createdAddress, navigate, password, setCreatedAddress, setCreatedMnemonic])

  return (
    <Stack alignItems="center" minWidth={450}>
      {createdAddress ? <UniconWithLockIcon address={createdAddress} /> : null}
      <Text variant="headlineSmall">Write down your recovery phrase</Text>
      <Text color={colorsDark.textTertiary} variant="bodySmall">
        This is the only way you can restore your wallet.
      </Text>
      <Text color={colorsDark.accentCritical} variant="bodySmall">
        Do not view or share with anyone
      </Text>
      <Flex margin="$spacing16" onHoverOut={(): void => setShowPhrase(false)}>
        <YStack
          backgroundColor="$background1"
          borderRadius="$rounded16"
          flex={1}
          gap="$spacing12"
          padding="$spacing24"
          width="100%">
          {mnemonicRows.map((rowWords, i) => (
            <SeedPhraseRow indexOffset={i * ROW_SIZE + 1} words={rowWords} />
          ))}
        </YStack>
        <HideContentShield
          color="$background2"
          visibility={showPhrase}
          onShowContent={(): void => setShowPhrase(true)}
        />
      </Flex>

      <XStack gap="$spacing12" width="100%">
        <Button flexGrow={1} theme="secondary" onPress={(): void => navigate(-1)}>
          Back
        </Button>
        <Button
          flexGrow={1}
          theme="primary"
          onPress={(): void => {
            navigate(
              `/${TopLevelRoutes.Onboarding}/${OnboardingRoutes.Create}/${CreateOnboardingRoutes.TestMnemonic}`
            )
          }}>
          Next
        </Button>
      </XStack>
    </Stack>
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
        <XStack
          key={index}
          alignContent="center"
          alignItems="center"
          backgroundColor={colorsDark.background2}
          borderRadius="$spacing16"
          gap="$spacing16"
          height={48}
          paddingHorizontal="$spacing16"
          paddingVertical={12}
          width={132}>
          <Text color="$textTertiary" variant="bodySmall">
            {String(index + indexOffset).padStart(2, '0')}
          </Text>
          <Text variant="bodySmall">{word}</Text>
        </XStack>
      ))}
    </XStack>
  )
}
