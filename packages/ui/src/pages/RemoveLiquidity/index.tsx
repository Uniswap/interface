import { BigNumber } from '@ethersproject/bignumber'
import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, ETHER, Percent, WETH } from '@teleswap/sdk'
import { BackToMyLiquidity } from 'components/LiquidityDetail'
import { usePresetPeripheryAddress } from 'hooks/usePresetContractAddress'
import AppBody from 'pages/AppBody'
import { rgba } from 'polished'
import React, { useCallback, useMemo, useState } from 'react'
import { ArrowDown, Plus } from 'react-feather'
import ReactGA from 'react-ga'
import { useHistory, useParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
// import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { RowBetween, RowFixed } from '../../components/Row'
import Slider from '../../components/Slider'
import { Dots } from '../../components/swap/styleds'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { DomainName } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { usePairContract } from '../../hooks/useContract'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import useThemedContext from '../../hooks/useThemedContext'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/burn/actions'
import { useBurnActionHandlers } from '../../state/burn/hooks'
import { useBurnState, useDerivedBurnInfo } from '../../state/burn/hooks'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { MaxButton /*, Wrapper */ } from '../Liquidity/styles'

const PageWrapper = styled(AutoColumn)`
  max-width: 1200px;
  width: 38rem;
  background-color: ${({ theme }) => theme.common1};
`

export default function RemoveLiquidity() {
  const history = useHistory()
  const { currencyIdA, currencyIdB, stable } = useParams<{ currencyIdA: string; currencyIdB: string; stable: string }>()
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const [tokenA, tokenB] = useMemo(
    () => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)],
    [currencyA, currencyB, chainId]
  )

  const theme = useThemedContext()

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, typedValue } = useBurnState()
  const stableBoolean = stable && stable.toLowerCase() === 'true' ? true : false
  const { pair, parsedAmounts, error } = useDerivedBurnInfo(
    currencyA ?? undefined,
    currencyB ?? undefined,
    stableBoolean
  )
  parsedAmounts['pairMode'] = stable
  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [showDetailed, setShowDetailed] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.LIQUIDITY]:
      independentField === Field.LIQUIDITY ? typedValue : parsedAmounts[Field.LIQUIDITY]?.toSignificant(6) ?? '',
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? ''
  }

  const atMaxAmount = parsedAmounts[Field.LIQUIDITY_PERCENT]?.equalTo(new Percent('1'))

  // pair contract
  const pairContract: Contract | null = usePairContract(pair?.liquidityToken?.address)
  // allowance handling
  const [signatureData, setSignatureData] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)

  const { ROUTER: ROUTER_ADDRESS } = usePresetPeripheryAddress()
  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.LIQUIDITY], ROUTER_ADDRESS)

  const isArgentWallet = useIsArgentWallet()

  async function onAttemptToApprove() {
    if (!pairContract || !pair || !library || !deadline) throw new Error('missing dependencies')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (isArgentWallet) {
      return approveCallback()
    }

    // try to gather a signature for permission
    const nonce = await pairContract.nonces(account)

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ]
    const domain = {
      name: DomainName,
      version: '1',
      chainId,
      verifyingContract: pair.liquidityToken.address
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
    const message = {
      owner: account,
      spender: ROUTER_ADDRESS,
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadline.toNumber()
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit
      },
      domain,
      primaryType: 'Permit',
      message
    })
    library
      .send('eth_signTypedData_v4', [account, data])
      .then(splitSignature)
      .then((signature) => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadline.toNumber()
        })
      })
      .catch((error) => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (error?.code !== 4001) {
          approveCallback()
        }
      })
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      setSignatureData(null)
      return _onUserInput(field, typedValue)
    },
    [_onUserInput]
  )

  const onLiquidityInput = useCallback(
    (typedValue: string): void => onUserInput(Field.LIQUIDITY, typedValue),
    [onUserInput]
  )
  const onCurrencyAInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue),
    [onUserInput]
  )
  const onCurrencyBInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue),
    [onUserInput]
  )

  // tx sending
  const addTransaction = useTransactionAdder()
  async function onRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }
    const router = getRouterContract(chainId, library, account)

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0]
    }

    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB === ETHER
    const oneCurrencyIsETH = currencyA === ETHER || currencyBIsETH

    const pairStable = parsedAmounts['pairMode'] && parsedAmounts['pairMode'].toLowerCase() === 'true' ? true : false
    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[]
    let args: any
    // Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if (approval === ApprovalState.APPROVED) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHSupportingFeeOnTransferTokens']
        args = [
          // currencyBIsETH ? tokenA.address : tokenB.address,
          [
            currencyBIsETH ? tokenA.address : tokenB.address,
            currencyBIsETH ? tokenB.address : tokenA.address,
            pairStable
          ],
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          deadline.toHexString()
        ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        args = [
          [tokenA.address, tokenB.address, pairStable],
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          deadline.toHexString()
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if (signatureData !== null) {
      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitSupportingFeeOnTransferTokens']
        args = [
          [
            currencyBIsETH ? tokenA.address : tokenB.address,
            currencyBIsETH ? tokenB.address : tokenA.address,
            pairStable
          ],
          liquidityAmount.raw.toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),
          amountsMin[currencyBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),
          account,
          signatureData.deadline,
          false,
          [signatureData.v, signatureData.r, signatureData.s]
        ]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']
        args = [
          [tokenA.address, tokenB.address, pairStable],
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          account,
          signatureData.deadline,
          false,
          [signatureData.v, signatureData.r, signatureData.s]
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }
    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName) =>
        router.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch((error) => {
            console.error(`estimateGas failed`, methodName, args, error)
            return undefined
          })
      )
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex((safeGasEstimate) =>
      BigNumber.isBigNumber(safeGasEstimate)
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await router[methodName](...args, {
        gasLimit: safeGasEstimate
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Remove ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencyA?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencyB?.symbol
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Remove',
            label: [currencyA?.symbol, currencyB?.symbol].join('/')
          })
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(error)
        })
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <div style={{ fontSize: '.7rem', fontWeight: '600', color: '#FFFFFF', marginBottom: '.8rem' }}>
          Your will receive
        </div>
        <RowBetween align="flex-end">
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size={'1.2rem'} />
            <Text fontSize={'.6rem'} fontWeight={600} style={{ marginLeft: '.5rem' }}>
              {currencyA?.symbol}
            </Text>
          </RowFixed>
          <Text fontSize={'.55rem'} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
          </Text>
        </RowBetween>
        <RowFixed>{/* <Plus size="16" color={theme.text2} /> */}</RowFixed>
        <RowBetween align="flex-end">
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size={'1.2rem'} />
            <Text fontSize={'.6rem'} fontWeight={600} style={{ marginLeft: '.5rem' }}>
              {currencyB?.symbol}
            </Text>
          </RowFixed>
          <Text fontSize={'.55rem'} fontWeight={500}>
            {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
          </Text>
        </RowBetween>

        <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'12px 0 0 0'}>
          {`* Eatimated output. If price changes by more than ${allowedSlippage / 100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        {/* <RowBetween>
          <Text color={theme.text2} fontWeight={500} fontSize={16}>
            {'UNI ' + currencyA?.symbol + '/' + currencyB?.symbol} Burned
          </Text>
          <RowFixed>
            <DoubleCurrencyLogoHorizontal currency0={currencyA} currency1={currencyB} margin={true} />
            <Text fontWeight={500} fontSize={16}>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </Text>
          </RowFixed>
        </RowBetween> */}
        {/* {pair && (
          <>
            <RowBetween>
              <Text color={theme.text2} fontWeight={500} fontSize={16}>
                Price
              </Text>
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
              </Text>
            </RowBetween>
          </>
        )} */}
        <ButtonPrimary disabled={!(approval === ApprovalState.APPROVED || signatureData !== null)} onClick={onRemove}>
          <Text fontWeight={500} fontSize={'.8rem'}>
            Confirm
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  const pendingText = `Removing ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencyA?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencyB?.symbol}`

  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput]
  )

  const oneCurrencyIsETH = currencyA === ETHER || currencyB === ETHER
  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(WETH[chainId], currencyA)) ||
        (currencyB && currencyEquals(WETH[chainId], currencyB)))
  )

  const handleSelectCurrencyA = useCallback(
    (currency: Currency) => {
      if (currencyIdB && currencyId(currency) === currencyIdB) {
        history.push(`/remove/${currencyId(currency)}/${currencyIdA}`)
      } else {
        history.push(`/remove/${currencyId(currency)}/${currencyIdB}`)
      }
    },
    [currencyIdA, currencyIdB, history]
  )
  const handleSelectCurrencyB = useCallback(
    (currency: Currency) => {
      if (currencyIdA && currencyId(currency) === currencyIdA) {
        history.push(`/remove/${currencyIdB}/${currencyId(currency)}`)
      } else {
        history.push(`/remove/${currencyIdA}/${currencyId(currency)}`)
      }
    },
    [currencyIdA, currencyIdB, history]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureData(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setTxHash('')
  }, [onUserInput, txHash])

  const [innerLiquidityPercentage, setInnerLiquidityPercentage] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback
  )

  return (
    <>
      <Flex justifyContent={'flex-start'} width="24rem">
        <BackToMyLiquidity />
      </Flex>
      <AppBody style={{ boxShadow: 'unset', width: '24rem', maxWidth: '24rem' }}>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash ? txHash : ''}
          content={() => (
            <ConfirmationModalContent
              title={'Remove Liquidity'}
              onDismiss={handleDismissConfirmation}
              topContent={modalHeader}
              bottomContent={modalBottom}
            />
          )}
          pendingText={pendingText}
        />
        <AutoColumn gap="0">
          {/* <BlueCard>
              <AutoColumn gap="10px">
                <TYPE.link fontWeight={400} color={'primaryText1'}>
                  <b>Tip:</b> Removing pool tokens converts your position back into underlying tokens at the current
                  rate, proportional to your share of the pool. Accrued fees are included in the amounts you receive.
                </TYPE.link>
              </AutoColumn>
            </BlueCard> */}
          <LightCard>
            <AutoColumn gap="20px">
              <RowBetween>
                <Text fontWeight={500}>Remove Amount</Text>
                {/* <ClickableText
                    fontWeight={500}
                    onClick={() => {
                      setShowDetailed(!showDetailed)
                    }}
                  >
                    {showDetailed ? 'Simple' : 'Detailed'}
                  </ClickableText> */}
              </RowBetween>
              <Row
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${theme.common3}`,
                  borderRadius: '.8rem',
                  padding: '.8rem'
                }}
              >
                <Text fontSize={'1.6rem'} fontWeight={600} style={{ flex: '2' }}>
                  {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                </Text>
                <div>
                  <span
                    style={{
                      width: 0,
                      height: '1.6rem',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      margin: '0 1rem',
                      position: 'relative',
                      top: '.15rem'
                    }}
                  ></span>
                  <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')} width="2.4rem">
                    25%
                  </MaxButton>
                  <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')} width="2.4rem">
                    50%
                  </MaxButton>
                  <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')} width="2.4rem">
                    75%
                  </MaxButton>
                  <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')} width="2.4rem">
                    100%
                  </MaxButton>
                </div>
              </Row>
              {!showDetailed && (
                <>
                  <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
                </>
              )}
            </AutoColumn>
          </LightCard>
          {!showDetailed && (
            <>
              {/* <ColumnCenter>
                  <ArrowDown size="16" color={theme.text2} />
                </ColumnCenter> */}
              <LightCard style={{ paddingTop: 'unset' }}>
                <AutoColumn gap="10px">
                  <div style={{ fontSize: '.7rem', color: '#FFFFFF', fontWeight: 600, marginBottom: '.8rem' }}>
                    You will receive
                  </div>
                  <RowBetween>
                    <RowFixed>
                      <CurrencyLogo currency={currencyA} style={{ marginRight: '12px' }} />
                      <Text
                        fontSize={'.6rem'}
                        fontWeight={600}
                        style={{ color: theme.common2 }}
                        id="remove-liquidity-tokena-symbol"
                      >
                        {currencyA?.symbol}
                      </Text>
                    </RowFixed>
                    <Text fontSize={'.6rem'} fontWeight={500} style={{ color: theme.common2 }}>
                      {formattedAmounts[Field.CURRENCY_A] || '-'}
                    </Text>
                  </RowBetween>
                  <RowBetween>
                    <RowFixed>
                      <CurrencyLogo currency={currencyB} style={{ marginRight: '12px' }} />
                      <Text
                        fontSize={'.6rem'}
                        fontWeight={600}
                        style={{ color: theme.common2 }}
                        id="remove-liquidity-tokenb-symbol"
                      >
                        {currencyB?.symbol}
                      </Text>
                    </RowFixed>
                    <Text fontSize={'.6rem'} fontWeight={500} style={{ color: theme.common2 }}>
                      {formattedAmounts[Field.CURRENCY_B] || '-'}
                    </Text>
                  </RowBetween>
                  {/* {chainId && (oneCurrencyIsWETH || oneCurrencyIsETH) ? (
                      <RowBetween style={{ justifyContent: 'flex-end' }}>
                        {oneCurrencyIsETH ? (
                          <StyledInternalLink
                            to={`/remove/${currencyA === ETHER ? WETH[chainId].address : currencyIdA}/${
                              currencyB === ETHER ? WETH[chainId].address : currencyIdB
                              }`}
                          >
                            Receive WETH
                          </StyledInternalLink>
                        ) : oneCurrencyIsWETH ? (
                          <StyledInternalLink
                            to={`/remove/${
                              currencyA && currencyEquals(currencyA, WETH[chainId]) ? 'ETH' : currencyIdA
                              }/${currencyB && currencyEquals(currencyB, WETH[chainId]) ? 'ETH' : currencyIdB}`}
                          >
                            Receive ETH
                          </StyledInternalLink>
                        ) : null}
                      </RowBetween>
                    ) : null} */}
                </AutoColumn>
              </LightCard>
            </>
          )}
          {showDetailed && (
            <>
              <CurrencyInputPanel
                value={formattedAmounts[Field.LIQUIDITY]}
                onUserInput={onLiquidityInput}
                onMax={() => {
                  onUserInput(Field.LIQUIDITY_PERCENT, '100')
                }}
                showMaxButton={!atMaxAmount}
                disableCurrencySelect
                currency={pair?.liquidityToken}
                pair={pair}
                id="liquidity-amount"
              />
              <ColumnCenter>
                <ArrowDown size="16" color={theme.text2} />
              </ColumnCenter>
              <CurrencyInputPanel
                hideBalance={true}
                value={formattedAmounts[Field.CURRENCY_A]}
                onUserInput={onCurrencyAInput}
                onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                showMaxButton={!atMaxAmount}
                currency={currencyA}
                label={'Output'}
                onCurrencySelect={handleSelectCurrencyA}
                id="remove-liquidity-tokena"
              />
              <ColumnCenter>
                <Plus size="16" color={theme.text2} />
              </ColumnCenter>
              <CurrencyInputPanel
                hideBalance={true}
                value={formattedAmounts[Field.CURRENCY_B]}
                onUserInput={onCurrencyBInput}
                onMax={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}
                showMaxButton={!atMaxAmount}
                currency={currencyB}
                label={'Output'}
                onCurrencySelect={handleSelectCurrencyB}
                id="remove-liquidity-tokenb"
              />
            </>
          )}
          {pair && (
            <div style={{ padding: '10px 20px', fontSize: '.7rem' }}>
              <div
                style={{
                  width: '100%',
                  height: '1px',
                  backgroundColor: rgba(255, 255, 255, 0.2),
                  marginBottom: '.8rem'
                }}
              ></div>
              <RowBetween>
                Price:
                <Text
                  sx={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: '500',
                    fontSize: '16px',
                    lineHeight: '24px',
                    textAlign: 'center',
                    color: '#FFFFFF'
                  }}
                >
                  1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'} {currencyB?.symbol}
                </Text>
              </RowBetween>
              <Flex justifyContent={'flex-end'}>
                <Text
                  sx={{
                    fontFamily: 'Poppins',
                    fontStyle: 'normal',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '18px',
                    textAlign: 'center',
                    color: '#999999'
                  }}
                >
                  1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'} {currencyA?.symbol}
                </Text>
              </Flex>
            </div>
          )}
        </AutoColumn>
      </AppBody>
      {pair ? (
        <AutoColumn style={{ marginTop: '.8rem', width: '24rem' }}>
          <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
        </AutoColumn>
      ) : null}
      <div style={{ position: 'relative', marginTop: '2rem', width: '24rem' }}>
        {!account ? (
          <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
        ) : (
          <RowBetween>
            <ButtonConfirmed
              style={{
                width: '45%'
              }}
              onClick={onAttemptToApprove}
              confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
              disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
              mr="0.5rem"
              fontWeight={500}
              fontSize={'.8rem'}
            >
              {approval === ApprovalState.PENDING ? (
                <Dots>Approving</Dots>
              ) : approval === ApprovalState.APPROVED || signatureData !== null ? (
                'Approved'
              ) : (
                'Approve'
              )}
            </ButtonConfirmed>
            <ButtonError
              style={{
                width: '45%'
              }}
              onClick={() => {
                setShowConfirm(true)
              }}
              disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
              error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
            >
              <Text fontSize={'.8rem'} fontWeight={500}>
                {error || 'Remove'}
              </Text>
            </ButtonError>
          </RowBetween>
        )}
      </div>
    </>
  )
}
