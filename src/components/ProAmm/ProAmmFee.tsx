import { NonfungiblePositionManager, Position } from '@kyberswap/ks-sdk-elastic'
import { TransactionResponse } from '@ethersproject/providers'
import React, { useCallback } from 'react'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import { AutoColumn } from 'components/Column'
import { OutlineCard } from 'components/Card'
import Divider from 'components/Divider'
import { RowBetween, RowFixed } from 'components/Row'
import CurrencyLogo from 'components/CurrencyLogo'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import { Trans, t } from '@lingui/macro'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { BigNumber } from '@ethersproject/bignumber'
import { useProAmmPositionFees } from 'hooks/useProAmmPositionFees'
import { ButtonCollect } from 'components/Button'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { calculateGasMargin, basisPointsToPercent } from 'utils'
import { useTransactionAdder } from 'state/transactions/hooks'
import QuestionHelper from 'components/QuestionHelper'
import { MouseoverTooltip } from 'components/Tooltip'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { Info } from 'react-feather'
import { useUserSlippageTolerance } from 'state/user/hooks'

export default function ProAmmFee({
  tokenId,
  position,
  layout = 0,
  text = '',
  farmAvailable,
}: {
  tokenId: BigNumber
  position: Position
  layout?: number
  text?: string
  farmAvailable?: boolean
}) {
  const { chainId, account, library } = useActiveWeb3React()
  const theme = useTheme()
  const [feeValue0, feeValue1] = useProAmmPositionFees(tokenId, position, false)
  const token0Shown = unwrappedToken(position.pool.token0)
  const token1Shown = unwrappedToken(position.pool.token1)
  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()
  const deadline = useTransactionDeadline() // custom from users settings
  const { mixpanelHandler } = useMixpanel()

  const [allowedSlippage] = useUserSlippageTolerance()

  const collect = useCallback(() => {
    if (
      !chainId ||
      !feeValue0 ||
      !feeValue1 ||
      !positionManager ||
      !account ||
      !tokenId ||
      !library ||
      !deadline ||
      !layout
    )
      return
    // setCollecting(true)
    mixpanelHandler(MIXPANEL_TYPE.ELASTIC_COLLECT_FEES_INITIATED, {
      token_1: token0Shown?.symbol,
      token_2: token1Shown?.symbol,
    })

    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage))),
      expectedCurrencyOwed1: feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage))),
      recipient: account,
      deadline: deadline.toString(),
      havingFee: true,
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then(estimate => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            addTransactionWithType(response, {
              type: 'Collect fee',
              summary:
                feeValue0.toSignificant(6) +
                ' ' +
                feeValue0.currency.symbol +
                ' and ' +
                feeValue1.toSignificant(6) +
                ' ' +
                feeValue1.currency.symbol,
              arbitrary: {
                token_1: token0Shown?.symbol,
                token_2: token1Shown?.symbol,
                token_1_amount: feeValue0.toSignificant(6),
                token_2_amount: feeValue1.toSignificant(6),
              },
            })
          })
      })
      .catch(error => {
        console.error(error)
      })
  }, [
    chainId,
    feeValue0,
    feeValue1,
    positionManager,
    account,
    tokenId,
    addTransactionWithType,
    library,
    deadline,
    layout,
    token0Shown,
    token1Shown,
    mixpanelHandler,
    allowedSlippage,
  ])
  const disabledCollect = !(feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0)) || farmAvailable

  const render =
    layout === 0 ? (
      <OutlineCard marginTop="1rem" padding="1rem">
        <AutoColumn gap="md">
          <Text fontSize="16px" fontWeight="500">
            Your Fee Earnings
          </Text>
          {text && (
            <Text color={theme.subText} fontSize="12px">
              {text}
            </Text>
          )}

          <Divider />
          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>{token0Shown.symbol} FEES EARNED</Trans>
            </Text>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token0Shown} />
              <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />} {token0Shown.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <Text fontSize={12} fontWeight={500} color={theme.subText}>
              <Trans>{token1Shown.symbol} FEES EARNED</Trans>
            </Text>
            <RowFixed>
              <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token1Shown} />
              <Text fontSize={14} fontWeight={500} marginLeft={'6px'}>
                {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />} {token1Shown.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </OutlineCard>
    ) : (
      <>
        <OutlineCard marginTop="1rem" padding="1rem">
          <AutoColumn gap="md">
            <RowBetween>
              <Flex>
                <Text fontSize={12} fontWeight={500} color={theme.subText}>
                  <Trans>{token0Shown.symbol} Fees Earned</Trans>
                </Text>
                <QuestionHelper text={t`Your fees are being automatically compounded so you earn more`} />
              </Flex>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token0Shown} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
                </Text>
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <Flex>
                <Text fontSize={12} fontWeight={500} color={theme.subText}>
                  <Trans>{token1Shown.symbol} Fees Earned</Trans>
                </Text>
                <QuestionHelper text={t`Your fees are being automatically compounded so you earn more`} />
              </Flex>
              <RowFixed>
                <CurrencyLogo size="16px" style={{ marginLeft: '8px' }} currency={token1Shown} />
                <Text fontSize={12} fontWeight={500} marginLeft={'6px'}>
                  {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
                </Text>
              </RowFixed>
            </RowBetween>
            {farmAvailable ? (
              <MouseoverTooltip
                placement="top"
                text={farmAvailable ? t`You need to withdraw your liquidity from the farms first` : ''}
              >
                <ButtonCollect
                  style={{
                    padding: '10px',
                    fontSize: '14px',
                    cursor: 'not-allowed',
                    background: theme.buttonGray,
                    color: theme.subText,
                  }}
                >
                  <Flex alignItems="center" sx={{ gap: '4px' }}>
                    <Trans>Collect Fees</Trans>
                    <Info size={14} />
                  </Flex>
                </ButtonCollect>
              </MouseoverTooltip>
            ) : (
              <ButtonCollect disabled={disabledCollect} onClick={collect} style={{ padding: '10px', fontSize: '14px' }}>
                <Flex>
                  <Trans>Collect Fees</Trans>
                  <QuestionHelper
                    text={
                      disabledCollect
                        ? t`You don't have any fees to collect`
                        : t`By collecting, you will receive 100% of your fee earnings`
                    }
                    color={disabledCollect ? theme.disableText : theme.primary}
                  />
                </Flex>
              </ButtonCollect>
            )}
          </AutoColumn>
        </OutlineCard>
      </>
    )
  return render
}
