import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { NonfungiblePositionManager } from '@uniswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import { LightCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { Break } from 'components/earn/styled'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Loader from 'components/Loader'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { AutoRow, RowBetween, RowFixed } from 'components/Row'
import Slider from 'components/Slider'
import Toggle from 'components/Toggle'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useMemo, useState } from 'react'
import ReactGA from 'react-ga'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { useBurnV3ActionHandlers, useBurnV3State, useDerivedV3BurnInfo } from 'state/burn/v3/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { TYPE } from 'theme'

import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { WETH9_EXTENDED } from '../../constants/tokens'
import { TransactionType } from '../../state/transactions/actions'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { currencyId } from '../../utils/currencyId'
import AppBody from '../AppBody'
import { ResponsiveHeaderText, SmallMaxButton, Wrapper } from './styled'

const DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(5, 100)

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
  const theme = useTheme()
  const { account, chainId, library } = useActiveWeb3React()

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)

  // burn state
  const { percent } = useBurnV3State()
  const {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    feeValue0,
    feeValue1,
    outOfRange,
    error,
  } = useDerivedV3BurnInfo(position, receiveWETH)
  const { onPercentSelect } = useBurnV3ActionHandlers()

  const removed = position?.liquidity?.eq(0)

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(percent, onPercentSelect)

  const deadline = useTransactionDeadline() // custom from users settings
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE) // custom from users

  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const burn = useCallback(async () => {
    setAttemptingTxn(true)
    if (
      !positionManager ||
      !liquidityValue0 ||
      !liquidityValue1 ||
      !deadline ||
      !account ||
      !chainId ||
      !feeValue0 ||
      !feeValue1 ||
      !positionSDK ||
      !liquidityPercentage ||
      !library
    ) {
      return
    }

    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(positionSDK, {
      tokenId: tokenId.toString(),
      liquidityPercentage,
      slippageTolerance: allowedSlippage,
      deadline: deadline.toString(),
      collectOptions: {
        expectedCurrencyOwed0: feeValue0,
        expectedCurrencyOwed1: feeValue1,
        recipient: account,
      },
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    library
      .getSigner()
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }

        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            ReactGA.event({
              category: 'Liquidity',
              action: 'RemoveV3',
              label: [liquidityValue0.currency.symbol, liquidityValue1.currency.symbol].join('/'),
            })
            setTxnHash(response.hash)
            setAttemptingTxn(false)
            addTransaction(response, {
              type: TransactionType.REMOVE_LIQUIDITY_V3,
              baseCurrencyId: currencyId(liquidityValue0.currency),
              quoteCurrencyId: currencyId(liquidityValue1.currency),
              expectedAmountBaseRaw: liquidityValue0.quotient.toString(),
              expectedAmountQuoteRaw: liquidityValue1.quotient.toString(),
            })
          })
      })
      .catch((error) => {
        setAttemptingTxn(false)
        console.error(error)
      })
  }, [
    positionManager,
    liquidityValue0,
    liquidityValue1,
    deadline,
    account,
    chainId,
    feeValue0,
    feeValue1,
    positionSDK,
    liquidityPercentage,
    library,
    tokenId,
    allowedSlippage,
    addTransaction,
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

  const pendingText = (
    <Trans>
      Removing {liquidityValue0?.toSignificant(6)} {liquidityValue0?.currency?.symbol} and{' '}
      {liquidityValue1?.toSignificant(6)} {liquidityValue1?.currency?.symbol}
    </Trans>
  )

  function modalHeader() {
    return (
      <AutoColumn gap={'sm'} style={{ padding: '16px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight={500}>
            <Trans>Pooled {liquidityValue0?.currency?.symbol}:</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
              {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
          </RowFixed>
        </RowBetween>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight={500}>
            <Trans>Pooled {liquidityValue1?.currency?.symbol}:</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
              {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
            </Text>
            <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
          </RowFixed>
        </RowBetween>
        {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) ? (
          <>
            <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'8px 0 0 0'}>
              <Trans>You will also collect fees earned from this position.</Trans>
            </TYPE.italic>
            <RowBetween>
              <Text fontSize={16} fontWeight={500}>
                <Trans>{feeValue0?.currency?.symbol} Fees Earned:</Trans>
              </Text>
              <RowFixed>
                <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                  {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
                </Text>
                <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue0?.currency} />
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <Text fontSize={16} fontWeight={500}>
                <Trans>{feeValue1?.currency?.symbol} Fees Earned:</Trans>
              </Text>
              <RowFixed>
                <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                  {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
                </Text>
                <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue1?.currency} />
              </RowFixed>
            </RowBetween>
          </>
        ) : null}
        <ButtonPrimary mt="16px" onClick={burn}>
          <Trans>Remove</Trans>
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const showCollectAsWeth = Boolean(
    liquidityValue0?.currency &&
      liquidityValue1?.currency &&
      (liquidityValue0.currency.isNative ||
        liquidityValue1.currency.isNative ||
        liquidityValue0.currency.wrapped.equals(WETH9_EXTENDED[liquidityValue0.currency.chainId]) ||
        liquidityValue1.currency.wrapped.equals(WETH9_EXTENDED[liquidityValue1.currency.chainId]))
  )
  return (
    <AutoColumn>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash ?? ''}
        content={() => (
          <ConfirmationModalContent
            title={<Trans>Remove Liquidity</Trans>}
            onDismiss={handleDismissConfirmation}
            topContent={modalHeader}
          />
        )}
        pendingText={pendingText}
      />
      <AppBody>
        <AddRemoveTabs
          creating={false}
          adding={false}
          positionID={tokenId.toString()}
          defaultSlippage={DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE}
        />
        <Wrapper>
          {position ? (
            <AutoColumn gap="lg">
              <RowBetween>
                <RowFixed>
                  <DoubleCurrencyLogo
                    currency0={feeValue0?.currency}
                    currency1={feeValue1?.currency}
                    size={20}
                    margin={true}
                  />
                  <TYPE.label
                    ml="10px"
                    fontSize="20px"
                  >{`${feeValue0?.currency?.symbol}/${feeValue1?.currency?.symbol}`}</TYPE.label>
                </RowFixed>
                <RangeBadge removed={removed} inRange={!outOfRange} />
              </RowBetween>
              <LightCard>
                <AutoColumn gap="md">
                  <TYPE.main fontWeight={400}>
                    <Trans>Amount</Trans>
                  </TYPE.main>
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
                </AutoColumn>
              </LightCard>
              <LightCard>
                <AutoColumn gap="md">
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      <Trans>Pooled {liquidityValue0?.currency?.symbol}:</Trans>
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {liquidityValue0 && <FormattedCurrencyAmount currencyAmount={liquidityValue0} />}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <Text fontSize={16} fontWeight={500}>
                      <Trans>Pooled {liquidityValue1?.currency?.symbol}:</Trans>
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                        {liquidityValue1 && <FormattedCurrencyAmount currencyAmount={liquidityValue1} />}
                      </Text>
                      <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
                    </RowFixed>
                  </RowBetween>
                  {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) ? (
                    <>
                      <Break />
                      <RowBetween>
                        <Text fontSize={16} fontWeight={500}>
                          <Trans>{feeValue0?.currency?.symbol} Fees Earned:</Trans>
                        </Text>
                        <RowFixed>
                          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                            {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}
                          </Text>
                          <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue0?.currency} />
                        </RowFixed>
                      </RowBetween>
                      <RowBetween>
                        <Text fontSize={16} fontWeight={500}>
                          <Trans>{feeValue1?.currency?.symbol} Fees Earned:</Trans>
                        </Text>
                        <RowFixed>
                          <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                            {feeValue1 && <FormattedCurrencyAmount currencyAmount={feeValue1} />}
                          </Text>
                          <CurrencyLogo size="20px" style={{ marginLeft: '8px' }} currency={feeValue1?.currency} />
                        </RowFixed>
                      </RowBetween>
                    </>
                  ) : null}
                </AutoColumn>
              </LightCard>

              {showCollectAsWeth && (
                <RowBetween>
                  <TYPE.main>
                    <Trans>Collect as WETH</Trans>
                  </TYPE.main>
                  <Toggle
                    id="receive-as-weth"
                    isActive={receiveWETH}
                    toggle={() => setReceiveWETH((receiveWETH) => !receiveWETH)}
                  />
                </RowBetween>
              )}

              <div style={{ display: 'flex' }}>
                <AutoColumn gap="12px" style={{ flex: '1' }}>
                  <ButtonConfirmed
                    confirmed={false}
                    disabled={removed || percent === 0 || !liquidityValue0}
                    onClick={() => setShowConfirm(true)}
                  >
                    {removed ? <Trans>Closed</Trans> : error ?? <Trans>Remove</Trans>}
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
