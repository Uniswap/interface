import { parseUnits } from '@ethersproject/units'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'

import { PoolInfo } from '../../state/buy/hooks'
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
  poolInfo: PoolInfo
  title: ReactNode
}

export default function SetValueModal({ isOpen, onDismiss, poolInfo, title }: SetValueModalProps) {
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

  let parsedValue = ''
  // TODO: use currency, as decimals are passed from parent
  try {
    parsedValue = parseUnits(typed, poolInfo.pool.decimals).toString()
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
              <Trans>New value must be between 1/5th and 5 times the current value.</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans>Pool base token liquidity must be at least 3% of new unitary value.</Trans>
            </ThemedText.DeprecatedBody>
            <NameInputPanel value={typed} onChange={onUserInput} label="Unitary Value" placeholder="New Value" />
            {/* TODO: disables if same as current */}
            <ButtonPrimary
              disabled={
                typed === '' ||
                typed.length > 10 ||
                JSBI.lessThanOrEqual(
                  JSBI.BigInt(parsedValue),
                  JSBI.divide(poolInfo.poolPriceAmount.quotient, JSBI.BigInt(5))
                ) ||
                JSBI.greaterThanOrEqual(
                  JSBI.BigInt(parsedValue),
                  JSBI.multiply(poolInfo.poolPriceAmount.quotient, JSBI.BigInt(5))
                )
              }
              onClick={onSetValue}
            >
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
