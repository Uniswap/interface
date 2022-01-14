import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, TextStyle, TouchableOpacity } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ImportAccountType } from 'src/features/import/types'

interface PhraseButtonProps {
  word: string
  idx: number
  onPress: (idx: number) => void
  removable: boolean
}

const xStyle: TextStyle = {
  color: 'red',
  position: 'absolute',
  top: -6,
  right: -5,
  backgroundColor: 'white',
}

function PhraseButton({ word, idx, onPress, removable }: PhraseButtonProps) {
  const onPressBox = () => {
    onPress(idx)
  }

  return (
    <TouchableOpacity disabled={!removable} onPress={onPressBox}>
      <Box
        backgroundColor="white"
        borderColor="black"
        borderRadius="lg"
        borderWidth={2}
        margin="sm"
        padding="xs">
        {removable && <Text style={xStyle}>X</Text>}
        <Text>{word}</Text>
      </Box>
    </TouchableOpacity>
  )
}

export function SeedPhraseScreen({
  route: {
    params: { seedPhrase },
  },
}: any) {
  const [currentPhrase, updatePhrase] = useState(seedPhrase)
  const [isLoading, setLoading] = useState(false)

  const onPress = (idx: number) => {
    const newPhraseArray = [...currentPhrase]
    newPhraseArray.splice(idx, 1)
    updatePhrase(newPhraseArray)
  }

  const dispatch = useAppDispatch()

  // TODO this should use sagaStatus instead of custom loading state
  const onConfirmPhrase = () => {
    setLoading(true)
    setTimeout(() => {
      const mnemonic = currentPhrase.join(' ')
      dispatch(importAccountActions.trigger({ type: ImportAccountType.Mnemonic, mnemonic }))
    }, 100)
  }

  const removable = !(currentPhrase.length === 12)

  const { t } = useTranslation()

  return (
    <Screen>
      <Box
        alignItems="flex-start"
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="flex-start"
        padding="lg">
        {removable && <Text>{t('Extra words detected - tap to remove them')}</Text>}
        {currentPhrase.map((word: string, idx: number) => (
          <PhraseButton idx={idx} removable={removable} word={word} onPress={onPress} />
        ))}
      </Box>
      <Box alignItems="center">
        {isLoading ? (
          <ActivityIndicator size="large" />
        ) : (
          <PrimaryButton
            disabled={removable}
            label={t('Confirm phrase')}
            onPress={onConfirmPhrase}
          />
        )}
      </Box>
    </Screen>
  )
}
