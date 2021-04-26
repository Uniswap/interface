import React, { useCallback, useMemo, useState } from 'react'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { Redirect, RouteComponentProps, Link } from 'react-router-dom'
import AppBody from '../AppBody'
import { BigNumber } from '@ethersproject/bignumber'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { useBurnV3ActionHandlers, useBurnV3State, useDerivedV3BurnInfo } from 'state/burn/v3/hooks'
import Slider from 'components/Slider'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import TransactionConfirmationModal from '../../components/TransactionConfirmationModal'
import { AutoColumn } from 'components/Column'
import { ButtonConfirmed, ButtonText } from 'components/Button'
import { LightCard } from 'components/Card'
import { Text } from 'rebass'
import CurrencyLogo from 'components/CurrencyLogo'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useUserSlippageTolerance } from 'state/user/hooks'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import JSBI from 'jsbi'
import ReactGA from 'react-ga'
import { useActiveWeb3React } from 'hooks'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from 'state/transactions/hooks'
import { WETH9 } from '@uniswap/sdk-core'
import { TYPE } from 'theme'
import styled from 'styled-components'
import { Wrapper, SmallMaxButton } from './styled'
import Loader from 'components/Loader'
import { useToken } from 'hooks/Tokens'
import { unwrappedToken } from 'utils/wrappedCurrency'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { RangeBadge } from 'pages/AddLiquidity/styled'
import { Break } from 'components/earn/styled'

export const UINT128MAX = BigNumber.from(2).pow(128).sub(1)

const UnstyledLink = styled(Link)`
  text-decoration: none;
`

