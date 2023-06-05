import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfaceModalName } from '@uniswap/analytics-events'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'


import TransactionConfirmationModal, {
  ConfirmationModalContent,
} from '../TransactionConfirmationModal'
import { AddPremiumLeverageModalFooter, ReduceLeverageModalFooter } from './SwapModalFooter'

import { useLimitlessPositionFromTokenId } from 'hooks/useV3Positions'
import { ReduceLeveragePositionDetails } from './AdvancedSwapDetails'
import { useLeverageManagerContract } from 'hooks/useContract'


export default function ClosePositionModal({
  trader,
  isOpen,
  tokenId,
  leverageManagerAddress,
  onDismiss,
  onAcceptChanges,
  onConfirm,
}: {
  trader: string | undefined,
  isOpen: boolean,
  tokenId: string | undefined,
  leverageManagerAddress: string | undefined,
  onDismiss: () => void
  onAcceptChanges: () => void
  onConfirm: () => void
}) {
  // shouldLogModalCloseEvent lets the child SwapModalHeader component know when modal has been closed
  // and an event triggered by modal closing should be logged.
  const [shouldLogModalCloseEvent, setShouldLogModalCloseEvent] = useState(false)


  const { loading, error, position } = useLimitlessPositionFromTokenId(tokenId)
  const [txHash, setTxHash] = useState("")
  const [attemptingTxn, setAttemptingTxn] = useState(false)


  const onModalDismiss = useCallback(() => {
    if (isOpen) setShouldLogModalCloseEvent(true)
    onDismiss()
  }, [isOpen, onDismiss])

  const modalHeader = useCallback(() => {
    return (
      <ReduceLeveragePositionDetails leverageTrade={position}/>
    )
  }, [onAcceptChanges, shouldLogModalCloseEvent])


  const modalBottom = useCallback(() => {
    return (<ReduceLeverageModalFooter 
      leverageManagerAddress={leverageManagerAddress} tokenId={tokenId} trader={trader}
      setAttemptingTxn={setAttemptingTxn}
      setTxHash={setTxHash}
      />)
  }, [
    onConfirm
  ])

  // text to show while loading
  const pendingText = (
    <Trans>
      Loading...
    </Trans>
  )

  const confirmationContent = useCallback(
    () =>
      (
        <ConfirmationModalContent
          title={<Trans>Close Position</Trans>}
          onDismiss={onModalDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onModalDismiss, modalBottom, modalHeader]
  )
  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <TransactionConfirmationModal
        isOpen={isOpen}
        onDismiss={onModalDismiss}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={confirmationContent}
        pendingText={pendingText}
      />
    </Trace>
  )
}

export function AddPremiumModal({
  trader,
  isOpen,
  tokenId,
  leverageManagerAddress,
  onDismiss,
  onAcceptChanges,
  onConfirm

}: {
  trader: string | undefined,
  isOpen: boolean,
  tokenId: string | undefined,
  leverageManagerAddress: string | undefined,
  onDismiss: () => void
  onAcceptChanges: () => void
  onConfirm: () => void
}) {
  // shouldLogModalCloseEvent lets the child SwapModalHeader component know when modal has been closed
  // and an event triggered by modal closing should be logged.
  const [shouldLogModalCloseEvent, setShouldLogModalCloseEvent] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txHash, setTxHash] = useState("")

  // console.log("args: ", trader, isOpen, tokenId, leverageManagerAddress)

  const { loading, error, position} = useLimitlessPositionFromTokenId(tokenId)
  const leverageManager = useLeverageManagerContract(leverageManagerAddress, true)

  const handleAddPremium = useCallback(() => {
    if (leverageManager) {
      setAttemptingTxn(true)
      leverageManager.addPremium(trader, tokenId).then(
        (hash: any) => {
          setAttemptingTxn(false)
          setTxHash(hash)
          console.log("add premium hash: ", hash)
        }
      ).catch((err: any) => {
        setAttemptingTxn(false)
        console.log("error adding premium: ", err)
      }
      )
    }
  }, [])


  const onModalDismiss = useCallback(() => {
    if (isOpen) setShouldLogModalCloseEvent(true)
    onDismiss()
  }, [isOpen, onDismiss])
  // console.log("postionState: ", position)


  const modalHeader = useCallback(() => {
    return (
      <ReduceLeveragePositionDetails leverageTrade={position}/>
    )
  }, [onAcceptChanges, shouldLogModalCloseEvent])

  const modalBottom = useCallback(() => {
    return (<AddPremiumLeverageModalFooter leverageManagerAddress={leverageManagerAddress} tokenId={tokenId} trader={trader}
    handleAddPremium={handleAddPremium}
    />)
  }, [
    onConfirm
  ])

  // text to show while loading
  const pendingText = (
    <Trans>
      Loading...
    </Trans>
  )

  const confirmationContent = useCallback(
    () =>
      (
        <ConfirmationModalContent
          title={<Trans>Add Premium</Trans>}
          onDismiss={onModalDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onModalDismiss, modalBottom, modalHeader]
  )

  return (
    <Trace modal={InterfaceModalName.CONFIRM_SWAP}>
      <TransactionConfirmationModal
        isOpen={isOpen}
        onDismiss={onModalDismiss}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={confirmationContent}
        pendingText={pendingText}
      />
    </Trace>
  )
}