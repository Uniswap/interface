import { Trans } from '@lingui/macro'
import { Trace } from '@uniswap/analytics'
import { InterfaceModalName } from '@uniswap/analytics-events'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../TransactionConfirmationModal'
import SwapModalFooter, { AddPremiumModalFooter, CloseLeverageModalFooter, LeverageModalFooter } from './SwapModalFooter'
import SwapModalHeader, { LeverageModalHeader } from './SwapModalHeader'
import { LeverageTrade } from 'state/swap/hooks'
import { useLeveragePosition } from 'hooks/useV3Positions'
import { CloseLeveragePositionDetails } from './AdvancedSwapDetails'
import useDebounce from 'hooks/useDebounce'
import { useLeverageManagerAddress } from 'hooks/useGetLeverageManager'
import { useLeverageManagerContract } from 'hooks/useContract'
import {BigNumber as BN} from "bignumber.js"
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { AutoRow, RowBetween } from 'components/Row'
import { ThemedText } from 'theme'
import { ResponsiveHeaderText, SmallMaxButton } from 'pages/RemoveLiquidity/styled'
import Slider from 'components/Slider'


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


  const [positionState, position] = useLeveragePosition(leverageManagerAddress, trader, tokenId)
  const [txHash, setTxHash] = useState("")
  const [attemptingTxn, setAttemptingTxn] = useState(false)


  const onModalDismiss = useCallback(() => {
    if (isOpen) setShouldLogModalCloseEvent(true)
    onDismiss()
  }, [isOpen, onDismiss])

  const modalHeader = useCallback(() => {
    return (
      <CloseLeveragePositionDetails leverageTrade={position}/>
    )
  }, [onAcceptChanges, shouldLogModalCloseEvent])


  const modalBottom = useCallback(() => {
    return (<CloseLeverageModalFooter 
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

  const [positionState, position] = useLeveragePosition(leverageManagerAddress, trader, tokenId)
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
      <CloseLeveragePositionDetails leverageTrade={position}/>
    )
  }, [onAcceptChanges, shouldLogModalCloseEvent])

  const modalBottom = useCallback(() => {
    return (<AddPremiumModalFooter leverageManagerAddress={leverageManagerAddress} tokenId={tokenId} trader={trader}
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