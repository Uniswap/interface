import React, { useCallback, useMemo } from 'react'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { RouteComponentProps } from 'react-router'
import { Redirect } from 'react-router-dom'
import AppBody from '../AppBody'
import { BigNumber } from '@ethersproject/bignumber'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { useBurnV3ActionHandlers, useBurnV3State, useDerivedV3BurnInfo } from 'state/burn/v3/hooks'
import Slider from 'components/Slider'
import { RowBetween, RowFixed } from 'components/Row'
import { MaxButton } from 'pages/Pool/styleds'
import { AutoColumn } from 'components/Column'
import { ButtonConfirmed } from 'components/Button'
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

// TODO still a lot of polishing left here

const UINT128MAX = BigNumber.from(2).pow(128).sub(1)

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
  const position = useV3PositionFromTokenId(tokenId)

  const { account } = useActiveWeb3React()

  // burn state
  const { percent } = useBurnV3State()
  const { liquidity, liquidityValue0, liquidityValue1, feeValue0, feeValue1, error } = useDerivedV3BurnInfo(
    position?.position
  )
  const { onPercentSelect } = useBurnV3ActionHandlers()

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(percent, onPercentSelect)

  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users

  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const burn = useCallback(() => {
    if (!liquidity || !positionManager || !liquidityValue0 || !liquidityValue1 || !deadline || !account) return

    const data = []

    // decreaseLiquidity if necessary
    if (liquidity.gt(0)) {
      data.push(
        positionManager.interface.encodeFunctionData('decreaseLiquidity', [
          {
            tokenId,
            liquidity,
            amount0Min: `0x${JSBI.divide(
              JSBI.multiply(liquidityValue0.raw, JSBI.BigInt(10000 - allowedSlippage)),
              JSBI.BigInt(10000)
            ).toString(16)}`,
            amount1Min: `0x${JSBI.divide(
              JSBI.multiply(liquidityValue1.raw, JSBI.BigInt(10000 - allowedSlippage)),
              JSBI.BigInt(10000)
            ).toString(16)}`,
            deadline,
          },
        ])
      )
    }

    // TODO allow collection in ETH
    data.push(
      positionManager.interface.encodeFunctionData('collect', [
        {
          tokenId,
          recipient: account,
          amount0Max: UINT128MAX,
          amount1Max: UINT128MAX,
        },
      ])
    )

    positionManager
      .multicall(data)
      .then((response: TransactionResponse) => {
        ReactGA.event({
          category: 'Liquidity',
          action: 'RemoveV3',
          label: [liquidityValue0.token.symbol, liquidityValue1.token.symbol].join('/'),
        })

        addTransaction(response, {
          summary: `Remove ${liquidityValue0.token.symbol}/${liquidityValue1.token.symbol} V3 liquidity`,
        })
      })
      .catch((error) => {
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
  ])

  return (
    <AppBody>
      <>
        <Slider value={percentForSlider} onChange={onPercentSelectForSlider} />
        <RowBetween>
          <MaxButton onClick={() => onPercentSelect(25)} width="20%">
            25%
          </MaxButton>
          <MaxButton onClick={() => onPercentSelect(50)} width="20%">
            50%
          </MaxButton>
          <MaxButton onClick={() => onPercentSelect(75)} width="20%">
            75%
          </MaxButton>
          <MaxButton onClick={() => onPercentSelect(100)} width="20%">
            Max
          </MaxButton>
        </RowBetween>

        <RowBetween my="1rem">
          <Text fontSize={16} fontWeight={500}>
            Pooled {liquidityValue0?.token?.symbol}:
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
              {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.token} />
          </RowFixed>
        </RowBetween>
        <RowBetween mb="1rem">
          <Text fontSize={16} fontWeight={500}>
            Pooled {liquidityValue1?.token?.symbol}:
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
              {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.token} />
          </RowFixed>
        </RowBetween>

        <RowBetween my="1rem">
          <Text fontSize={16} fontWeight={500}>
            {feeValue0?.token?.symbol} Fees:
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
              {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue0?.token} />
          </RowFixed>
        </RowBetween>
        <RowBetween mb="1rem">
          <Text fontSize={16} fontWeight={500}>
            {feeValue1?.token?.symbol} Fees:
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
              {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue1?.token} />
          </RowFixed>
        </RowBetween>

        <LightCard>
          <div style={{ display: 'flex', marginTop: '1rem' }}>
            <AutoColumn gap="12px" style={{ flex: '1' }}>
              <ButtonConfirmed confirmed={false} disabled={!liquidity} onClick={burn}>
                {error ?? liquidity?.eq(0) ? 'Collect' : 'Burn'}
              </ButtonConfirmed>
            </AutoColumn>
          </div>
        </LightCard>
      </>
    </AppBody>
  )
}
