import { isAddress } from '@ethersproject/address'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { ReactNode, /*useCallback,*/ useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { TextButton } from '../../components/vote/DelegateModal'
import { ZERO_ADDRESS } from '../../constants/misc'
import { GRG } from '../../constants/tokens'
import useDebouncedChangeHandler from '../../hooks/useDebouncedChangeHandler'
import useENS from '../../hooks/useENS'
import { ResponsiveHeaderText, SmallMaxButton } from '../../pages/RemoveLiquidity/styled'
// TODO: check if should write into state stake hooks
import { useBurnV3ActionHandlers, useBurnV3State } from '../../state/burn/v3/hooks'
import { PoolInfo /*,useDerivedPoolInfo*/ } from '../../state/buy/hooks'
import {
  StakeData,
  useDeactivateStakeCallback,
  useMoveStakeCallback,
  usePoolExtendedContract,
  usePoolIdByAddress,
  useStakeBalance,
} from '../../state/governance/hooks'
import { ThemedText } from '../../theme'
import AddressInputPanel from '../AddressInputPanel'
import { /*ButtonConfirmed,*/ ButtonPrimary } from '../Button'
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

interface MoveStakeModalProps {
  isOpen: boolean
  poolInfo: PoolInfo
  isDeactivate?: boolean
  onDismiss: () => void
  title: ReactNode
}

export default function MoveStakeModal({ isOpen, poolInfo, isDeactivate, onDismiss, title }: MoveStakeModalProps) {
  const { account, chainId } = useWeb3React()

  // state for delegate input
  const [currencyValue] = useState<Currency>(GRG[chainId ?? 1])
  const [typed, setTyped] = useState('')
  const [isPoolMoving, setIsPoolMoving] = useState(false)

  function handleFromPoolType(val: string) {
    setTyped(val)
  }

  const { percent } = useBurnV3State()
  const { onPercentSelect } = useBurnV3ActionHandlers()

  const fromPoolAddress = typed ?? ZERO_ADDRESS
  const { address: parsedAddress } = useENS(fromPoolAddress)

  // TODO: we can save 1 rpc call here by using multicall
  const fromPoolId = usePoolIdByAddress(parsedAddress ?? undefined).poolId
  const { poolId, stakingPoolExists } = usePoolIdByAddress(poolInfo.pool?.address)
  const fromPoolStakeBalance = useStakeBalance(
    isDeactivate ? poolId : fromPoolId,
    isPoolMoving ? poolInfo?.pool?.address : undefined
  )
  const poolContract = usePoolExtendedContract(poolInfo?.pool?.address)

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(percent, onPercentSelect)
  //CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed))
  const parsedAmount = CurrencyAmount.fromRawAmount(
    currencyValue,
    JSBI.divide(
      JSBI.multiply(
        fromPoolStakeBalance ? fromPoolStakeBalance.quotient : JSBI.BigInt(0),
        JSBI.BigInt(percentForSlider)
      ),
      JSBI.BigInt(100)
    )
  )

  const moveStakeData: StakeData = {
    amount: parsedAmount?.quotient.toString(),
    pool: poolInfo.pool?.address,
    fromPoolId,
    poolId: poolId ?? '',
    poolContract: isPoolMoving ? poolContract : null,
    stakingPoolExists,
    isPoolMoving,
  }

  const moveStakeCallback = useMoveStakeCallback()
  const deactivateStakeCallback = useDeactivateStakeCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState(false)
  const [stakeAmount, setStakeAmount] = useState<CurrencyAmount<Currency>>()

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

  async function onMoveStake() {
    setAttempting(true)
    setStakeAmount(parsedAmount)

    // if callback not returned properly ignore
    if (!moveStakeCallback || !deactivateStakeCallback || !fromPoolStakeBalance || !currencyValue.isToken) return

    const moveCallback = !isDeactivate ? moveStakeCallback : deactivateStakeCallback

    // try delegation and store hash
    const hash = await moveCallback(moveStakeData)?.catch((error) => {
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
            {!isDeactivate && (
              <>
                <ThemedText.DeprecatedBody>
                  <Trans>Move stake to the pools that maximize your APR, Your voting power will be unaffected.</Trans>
                </ThemedText.DeprecatedBody>
                <ThemedText.DeprecatedBody>
                  <Trans>Please input the pool you want to move your stake from.</Trans>
                </ThemedText.DeprecatedBody>
                <AddressInputPanel value={typed} onChange={handleFromPoolType} />
              </>
            )}
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
                    {!isDeactivate ? <Trans>Moving</Trans> : <Trans>Deactivating</Trans>}{' '}
                    <Trans>{formatCurrencyAmount(parsedAmount, 4)} GRG Stake</Trans>
                  </ThemedText.DeprecatedBody>
                </RowBetween>
              </AutoColumn>
            </LightCard>
            <ButtonPrimary
              disabled={
                formatCurrencyAmount(parsedAmount, 4) === '0' || (typed !== '' && !isAddress(parsedAddress ?? ''))
              }
              onClick={onMoveStake}
            >
              <ThemedText.DeprecatedMediumHeader color="white">
                {!isDeactivate ? (
                  <Trans>Move Stake</Trans>
                ) : !isPoolMoving ? (
                  <Trans>Deactivate Stake</Trans>
                ) : (
                  <Trans>Deactivate Pool Stake</Trans>
                )}{' '}
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
            {isDeactivate && poolInfo?.owner === account && (
              <TextButton onClick={() => setIsPoolMoving(!isPoolMoving)}>
                <ThemedText.DeprecatedBlue>
                  {isPoolMoving ? <Trans>Deactivate Stake</Trans> : <Trans>Deactivate Pool Stake</Trans>}
                </ThemedText.DeprecatedBlue>
              </TextButton>
            )}
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              {!isDeactivate ? (
                <Trans>Moving Stake</Trans>
              ) : isPoolMoving ? (
                <Trans>Deactivating Pool Stake</Trans>
              ) : (
                <Trans>Deactivating Stake</Trans>
              )}{' '}
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}>{formatCurrencyAmount(parsedAmount, 4)}</ThemedText.DeprecatedMain>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Transaction Submitted</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedMain fontSize={36}>{formatCurrencyAmount(stakeAmount, 4)}</ThemedText.DeprecatedMain>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
