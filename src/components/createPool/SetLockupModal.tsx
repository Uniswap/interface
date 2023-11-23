import { parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'

import { useSetLockupCallback } from '../../state/pool/hooks'
import { ThemedText } from '../../theme'
import { ButtonError } from '../Button'
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

interface SetLockupModalProps {
  isOpen: boolean
  currentLockup: string
  onDismiss: () => void
  title: ReactNode
}

export default function SetLockupModal({ isOpen, currentLockup, onDismiss, title }: SetLockupModalProps) {
  const { account, chainId } = useWeb3React()

  const [typed, setTyped] = useState('')

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typed: string) => {
    const numberRegEx = RegExp(`^[0-9]*$`)
    if (numberRegEx.test(String(typed))) {
      setTyped(typed)
    }
  }, [])

  const setLockupCallback = useSetLockupCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  let parsedLockup = ''
  try {
    parsedLockup = (Number(parseUnits(typed, 0)) * 86400).toString()
  } catch (error) {
    console.debug(`Failed to parse input amount: "${typed}"`, error)
  }

  async function onSetLockup() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!account || !chainId || !setLockupCallback || !parsedLockup) return

    // the minimum acceptable value is 2 seconds
    if (parsedLockup === '0') {
      parsedLockup = '2'
    }

    // try set lockup and store hash
    const hash = await setLockupCallback(parsedLockup)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  const isSameAsCurrent: boolean = (parsedLockup !== '0' ? parsedLockup : '2').toString() === currentLockup
  const isLockupTooBig: boolean = JSBI.greaterThan(JSBI.BigInt(parsedLockup), JSBI.BigInt(2592000))

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
              <Trans>The minimum holder lockup.</Trans>
            </ThemedText.DeprecatedBody>
            <NameInputPanel
              value={(typed ? Number(parsedLockup) / 86400 : '').toString()}
              onChange={onUserInput}
              label="Lockup (days)"
              placeholder="max 30 days"
            />
            <ButtonError
              disabled={parsedLockup === '' || isSameAsCurrent || isLockupTooBig}
              error={isSameAsCurrent || isLockupTooBig}
              onClick={onSetLockup}
            >
              <ThemedText.DeprecatedMediumHeader color="white">
                {isSameAsCurrent ? (
                  <Trans>Same as current</Trans>
                ) : isLockupTooBig ? (
                  <Trans>max lockup 30 days</Trans>
                ) : (
                  <Trans>Set Lockup</Trans>
                )}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonError>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Setting New Lockup</Trans>
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
