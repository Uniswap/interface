import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, useShadowPropsShort } from 'ui/src'
import { EyeSlash } from 'ui/src/components/icons'
import { HiddenWordView } from 'ui/src/components/placeholders/HiddenWordView'
import { MNEMONIC_LENGTH_HD } from 'wallet/src/constants/accounts'

const COLUMNS = 2

type HiddenMnemonicWordViewProps = {
  enableRevealButton?: boolean
  onRevealPress?: () => void
  wordCount?: number
}
export function HiddenMnemonicWordView({
  enableRevealButton = false,
  onRevealPress,
  wordCount = MNEMONIC_LENGTH_HD,
}: HiddenMnemonicWordViewProps): JSX.Element {
  const { t } = useTranslation()
  const shadowProps = useShadowPropsShort()
  const rows = Math.ceil(wordCount / COLUMNS)

  return (
    <Flex mt="$spacing16">
      <HiddenWordView rows={rows} columns={COLUMNS} />
      {enableRevealButton && (
        <Flex centered height="100%" position="absolute" width="100%">
          <TouchableArea onPress={() => onRevealPress?.()}>
            <Flex
              {...shadowProps}
              row
              backgroundColor="$surface1"
              borderColor="$surface3"
              borderRadius="$rounded16"
              borderWidth="$spacing1"
              gap="$spacing4"
              paddingEnd="$spacing16"
              paddingStart="$spacing12"
              py="$spacing8"
            >
              <EyeSlash color="$accent1" size="$icon.20" />
              <Text color="$accent1" variant="buttonLabel2">
                {t('common.button.reveal')}
              </Text>
            </Flex>
          </TouchableArea>
        </Flex>
      )}
    </Flex>
  )
}
