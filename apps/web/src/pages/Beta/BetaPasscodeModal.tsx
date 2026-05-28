import {
  DynamicConfigs,
  EmbeddedWalletBetaPassphrasesKey,
  getDynamicConfigValue,
  getOverrideAdapter,
} from '@universe/gating'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Image, Input, Text } from 'ui/src'
import { BETA_LOGO } from 'ui/src/assets'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useTimeout } from 'utilities/src/time/timing'

export function BetaPasscodeModal(): JSX.Element {
  const { t } = useTranslation()
  const [passphrase, setPassphrase] = useState('')
  const [hasError, setHasError] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Defer focus so it runs after the Swap input's autoFocus, ensuring the passphrase field wins.
  useTimeout(
    useCallback(() => inputRef.current?.focus(), []),
    50,
  )

  const validate = (): void => {
    const validCodes = getDynamicConfigValue({
      config: DynamicConfigs.EmbeddedWalletBetaPassphrases,
      key: EmbeddedWalletBetaPassphrasesKey.Passphrases,
      defaultValue: [] as string[],
    })
    if (validCodes.includes(passphrase)) {
      getOverrideAdapter().overrideGate('embedded_wallet', true)
      // Full reload so modal registrations (add passkey, recovery) mount fresh
      window.location.replace('/?intro=true')
    } else {
      setHasError(true)
    }
  }

  const handleKeyDown = (e: unknown): void => {
    if ((e as { key?: string }).key === 'Enter') {
      validate()
    }
  }

  return (
    <Modal
      name={ModalName.EmbeddedWalletBeta}
      isModalOpen={true}
      onClose={() => {}}
      isDismissible={false}
      overlayOpacity={0.8}
      maxWidth={420}
    >
      <Flex gap="$spacing16" alignItems="center" p="$spacing8">
        <Image
          source={BETA_LOGO}
          width={48}
          height={48}
          borderRadius="$rounded12"
          borderWidth={1}
          borderColor="$accent2"
        />

        <Flex gap="$spacing12" alignItems="center" mb="$spacing16">
          <Text variant="subheading1" color="$neutral1" textAlign="center">
            {t('beta.preview.title')}
          </Text>
          <Text variant="subheading2" color="$neutral2" textAlign="center">
            {t('beta.preview.subtitle')}
          </Text>
        </Flex>

        <Input
          ref={inputRef as never}
          testID={TestID.PreviewPassphraseInput}
          height={64}
          width="100%"
          backgroundColor="$surface1"
          borderWidth={1}
          borderColor="$surface3"
          borderRadius="$rounded20"
          hoverStyle={{ borderColor: '$surface3' }}
          focusStyle={{ borderColor: '$surface3' }}
          outlineWidth={0}
          outlineColor="transparent"
          px="$spacing20"
          py="$spacing8"
          secureTextEntry={true}
          placeholder={t('beta.preview.input.placeholder')}
          placeholderTextColor="$neutral3"
          fontSize={18}
          fontWeight="500"
          lineHeight={24}
          value={passphrase}
          onChangeText={(text: string) => {
            setPassphrase(text)
            setHasError(false)
          }}
          onKeyPress={handleKeyDown}
          autoComplete="current-password"
        />

        {hasError && (
          <Text testID={TestID.PreviewPassphraseError} variant="body3" color="$statusCritical" textAlign="center">
            {t('beta.preview.error')}
          </Text>
        )}
        <Flex row alignSelf="stretch" mt="$spacing16">
          <Button
            testID={TestID.PreviewPassphraseSubmit}
            emphasis="primary"
            variant="branded"
            size="large"
            width="100%"
            onPress={validate}
            isDisabled={!passphrase}
          >
            {t('beta.preview.submit')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  )
}
