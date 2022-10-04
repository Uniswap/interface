import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { NonfungiblePositionManager, Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { useCallback } from 'react'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'

import { ButtonLight } from 'components/Button'
import { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import QuestionHelper from 'components/QuestionHelper'
import { RowBetween, RowFixed } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useProAmmPositionFees } from 'hooks/useProAmmPositionFees'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { basisPointsToPercent, calculateGasMargin } from 'utils'
import { unwrappedToken } from 'utils/wrappedCurrency'

export default function ProAmmFee({
  tokenId,
  position,
  layout = 0,
  text = '',
  hasUserDepositedInFarm,
}: {
  tokenId: BigNumber
  position: Position
  layout?: number
  text?: string
  hasUserDepositedInFarm?: boolean
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
  const hasNoFeeToCollect = !(feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0))

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
            {hasUserDepositedInFarm ? (
              <MouseoverTooltip
                placement="top"
                text={t`You need to withdraw your deposited liquidity position from the Farm first`}
              >
                <Flex
                  // this flex looks like redundant
                  // but without this, the cursor will be default
                  // as we put pointerEvents=none on the button
                  sx={{
                    cursor: 'not-allowed',
                    width: '100%',
                  }}
                >
                  <ButtonLight
                    style={{
                      padding: '10px',
                      fontSize: '14px',
                      width: '100%',
                      pointerEvents: 'none',
                    }}
                    disabled
                  >
                    <Flex alignItems="center" sx={{ gap: '8px' }}>
                      <Info size={16} />
                      <Trans>Collect Fees</Trans>
                    </Flex>
                  </ButtonLight>
                </Flex>
              </MouseoverTooltip>
            ) : (
              <ButtonLight disabled={hasNoFeeToCollect} onClick={collect} style={{ padding: '10px', fontSize: '14px' }}>
                <Flex alignItems="center" sx={{ gap: '8px' }}>
                  <QuestionHelper
                    size={16}
                    text={
                      hasNoFeeToCollect
                        ? t`You don't have any fees to collect`
                        : t`By collecting, you will receive 100% of your fee earnings`
                    }
                    color={hasNoFeeToCollect ? theme.disableText : theme.primary}
                  />
                  <Trans>Collect Fees</Trans>
                </Flex>
              </ButtonLight>
            )}
          </AutoColumn>
        </OutlineCard>
      </>
    )
  return render
}
