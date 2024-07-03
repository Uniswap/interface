import { isAddress } from '@ethersproject/address'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import AddressInputPanel from 'components/AddressInputPanel'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { RowBetween } from 'components/Row'
import { GRG } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import useENS from 'hooks/useENS'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import { ReactNode, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { PoolInfo /*,useDerivedPoolInfo*/ } from 'state/buy/hooks'
import { useDelegateCallback } from 'state/governance/hooks'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { Text } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { GRG_TRANSFER_PROXY_ADDRESSES } from '../../constants/addresses'
import { GRG } from '../../constants/tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useDebouncedChangeHandler from '../../hooks/useDebouncedChangeHandler'
import useENS from '../../hooks/useENS'
import { ResponsiveHeaderText, SmallMaxButton } from '../../pages/RemoveLiquidity/styled'
// TODO: check if should write into state stake hooks
import { useBurnV3ActionHandlers, useBurnV3State } from '../../state/burn/v3/hooks'
import {
  useDelegateCallback,
  useDelegatePoolCallback,
  usePoolExtendedContract,
  usePoolIdByAddress,
} from '../../state/governance/hooks'
import { useIsTransactionConfirmed, useTransaction } from '../../state/transactions/hooks'
import AddressInputPanel from '../AddressInputPanel'
import { ButtonConfirmed, ButtonPrimary } from '../Button'
//import { ButtonError } from '../Button'
import { LightCard } from '../Card'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
import { LoadingView, SubmittedView } from '../ModalViews'
import { AutoRow, RowBetween } from '../Row'
import Slider from '../Slider'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

export const TextButton = styled.div`
  :hover {
    cursor: pointer;
  }
`

interface VoteModalProps {
  isOpen: boolean
  poolInfo?: PoolInfo
  onDismiss: () => void
  title: ReactNode
}

export default function DelegateModal({ isOpen, poolInfo, onDismiss, title }: VoteModalProps) {
  const account = useAccount()
  const theme = useTheme()

  // state for delegate input
  const [currencyValue] = useState<Currency>(GRG[account.chainId ?? 1])
  const [usingDelegate, setUsingDelegate] = useState(false)
  const [typed, setTyped] = useState('')

  function handleRecipientType(val: string) {
    setTyped(val)
  }

  const { percent } = useBurnV3State()
  const { onPercentSelect } = useBurnV3ActionHandlers()

  // monitor for self delegation or input for third part delegate
  // default is self delegation
  const activeDelegate = poolInfo?.pool?.address ?? typed ?? account.address
  const { address: parsedAddress } = useENS(activeDelegate)

  // TODO: in the context of pool grg balance is balance of pool
  // get the number of votes available to delegate
  const grgUserBalance = useTokenBalance(account.address ?? undefined, account.chainId ? GRG[account.chainId] : undefined)
  const grgPoolBalance = useTokenBalance(parsedAddress ?? undefined, account.chainId ? GRG[account.chainId] : undefined)
  const { poolId, stakingPoolExists } = usePoolIdByAddress(parsedAddress ?? undefined)
  // we only pass the pool extended instance if we have to call the pool directly
  const poolContract = usePoolExtendedContract(parsedAddress ?? undefined)
  const grgBalance = usingDelegate ? grgPoolBalance : grgUserBalance

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(percent, onPercentSelect)
  //CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed))
  const parsedAmount = CurrencyAmount.fromRawAmount(
    currencyValue,
    JSBI.divide(
      JSBI.multiply(grgBalance ? grgBalance.quotient : JSBI.BigInt(0), JSBI.BigInt(percentForSlider)),
      JSBI.BigInt(100)
    )
  )
  const newApr = useMemo(() => {
    if (poolInfo?.apr?.toString() !== 'NaN') {
      const aprImpact =
        Number(poolInfo?.poolStake) / (Number(poolInfo?.poolStake) + Number(parsedAmount?.quotient.toString()) / 1e18)
      return (Number(poolInfo?.apr) * aprImpact).toFixed(2)
    } else {
      return undefined
    }
  }, [poolInfo, parsedAmount])

  const newIrr = useMemo(() => {
    if (poolInfo?.irr?.toString() !== 'NaN') {
      const irrImpact =
        Number(poolInfo?.poolOwnStake) /
        (Number(poolInfo?.poolOwnStake) + Number(parsedAmount?.quotient.toString()) / 1e18)
      return (Number(poolInfo?.irr) * irrImpact).toFixed(2)
    } else {
      return undefined
    }
  }, [poolInfo, parsedAmount])

  const stakeData = useMemo(() => {
    if (!poolId) {
      return
    }
    return {
      amount: parsedAmount?.quotient.toString(),
      pool: parsedAddress,
      poolId,
      poolContract: usingDelegate ? poolContract : null,
      stakingPoolExists,
    }
  }, [poolId, parsedAmount, parsedAddress, usingDelegate, poolContract, stakingPoolExists])

  const delegateUserCallback = useDelegateCallback()
  const delegatePoolCallback = useDelegatePoolCallback()
  const delegateCallback = usingDelegate ? delegatePoolCallback : delegateUserCallback

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [stakeAmount, setStakeAmount] = useState<CurrencyAmount<Currency>>()

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.status === TransactionStatus.Confirmed

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    // if there was a tx hash, we want to clear the input
    if (hash) {
      onPercentSelectForSlider(0)
    }
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onDelegate() {
    setAttempting(true)
    setStakeAmount(parsedAmount)

    // if callback not returned properly ignore
    if (!delegateCallback || !grgBalance || !stakeData || !currencyValue.isToken) {
      return
    }

    // try delegation and store hash
    const hash = await delegateCallback(stakeData)?.catch((error) => {
      setAttempting(false)
      logger.info('DelegateModal', 'onDelegate', error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  // usingDelegate equals isRbPool
  const [approval, approveCallback] = useApproveCallback(
    parsedAmount ?? undefined,
    GRG_TRANSFER_PROXY_ADDRESSES[account.chainId ?? 1] ?? undefined,
    usingDelegate
  )

  async function onAttemptToApprove() {
    // TODO: check dep requirements
    if (!approval || !approveCallback) {
      return
    }
    //if (!provider) throw new Error('missing dependencies')
    if (!grgBalance) {
      throw new Error('missing GRG amount')
    }

    await approveCallback()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight="90vh">
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.DeprecatedMediumHeader fontWeight={535}>{title}</ThemedText.DeprecatedMediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOnDismiss} />
            </RowBetween>
            <ThemedText.DeprecatedBody>
              <Trans i18nKey="grg.votingShares" />
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans i18nKey="grg.voteOrDelegate" />
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans>You may also stake GRG from a Rigoblock Pool operated by yourself.</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans>Your voting power will unlock at the beginning of the next Rigoblock epoch.</Trans>
            </ThemedText.DeprecatedBody>
            {/* confirmed={approval === ApprovalState.APPROVED} disabled={approval !== ApprovalState.NOT_APPROVED} */}
            {!usingDelegate && approval !== ApprovalState.APPROVED && (
              <ButtonConfirmed mr="0.5rem" onClick={onAttemptToApprove}>
                <Trans>Approve Staking</Trans>
              </ButtonConfirmed>
            )}
            {!poolInfo && <AddressInputPanel value={typed} onChange={handleRecipientType} />}
            <RowBetween>
              <ResponsiveHeaderText>
                <Trans>{percentForSlider}%</Trans>
              </ResponsiveHeaderText>
              <AutoRow gap="4px" justify="flex-end">
                <SmallMaxButton onClick={() => onPercentSelect(25)} width="20%">
                  <Trans>25%</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => onPercentSelect(50)} width="20%">
                  <Trans>50%</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => onPercentSelect(75)} width="20%">
                  <Trans>75%</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => onPercentSelect(100)} width="20%">
                  <Trans>Max</Trans>
                </SmallMaxButton>
              </AutoRow>
            </RowBetween>
            <Slider value={percentForSlider} onChange={onPercentSelectForSlider} />
            <LightCard>
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedBody fontSize={16} fontWeight={500}>
                    <Trans>Staking {formatCurrencyAmount(parsedAmount, 4)} GRG</Trans>
                  </ThemedText.DeprecatedBody>
                  {Boolean(newApr && newApr?.toString() !== 'NaN' && !usingDelegate) && (
                    <ThemedText.DeprecatedBody fontSize={16} fontWeight={500}>
                      <Trans>APR {newApr}%</Trans>
                    </ThemedText.DeprecatedBody>
                  )}
                  {Boolean(newIrr && newIrr?.toString() !== 'NaN' && usingDelegate) && (
                    <ThemedText.DeprecatedBody fontSize={16} fontWeight={500}>
                      <Trans>IRR {newIrr}%</Trans>
                    </ThemedText.DeprecatedBody>
                  )}
                </RowBetween>
              </AutoColumn>
            </LightCard>
            <ButtonPrimary
              disabled={
                !isAddress(parsedAddress ?? '') ||
                approval !== ApprovalState.APPROVED ||
                formatCurrencyAmount(parsedAmount, 4) === '0'
              }
              onClick={onDelegate}
            >
              <ThemedText.DeprecatedMediumHeader color="white">
                {usingDelegate ? <Trans i18nKey="grg.stakeFromPool" /> : <Trans i18nKey="grg.stakeFromWallet" />}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
            {poolInfo?.owner === account.address && (
              <TextButton onClick={() => setUsingDelegate(!usingDelegate)}>
                <Text color={theme.accent1}>
                  {usingDelegate ? <Trans i18nKey="grg.stakeFromWallet" /> : <Trans i18nKey="grg.stakeFromPool" />}
                </Text>
              </TextButton>
            )}
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="md" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              {usingDelegate ? <Trans i18nKey="grg.stakingFromPool" /> : <Trans i18nKey="grg.stakingFromWallet" />}
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}>
              {formatCurrencyAmount(parsedAmount, 4)} GRG
            </ThemedText.DeprecatedMain>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash} transactionSuccess={transactionSuccess}>
          <AutoColumn gap="md" justify="center">
            {!confirmed ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans i18nKey="common.transactionSubmitted" />
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedMain fontSize={36}>
                  Staking {formatCurrencyAmount(stakeAmount, 4)} GRG
                </ThemedText.DeprecatedMain>
              </>
            ) : transactionSuccess ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Success</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedMain fontSize={36}>
                  Staked {formatCurrencyAmount(stakeAmount, 4)} GRG
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
