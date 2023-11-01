import { Trans } from '@lingui/macro'
import { Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ReactNode, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'

import { GRG } from '../../constants/tokens'
import { useRaceCallback } from '../../state/stake/hooks'
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

interface RaceModalProps {
  isOpen: boolean
  poolAddress?: string
  onDismiss: () => void
  title: ReactNode
}

export default function RaceModal({ isOpen, poolAddress, onDismiss, title }: RaceModalProps) {
  const { chainId } = useWeb3React()

  const [currencyValue] = useState<Token>(GRG[chainId ?? 1])
  const raceCallback = useRaceCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onRace() {
    // if callback not returned properly ignore
    if (!raceCallback || !poolAddress || !currencyValue.isToken) return
    setAttempting(true)

    // try credit reward and store hash
    const hash = await raceCallback(poolAddress)?.catch((error) => {
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
            <RowBetween>
              <Trans>
                Enroll your Smart Pool to compete for the network incentives. You need to actively stake GRG from the
                pool to take part.
              </Trans>
            </RowBetween>
            <ButtonPrimary disabled={false} onClick={onRace}>
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Race</Trans>{' '}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
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
              <Trans>Transaction Submitted</Trans>
            </ThemedText.DeprecatedLargeHeader>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
