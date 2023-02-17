import { isAddress } from '@ethersproject/address'
import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ReactNode, useCallback, useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { GRG_TRANSFER_PROXY_ADDRESSES } from '../../constants/addresses'
//import { isSupportedChain } from '../../constants/chains'
import { GRG } from '../../constants/tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useENS from '../../hooks/useENS'
import { useTokenBalance } from '../../state/connection/hooks'
import {
  useDelegateCallback,
  useDelegatePoolCallback,
  usePoolExtendedContract,
  usePoolIdByAddress,
} from '../../state/governance/hooks'
import { ThemedText } from '../../theme'
import AddressInputPanel from '../AddressInputPanel'
import { ButtonConfirmed, ButtonPrimary } from '../Button'
//import { ButtonError } from '../Button'
import { AutoColumn } from '../Column'
import CurrencyInputPanel from '../CurrencyInputPanel'
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

// TODO: 'scrollOverlay' prop returns warning in console
export default function DelegateModal({ isOpen, onDismiss, title }: VoteModalProps) {
  const { account, chainId } = useWeb3React()

  // state for delegate input
  const [currencyValue] = useState<Currency>(GRG[chainId ?? 1])
  const [usingDelegate, setUsingDelegate] = useState(false)
  const [typed, setTyped] = useState('')
  const [typedValue, setTypedValue] = useState('')

  function handleRecipientType(val: string) {
    setTyped(val)
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typedValue: string) => {
    setTypedValue(typedValue)
  }, [])

  // monitor for self delegation or input for third part delegate
  // default is self delegation
  const activeDelegate = typed ?? account
  const { address: parsedAddress } = useENS(activeDelegate)

  // TODO: in the context of pool grg balance is balance of pool
  // get the number of votes available to delegate
  const grgUserBalance = useTokenBalance(account ?? undefined, chainId ? GRG[chainId] : undefined)
  const grgPoolBalance = useTokenBalance(parsedAddress ?? undefined, chainId ? GRG[chainId] : undefined)
  const poolId = usePoolIdByAddress(parsedAddress ?? undefined)
  // we only pass the pool extended instance if we have to call the pool directly
  const poolContract = usePoolExtendedContract(parsedAddress ?? undefined)
  const grgBalance = usingDelegate ? grgPoolBalance : grgUserBalance

  const stakeData = {
    amount: grgBalance?.quotient.toString(),
    pool: parsedAddress,
    poolId,
    poolContract: usingDelegate ? poolContract : undefined,
  }

  const delegateUserCallback = useDelegateCallback()
  const delegatePoolCallback = useDelegatePoolCallback()
  const delegateCallback = usingDelegate ? delegatePoolCallback : delegateUserCallback

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onDelegate() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!delegateCallback || !grgBalance || !stakeData || !currencyValue.isToken) return

    // try delegation and store hash
    const hash = await delegateCallback(stakeData ?? undefined)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  // usingDelegate equals isRbPool
  const [approval, approveCallback] = useApproveCallback(
    grgBalance ?? undefined,
    GRG_TRANSFER_PROXY_ADDRESSES[chainId ?? 1] ?? undefined,
    usingDelegate
  )

  async function onAttemptToApprove() {
    // TODO: check dep requirements
    if (!approval || !approveCallback) return
    //if (!provider) throw new Error('missing dependencies')
    if (!grgBalance) throw new Error('missing GRG amount')
    console.log(grgBalance)

    await approveCallback()
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
              <Trans>Actively staked GRG tokens represent voting power in Rigoblock governance.</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans>
                You must stake to a Rigoblock Pool in order to activate your voting power. You keep 100% of votes, your
                votes are not delegated.
              </Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans>
                You may also use GRG in a Rigoblock Pool operated by yourself and directly stake from the pool.
              </Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans>Your voting power will unlock at the beginning of the next Rigoblock epoch.</Trans>
            </ThemedText.DeprecatedBody>
            {/* TODO: fix input panel now working properly here, using mock condition to prevent display */}
            {!chainId && (
              <CurrencyInputPanel
                value={typedValue}
                currency={currencyValue ?? null}
                onUserInput={onUserInput}
                showMaxButton={false}
                showCurrencyAmount={true}
                label=""
                id="stake-grg-token"
                showCommonBases
                locked={!grgBalance}
              />
            )}
            {/* confirmed={approval === ApprovalState.APPROVED} disabled={approval !== ApprovalState.NOT_APPROVED} */}
            {!usingDelegate && approval !== ApprovalState.APPROVED && (
              <ButtonConfirmed mr="0.5rem" onClick={onAttemptToApprove}>
                <Trans>Approve Staking</Trans>
              </ButtonConfirmed>
            )}
            <AddressInputPanel value={typed} onChange={handleRecipientType} />
            <ButtonPrimary
              disabled={!isAddress(parsedAddress ?? '') || approval !== ApprovalState.APPROVED}
              onClick={onDelegate}
            >
              <ThemedText.DeprecatedMediumHeader color="white">
                {usingDelegate ? <Trans>Stake From Pool</Trans> : <Trans>Stake For Yourself</Trans>}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
            <TextButton onClick={() => setUsingDelegate(!usingDelegate)}>
              <ThemedText.DeprecatedBlue>
                {usingDelegate ? <Trans>Stake For Yourself</Trans> : <Trans>Stake From Your Rigoblock Pool</Trans>}
              </ThemedText.DeprecatedBlue>
            </TextButton>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              {usingDelegate ? <Trans>Staking From Pool</Trans> : <Trans>Unlocking Votes</Trans>}
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}> {formatCurrencyAmount(grgBalance, 4)}</ThemedText.DeprecatedMain>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}>{formatCurrencyAmount(grgBalance, 4)}</ThemedText.DeprecatedMain>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
