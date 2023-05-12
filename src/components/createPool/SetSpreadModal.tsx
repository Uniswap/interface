import { parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'

import { useSetSpreadCallback } from '../../state/pool/hooks'
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

interface SetSpreadModalProps {
  isOpen: boolean
  onDismiss: () => void
  title: ReactNode
}

export default function SetSpreadModal({ isOpen, onDismiss, title }: SetSpreadModalProps) {
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

  let parsedSpread = ''
  try {
    parsedSpread = typed !== '' ? parseUnits(typed, 2).toString() : typed
  } catch (error) {
    console.debug(`Failed to parse spread: "${typed}"`, error)
  }

  const setSpreadCallback = useSetSpreadCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onSetSpread() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!account || !chainId || !setSpreadCallback || !parsedSpread) return

    // try set spread and store hash
    const hash = await setSpreadCallback(parsedSpread)?.catch((error) => {
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
            <NameInputPanel value={typed} onChange={onUserInput} label="Pool Spread" placeholder="max 10%" />
            <ButtonPrimary
              disabled={
                typed === '' ||
                typed.length > 4 ||
                JSBI.lessThan(JSBI.BigInt(parsedSpread), JSBI.BigInt(1)) ||
                JSBI.greaterThan(JSBI.BigInt(parsedSpread), JSBI.BigInt(1000))
              }
              onClick={onSetSpread}
            >
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Update Spread</Trans>
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Updating Spread</Trans>
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
