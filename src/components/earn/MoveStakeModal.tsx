import { isAddress } from '@ethersproject/address'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { ReactNode, /*useCallback,*/ useState } from 'react'
import { X } from 'react-feather'
import styled from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { ZERO_ADDRESS } from '../../constants/misc'
import { GRG } from '../../constants/tokens'
import useDebouncedChangeHandler from '../../hooks/useDebouncedChangeHandler'
import useENS from '../../hooks/useENS'
import { ResponsiveHeaderText, SmallMaxButton } from '../../pages/RemoveLiquidity/styled'
// TODO: check if should write into state stake hooks
import { useBurnV3ActionHandlers, useBurnV3State } from '../../state/burn/v3/hooks'
import { PoolInfo /*,useDerivedPoolInfo*/ } from '../../state/buy/hooks'
import { useMoveStakeCallback, usePoolIdByAddress, useStakeBalance } from '../../state/governance/hooks'
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

/*
const TextButton = styled.div`
  :hover {
    cursor: pointer;
  }
`
*/

interface MoveStakeModalProps {
  isOpen: boolean
  poolInfo: PoolInfo
  onDismiss: () => void
  title: ReactNode
}

export default function MoveStakeModal({ isOpen, poolInfo, onDismiss, title }: MoveStakeModalProps) {
  const { chainId } = useWeb3React()

  // state for delegate input
  const [currencyValue] = useState<Currency>(GRG[chainId ?? 1])
  const [typed, setTyped] = useState('')

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
  // hack to allow moving stake from deprecated pool
  const defaultPoolId = '0x0000000000000000000000000000000000000000000000000000000000000021'
  const fromPoolStakeBalance = useStakeBalance(fromPoolId ?? defaultPoolId)

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

  const moveStakeData = {
    amount: parsedAmount?.quotient.toString(),
    pool: poolInfo.pool?.address,
    fromPoolId: fromPoolId ?? defaultPoolId,
    poolId,
    poolContract: undefined,
    stakingPoolExists,
  }

  const moveStakeCallback = useMoveStakeCallback()

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
    if (!moveStakeCallback || !fromPoolStakeBalance || !moveStakeData || !currencyValue.isToken) return

    // try delegation and store hash
    const hash = await moveStakeCallback(moveStakeData ?? undefined)?.catch((error) => {
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
            <ThemedText.DeprecatedBody>
              <Trans>Move stake to the pools that maximize your APR, Your voting power will be unaffected.</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody>
              <Trans>Please input the pool you want to move your stake from.</Trans>
            </ThemedText.DeprecatedBody>
            {/* we must append deprecated staked pools to the pools array */}
            <AddressInputPanel value={typed} onChange={handleFromPoolType} />
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
                    <Trans>Moving {formatCurrencyAmount(parsedAmount, 4)} GRG Stake</Trans>
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
                <Trans>Move Stake</Trans>
              </ThemedText.DeprecatedMediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Moving Stake</Trans>
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
