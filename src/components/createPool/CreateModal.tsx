import { isAddress } from '@ethersproject/address'
import { parseBytes32String } from '@ethersproject/strings'
import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'

import useENS from '../../hooks/useENS'
//import { useTokenBalance } from '../../state/connection/hooks'
// TODO: move useCreateCallback ourside of governance hooks
import { useCreateCallback } from '../../state/governance/hooks'
import { ThemedText } from '../../theme'
import AddressInputPanel from '../AddressInputPanel'
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

interface CreateModalProps {
  isOpen: boolean
  onDismiss: () => void
  title: ReactNode
}

// TODO: 'scrollOverlay' prop returns warning in console
export default function CreateModal({ isOpen, onDismiss, title }: CreateModalProps) {
  const { account, chainId } = useWeb3React()

  // state for delegate input
  const [typed, setTyped] = useState('')
  const [typedName, setTypedName] = useState('')
  const [typedSymbol, setTypedSymbol] = useState('')

  function handleRecipientType(val: string) {
    setTyped(val)
  }

  // wrapped onUserInput to clear signatures
  const onNameInput = useCallback((typedName: string) => {
    setTypedName(typedName)
  }, [])

  const onSymbolInput = useCallback((typedSymbol: string) => {
    setTypedSymbol(typedSymbol.toUpperCase())
  }, [])

  const { address: parsedAddress } = useENS(typed)

  const name = parseBytes32String('testpool') ?? undefined
  const symbol = parseBytes32String('TEST') ?? undefined
  const baseCurrency = parsedAddress

  const createCallback = useCreateCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onCreate() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!account || !chainId || !createCallback || !baseCurrency || !name || !symbol) return

    // try delegation and store hash
    const hash = await createCallback(name, symbol, baseCurrency)?.catch((error) => {
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
              <Trans>Experience endless DeFi applications without the hassle of setting allowances.</Trans>
            </ThemedText.DeprecatedBody>
            <NameInputPanel value={typedName} onChange={onNameInput} />
            <NameInputPanel
              value={typedSymbol}
              onChange={onSymbolInput}
              label="Pool Symbol"
              placeholder="uppercase, max 5 characters"
            />
            {/* TODO: add conditional field if base token not base currency, or CurrencyInputPanel */}
            <AddressInputPanel value={typed} onChange={handleRecipientType} label="Base Currency (any token)" />
            <ButtonPrimary
              disabled={
                typedName === '' ||
                typedName.length > 32 ||
                typedSymbol === '' ||
                typedSymbol.length > 5 ||
                !isAddress(parsedAddress ?? '')
              }
              onClick={onCreate}
            >
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Create New Pool</Trans>
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Creating new Pool</Trans>
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