// redirect invalid tokenIds
export default function RemoveLiquidityV3({
  location,
  match: {
    params: { tokenId },
  },
}: RouteComponentProps<{ tokenId: string }>) {
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId)
    } catch {
      return null
    }
  }, [tokenId])

  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Redirect to={{ ...location, pathname: '/pool' }} />
  }

  return <Remove tokenId={parsedTokenId} />
}
function Remove({ tokenId }: { tokenId: BigNumber }) {
  const { position } = useV3PositionFromTokenId(tokenId)

  const { account, chainId } = useActiveWeb3React()

  // currencies from position
  const token0 = useToken(position?.token0)
  const token1 = useToken(position?.token1)
  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // burn state
  const { percent } = useBurnV3State()
  const { liquidity, liquidityValue0, liquidityValue1, feeValue0, feeValue1, outOfRange, error } = useDerivedV3BurnInfo(
    position
  )
  const { onPercentSelect } = useBurnV3ActionHandlers()

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(percent, onPercentSelect)

  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users

  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const burn = useCallback(() => {
    setShowConfirm(true)
    setAttemptingTxn(true)
    if (
      !liquidity ||
      !positionManager ||
      !liquidityValue0 ||
      !liquidityValue1 ||
      !deadline ||
      !account ||
      !chainId ||
      !feeValue0 ||
      !feeValue1
    ) {
      setShowConfirm(false)
      return
    }

    const data = []

    // decreaseLiquidity if necessary
    const amount0Min = JSBI.divide(
      JSBI.multiply(liquidityValue0.raw, JSBI.BigInt(10000 - allowedSlippage)),
      JSBI.BigInt(10000)
    )
    const amount1Min = JSBI.divide(
      JSBI.multiply(liquidityValue1.raw, JSBI.BigInt(10000 - allowedSlippage)),
      JSBI.BigInt(10000)
    )
    if (liquidity.gt(0)) {
      data.push(
        positionManager.interface.encodeFunctionData('decreaseLiquidity', [
          {
            tokenId,
            liquidity,
            amount0Min: `0x${amount0Min.toString(16)}`,
            amount1Min: `0x${amount1Min.toString(16)}`,
            deadline,
          },
        ])
      )
    }

    const involvesWETH = liquidityValue0.token.equals(WETH9[chainId]) || liquidityValue1.token.equals(WETH9[chainId])

    // collect, hard-coding ETH collection for now
    data.push(
      positionManager.interface.encodeFunctionData('collect', [
        {
          tokenId,
          recipient: involvesWETH ? positionManager.address : account,
          amount0Max: UINT128MAX,
          amount1Max: UINT128MAX,
        },
      ])
    )

    if (involvesWETH) {
      // unwrap
      data.push(
        positionManager.interface.encodeFunctionData('unwrapWETH9', [
          `0x${(liquidityValue0.token.equals(WETH9[chainId])
            ? JSBI.add(amount0Min, feeValue0.raw)
            : JSBI.add(amount1Min, feeValue1.raw)
          ).toString(16)}`,
          account,
        ])
      )

      // sweep
      data.push(
        positionManager.interface.encodeFunctionData('sweepToken', [
          liquidityValue0.token.equals(WETH9[chainId]) ? liquidityValue1.token.address : liquidityValue0.token.address,
          `0x${(liquidityValue0.token.equals(WETH9[chainId])
            ? JSBI.add(amount1Min, feeValue1.raw)
            : JSBI.add(amount0Min, feeValue0.raw)
          ).toString(16)}`,
          account,
        ])
      )
    }

    positionManager
      .multicall(data)
      .then((response: TransactionResponse) => {
        ReactGA.event({
          category: 'Liquidity',
          action: 'RemoveV3',
          label: [liquidityValue0.token.symbol, liquidityValue1.token.symbol].join('/'),
        })
        setTxnHash(response.hash)
        setAttemptingTxn(false)
        addTransaction(response, {
          summary: `Remove ${liquidityValue0.token.symbol}/${liquidityValue1.token.symbol} V3 liquidity`,
        })
      })
      .catch((error) => {
        setShowConfirm(false)
        setAttemptingTxn(false)
        console.error(error)
      })
  }, [
    tokenId,
    liquidity,
    liquidityValue0,
    liquidityValue1,
    deadline,
    allowedSlippage,
    account,
    addTransaction,
    positionManager,
    chainId,
    feeValue0,
    feeValue1,
  ])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txnHash) {
      onPercentSelectForSlider(0)
    }
    setAttemptingTxn(false)
    setTxnHash('')
  }, [onPercentSelectForSlider, txnHash])

  const pendingText = `Removing ${liquidityValue0?.toSignificant(6)} ${
    currency0?.symbol
  } and ${liquidityValue1?.toSignificant(6)} ${currency1?.symbol}`

  return (
    <AutoColumn>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash ?? ''}
        content={() => <div />}
        pendingText={pendingText}
      />
      <AutoRow marginBottom="20px">
        <UnstyledLink to="pool">
          <ButtonText opacity={'0.4'}>Pool</ButtonText>
        </UnstyledLink>
        <TYPE.label margin="0 10px" opacity={'0.4'}>
          {' > '}
        </TYPE.label>
        <TYPE.label>{liquidity?.eq(0) ? 'Collect Fees' : 'Remove Liquidity'}</TYPE.label>
      </AutoRow>
      <AppBody>
        <Wrapper>
          {position ? (
            <AutoColumn gap="lg">
              <RowBetween>
                <RowFixed>
                  <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={20} margin={true} />
                  <TYPE.label ml="10px" fontSize="20px">{`${currency0?.symbol}/${currency1?.symbol}`}</TYPE.label>
                </RowFixed>
                <RangeBadge inRange={!outOfRange}>{outOfRange ? 'Out of range' : 'In Range'}</RangeBadge>
              </RowBetween>
              <LightCard>
                <AutoColumn gap="md">
                  <TYPE.main fontWeight={400}>Amount</TYPE.main>
                  <RowBetween>
                    <TYPE.label fontSize="40px">{percentForSlider}%</TYPE.label>
                    <AutoRow gap="4px" justify="flex-end">
                      <SmallMaxButton onClick={() => onPercentSelect(25)} width="20%">
                        25%
                      </SmallMaxButton>
                      <SmallMaxButton onClick={() => onPercentSelect(50)} width="20%">
                        50%
                      </SmallMaxButton>
                      <SmallMaxButton onClick={() => onPercentSelect(75)} width="20%">
                        75%
                      </SmallMaxButton>
                      <SmallMaxButton onClick={() => onPercentSelect(100)} width="20%">
                        Max
                      </SmallMaxButton>
                    </AutoRow>
                  </RowBetween>
                  <Slider value={percentForSlider} onChange={onPercentSelectForSlider} />
                </AutoColumn>
              </LightCard>
              <LightCard>
                <AutoColumn gap="md">
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      Pooled {currency0?.symbol}:
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.token} />
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      Pooled {currency1?.symbol}:
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.token} />
                    </RowFixed>
                  </RowBetween>
                  {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) ? (
                    <>
                      <Break />
                      <RowBetween>
                        <Text fontSize={16} fontWeight={500}>
                          {currency0?.symbol} Fees Earned:
                        </Text>
                        <RowFixed>
                          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                            {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
                          </Text>
                          <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue0?.token} />
                        </RowFixed>
                      </RowBetween>
                      <RowBetween>
                        <Text fontSize={16} fontWeight={500}>
                          {currency1?.symbol} Fees Earned:
                        </Text>
                        <RowFixed>
                          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                            {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
                          </Text>
                          <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue1?.token} />
                        </RowFixed>
                      </RowBetween>
                    </>
                  ) : null}
                </AutoColumn>
              </LightCard>
              <div style={{ display: 'flex' }}>
                <AutoColumn gap="12px" style={{ flex: '1' }}>
                  <ButtonConfirmed confirmed={false} disabled={!liquidity} onClick={burn}>
                    {error ?? liquidity?.eq(0) ? 'Collect' : 'Remove Liquidity'}
                  </ButtonConfirmed>
                </AutoColumn>
              </div>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Wrapper>
      </AppBody>
    </AutoColumn>
  )
}
