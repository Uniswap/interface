import { parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'

import { useSetValueCallback } from '../../state/pool/hooks'
import { ThemedText } from '../../theme'
import { ButtonPrimary } from '../Button'
//import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import NameInputPanel from '../NameInputPanel'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

interface SetValueModalProps {
  isOpen: boolean
  onDismiss: () => void
  title: ReactNode
}

// TODO: 'scrollOverlay' prop returns warning in console
export default function SetValueModal({ isOpen, onDismiss, title }: SetValueModalProps) {
  const { account, chainId } = useWeb3React()

  // state for create input
  const [typed, setTyped] = useState('')

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typed: string) => {
    const numberRegEx = RegExp(`^[0-9]*[.,]?[0-9]*$`)
    if (numberRegEx.test(String(typed))) {
      setTyped(typed)
    }
  }, [])

  const setValueCallback = useSetValueCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  //const { parsedAmount /*, error*/ } = useDerivedPoolInfo(typedValue, userBaseTokenBalance?.currency, userBaseTokenBalance)
  let parsedValue = ''
  // TODO: use currency, as decimals are passed from parent
  try {
    parsedValue = parseUnits(typed, 18).toString()
  } catch (error) {
    console.debug(`Failed to parse input amount: "${typed}"`, error)
  }
  //const parsedValue = typed

  async function onSetValue() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!account || !chainId || !setValueCallback || !parsedValue) return

    // try delegation and store hash
    const hash = await setValueCallback(parsedValue)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={500}>{title}</ThemedText.DeprecatedMediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOnDismiss} />
            </RowBetween>
            <ThemedText.DeprecatedBody>
              <Trans>Update the pool&apos;s unitary value.</Trans>
            </ThemedText.DeprecatedBody>
            <NameInputPanel
              value={typed}
              onChange={onUserInput}
              label="Unitary Value"
              placeholder="+- 5x current, max 30x liquidity"
            />
            <ButtonPrimary disabled={typed === '' || typed.length > 10} onClick={onSetValue}>
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Update Value</Trans>
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Updating Value</Trans>
            </ThemedText.DeprecatedLargeHeader>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.DeprecatedLargeHeader>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
