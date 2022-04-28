import React, { useEffect, useReducer } from 'react'
import { Flex } from 'src/components/layout'
import { MnemonicDisplay } from 'src/components/mnemonic/MnemonicDisplay'
import { initState, MISSING, reducer } from 'src/components/mnemonic/reducer'
import { getRandomIndices } from 'src/components/mnemonic/utils'
import { WordList } from 'src/components/mnemonic/WordList'

const NUM_WORDS_TO_CONFIRM = 4

interface MnemonicValidatorProps {
  missingPositions: number[]
  mnemonic: string[]
  onFailure: () => void
  onPress?: () => void
  onSuccess: () => void
}

function _MnemonicValidator({
  missingPositions,
  mnemonic,
  onFailure,
  onPress,
  onSuccess,
}: MnemonicValidatorProps) {
  const [userResponse, dispatch] = useReducer(reducer, initState(mnemonic.length, missingPositions))

  const mnemonicForDisplay = mnemonic.map(
    (m, i) => userResponse[i] ?? (userResponse[i] === undefined ? undefined : m)
  )

  const missingInputs = userResponse.some((r) => r === MISSING)
  const validationSuccess =
    !missingInputs &&
    mnemonicForDisplay.length === mnemonic.length &&
    mnemonicForDisplay.every((value, index) => value === mnemonic[index])
  const validationFailed = !missingInputs && !validationSuccess

  useEffect(() => {
    validationSuccess && onSuccess()
  }, [onSuccess, validationSuccess])

  useEffect(() => {
    if (validationFailed) {
      onFailure()
      dispatch({ action: 'reset', state: initState(mnemonic.length, missingPositions) })
    }
  }, [missingPositions, mnemonic.length, onFailure, validationFailed])

  return (
    <Flex>
      <MnemonicDisplay mnemonic={mnemonicForDisplay} />
      <WordList
        mnemonic={mnemonic}
        unavailable={new Set(userResponse)}
        onPressWord={(word) => {
          onPress?.()
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
