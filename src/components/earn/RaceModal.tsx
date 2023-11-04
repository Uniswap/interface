import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ReactNode, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'

import { GRG } from '../../constants/tokens'
import { useRaceCallback } from '../../state/stake/hooks'
import { useIsTransactionConfirmed, useTransaction } from '../../state/transactions/hooks'
import { ThemedText } from '../../theme'
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

const NameText = styled.span`
  font-weight: 600;
  font-size: 18px;
`

const EmphasisText = styled.span`
  font-style: italic;
`

interface RaceModalProps {
  isOpen: boolean
  poolAddress?: string
  poolName?: string
  onDismiss: () => void
  title: ReactNode
}

export default function RaceModal({ isOpen, poolAddress, poolName, onDismiss, title }: RaceModalProps) {
  const { chainId } = useWeb3React()

  const [currencyValue] = useState<Token>(GRG[chainId ?? 1])
  const raceCallback = useRaceCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [errorReason, setErrorReason] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.receipt?.status === 1

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setErrorReason(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onRace() {
    // if callback not returned properly ignore
    if (!raceCallback || !poolAddress || !poolName || !currencyValue.isToken) return
    setAttempting(true)

    // try credit reward and store hash
    const hash = await raceCallback(poolAddress)?.catch((error) => {
      setErrorReason(error.reason)
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
            {!errorReason ? (
              <>
                <RowBetween>
                  <p>
                    Enroll <NameText>{poolName}</NameText> to compete for the network rewards. To race,{' '}
                    <EmphasisText>the pool requires actively staked GRG</EmphasisText>. This action only needs to be run
                    once per each epoch.
                  </p>
                </RowBetween>
                <ButtonPrimary disabled={false} onClick={onRace}>
                  <ThemedText.DeprecatedMediumHeader color="white">
                    <Trans>Race</Trans>{' '}
                  </ThemedText.DeprecatedMediumHeader>
                </ButtonPrimary>
              </>
            ) : errorReason === 'execution reverted: POP_STAKING_POOL_BALANCES_NULL_ERROR' ? (
              <RowBetween>
                <p>
                  <NameText>{poolName}</NameText> does not have an active GRG stake. If you are its pool operator,
                  select your pool and click the <EmphasisText>Stake</EmphasisText> button at the bottom of the page,
                  then select <EmphasisText>Stake from Pool.</EmphasisText> This will allow you to stake from the pool
                  in 1 click.
                </p>
              </RowBetween>
            ) : (
              <p>User rejected transaction error</p>
            )}
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Enrolling Pool</Trans>
            </ThemedText.DeprecatedLargeHeader>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              {!confirmed ? (
                <Trans>Transaction Submitted</Trans>
              ) : transactionSuccess ? (
                <Trans>Transaction Confirmed</Trans>
              ) : (
                <Trans>Transaction Error</Trans>
              )}
            </ThemedText.DeprecatedLargeHeader>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
