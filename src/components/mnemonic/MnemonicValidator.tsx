import React, { useEffect, useReducer } from 'react'
import { Flex } from 'src/components/layout'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { initState, reducer } from 'src/components/mnemonic/reducer'
import { getRandomIndices } from 'src/components/mnemonic/utils'
import { WordList } from 'src/components/mnemonic/WordList'

const NUM_WORDS_TO_CONFIRM = 4

interface MnemonicValidatorProps {
  mnemonic: string[]
  missingPositions: number[]
  onSuccess: () => void
}

function _MnemonicValidator({ mnemonic, missingPositions, onSuccess }: MnemonicValidatorProps) {
  const [userResponse, dispatch] = useReducer(reducer, initState(mnemonic.length, missingPositions))

  const mnemonicForDisplay = mnemonic.map(
    (m, i) => userResponse[i] ?? (userResponse[i] === undefined ? undefined : m)
  )
  const successfullyCompleted =
    mnemonicForDisplay.length === mnemonic.length &&
    mnemonicForDisplay.every((value, index) => value === mnemonic[index])

  useEffect(() => {
    successfullyCompleted && onSuccess()
  }, [successfullyCompleted, onSuccess])

  return (
    <Flex>
      <MnemonicDisplay mnemonic={mnemonicForDisplay} />
      <WordList
        mnemonic={mnemonic}
        unavailable={new Set(userResponse)}
        onPressWord={(word) => {
          dispatch({
            action: 'update',
            word,
          })
        }}
      />
    </Flex>
  )
}

export function MnemonicValidator(props: Omit<MnemonicValidatorProps, 'missingPositions'>) {
  const missingPositions = getRandomIndices(props.mnemonic, NUM_WORDS_TO_CONFIRM)

  return <_MnemonicValidator missingPositions={missingPositions} {...props} />
}

export const FOR_STORYBOOK = {
  // Skip randomness to avoid undeterministic tests
  MnemonicValidator: _MnemonicValidator,
}
