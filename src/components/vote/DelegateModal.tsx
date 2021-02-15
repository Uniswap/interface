import React, { useState } from 'react'

import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween } from '../Row'
import { TYPE } from '../../theme'
import { X } from 'react-feather'
import { ButtonPrimary } from '../Button'
import { useActiveWeb3React } from '../../hooks'
import AddressInputPanel from '../AddressInputPanel'
import { isAddress } from 'ethers/lib/utils'
import useENS from '../../hooks/useENS'
import { useDelegateCallback } from '../../state/governance/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { UNI } from '../../constants'
import { LoadingView, SubmittedView } from '../ModalViews'

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
  title: string
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
              <TYPE.mediumHeader fontWeight={500}>{title}</TYPE.mediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOndismiss} />
            </RowBetween>
            <TYPE.body>Earned UNI tokens represent voting shares in Uniswap governance.</TYPE.body>
            <TYPE.body>
              You can either vote on each proposal yourself or delegate your votes to a third party.
            </TYPE.body>
            {usingDelegate && <AddressInputPanel value={typed} onChange={handleRecipientType} />}
            <ButtonPrimary disabled={!isAddress(parsedAddress ?? '')} onClick={onDelegate}>
              <TYPE.mediumHeader color="white">{usingDelegate ? 'Delegate Votes' : 'Self Delegate'}</TYPE.mediumHeader>
            </ButtonPrimary>
            <TextButton onClick={() => setUsingDelegate(!usingDelegate)}>
              <TYPE.blue>
                {usingDelegate ? 'Remove' : 'Add'} Delegate {!usingDelegate && '+'}
              </TYPE.blue>
            </TextButton>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOndismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>{usingDelegate ? 'Delegating votes' : 'Unlocking Votes'}</TYPE.largeHeader>
            <TYPE.main fontSize={36}>{uniBalance?.toSignificant(4)}</TYPE.main>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOndismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.main fontSize={36}>{uniBalance?.toSignificant(4)}</TYPE.main>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
