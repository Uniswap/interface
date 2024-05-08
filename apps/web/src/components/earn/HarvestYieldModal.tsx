import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
//import JSBI from 'jsbi'
import { ReactNode, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { GRG } from '../../constants/tokens'
import { useHarvestCallback } from '../../state/stake/hooks'
import { useIsTransactionConfirmed, useTransaction } from '../../state/transactions/hooks'
import { ThemedText } from '../../theme'
import { ButtonPrimary } from '../Button'
import { LightCard } from '../Card'
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

interface HarvestYieldModalProps {
  isOpen: boolean
  isPool?: boolean
  poolIds?: string[]
  yieldAmount?: CurrencyAmount<Token>
  onDismiss: () => void
  title: ReactNode
}

export default function HarvestYieldModal({
  isOpen,
  isPool,
  yieldAmount,
  poolIds,
  onDismiss,
  title,
}: HarvestYieldModalProps) {
  const { chainId } = useWeb3React()

  const [currencyValue] = useState<Token>(GRG[chainId ?? 1])
  const harvestCallback = useHarvestCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.receipt?.status === 1

  const [farmAmount, setFarmAmount] = useState<CurrencyAmount<Token>>()

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onHarvest() {
    // if callback not returned properly ignore
    if (!harvestCallback || !poolIds || poolIds?.length === 0 || !currencyValue.isToken) return
    setAttempting(true)
    setFarmAmount(yieldAmount)

    // try delegation and store hash
    const hash = await harvestCallback(poolIds, isPool)?.catch((error) => {
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
              {isPool ? (
                <Trans>Harvesting your pool&apos;s staker yield.</Trans>
              ) : (
                <Trans>Harvesting your staker yield.</Trans>
              )}
            </RowBetween>
            <LightCard>
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedBody fontSize={16} fontWeight={500}>
                    <Trans>Harvesting {formatCurrencyAmount(yieldAmount, 4)} GRG</Trans>
                  </ThemedText.DeprecatedBody>
                </RowBetween>
              </AutoColumn>
            </LightCard>
            <ButtonPrimary disabled={formatCurrencyAmount(yieldAmount, 4) === '0'} onClick={onHarvest}>
              <ThemedText.DeprecatedMediumHeader color="white">
                <Trans>Harvest</Trans>{' '}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Harvesting Yield</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}>{formatCurrencyAmount(yieldAmount, 4)}</ThemedText.DeprecatedMain>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash} transactionSuccess={transactionSuccess}>
          <AutoColumn gap="12px" justify="center">
            {!confirmed ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Submitted</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedMain fontSize={36}>
                  Claiming {formatCurrencyAmount(farmAmount, 4)} GRG
                </ThemedText.DeprecatedMain>
              </>
            ) : transactionSuccess ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Success</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedMain fontSize={36}>
                  Claimed {formatCurrencyAmount(farmAmount, 4)} GRG
                </ThemedText.DeprecatedMain>
              </>
            ) : (
              <ThemedText.DeprecatedLargeHeader>
                <Trans>Transaction Failed</Trans>
              </ThemedText.DeprecatedLargeHeader>
            )}
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
