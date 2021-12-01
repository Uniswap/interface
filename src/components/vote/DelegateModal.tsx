import { isAddress } from '@ethersproject/address'
import { Trans } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { UNI } from '../../constants/tokens'
import useENS from '../../hooks/useENS'
import { useActiveWeb3React } from '../../hooks/web3'
import { useDelegateCallback } from '../../state/governance/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ThemedText } from '../../theme'
import AddressInputPanel from '../AddressInputPanel'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
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

const TextButton = styled.div`
  :hover {
    cursor: pointer;
  }
`

interface VoteModalProps {
  isOpen: boolean
  onDismiss: () => void
  title: ReactNode
}

export default function DelegateModal({ isOpen, onDismiss, title }: VoteModalProps) {
  const { account, chainId } = useActiveWeb3React()

  // state for delegate input
  const [usingDelegate, setUsingDelegate] = useState(false)
  const [typed, setTyped] = useState('')
  function handleRecipientType(val: string) {
    setTyped(val)
  }

  // monitor for self delegation or input for third part delegate
  // default is self delegation
  const activeDelegate = usingDelegate ? typed : account
  const { address: parsedAddress } = useENS(activeDelegate)

  // get the number of votes available to delegate
  const uniBalance = useTokenBalance(account ?? undefined, chainId ? UNI[chainId] : undefined)

  const delegateCallback = useDelegateCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onDelegate() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!delegateCallback) return

    // try delegation and store hash
    const hash = await delegateCallback(parsedAddress ?? undefined)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.MediumHeader fontWeight={500}>{title}</ThemedText.MediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOndismiss} />
            </RowBetween>
            <ThemedText.Body>
              <Trans>Earned UNI tokens represent voting shares in Uniswap governance.</Trans>
            </ThemedText.Body>
            <ThemedText.Body>
              <Trans>You can either vote on each proposal yourself or delegate your votes to a third party.</Trans>
            </ThemedText.Body>
            {usingDelegate && <AddressInputPanel value={typed} onChange={handleRecipientType} />}
            <ButtonPrimary disabled={!isAddress(parsedAddress ?? '')} onClick={onDelegate}>
              <ThemedText.MediumHeader color="white">
                {usingDelegate ? <Trans>Delegate Votes</Trans> : <Trans>Self Delegate</Trans>}
              </ThemedText.MediumHeader>
            </ButtonPrimary>
            <TextButton onClick={() => setUsingDelegate(!usingDelegate)}>
              <ThemedText.Blue>
                {usingDelegate ? <Trans>Remove Delegate</Trans> : <Trans>Add Delegate +</Trans>}
              </ThemedText.Blue>
            </TextButton>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.LargeHeader>
              {usingDelegate ? <Trans>Delegating votes</Trans> : <Trans>Unlocking Votes</Trans>}
            </ThemedText.LargeHeader>
            <ThemedText.Main fontSize={36}> {formatCurrencyAmount(uniBalance, 4)}</ThemedText.Main>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <ThemedText.LargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.LargeHeader>
            <ThemedText.Main fontSize={36}>{formatCurrencyAmount(uniBalance, 4)}</ThemedText.Main>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
