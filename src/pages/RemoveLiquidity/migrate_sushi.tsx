import { splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { ETHER, Fraction, WETH, CurrencyAmount, TokenAmount, currencyEquals } from 'libs/sdk/src'
import { Currency, Pair, Percent } from '@sushiswap/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown, Plus } from 'react-feather'
import { RouteComponentProps } from 'react-router'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { ButtonPrimary, ButtonLight, ButtonError, ButtonConfirmed } from '../../components/Button'
import { LightCard, YellowCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs, MigrateTab } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { RowBetween, RowFixed } from '../../components/Row'

import Slider from '../../components/Slider'
import CurrencyLogo from '../../components/CurrencyLogo'
import { MIGRATE_ADDRESS, ROUTER_ADDRESS, ROUTER_ADDRESS_UNI, ZERO_ADDRESS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { usePairContract } from '../../hooks/useContract'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import {
  calculateGasMargin,
  calculateSlippageAmount,
  getMigratorContract,
  getRouterContract,
  shortenAddress
} from '../../utils'
import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { ClickableText, MaxButton, Wrapper } from '../Pool/styleds'
import { useApproveCallback as useApproveCallbackSUSHI, ApprovalState } from '../../hooks/useApproveCallbackSUSHI'
import { Dots } from '../../components/swap/styleds'
import { useBurnActionHandlers } from '../../state/burn/hooks'
import { useDerivedBurnInfo as useDerivedBurnInfoSUSHI, useBurnState } from '../../state/burn/hooks_sushi'
import { Field } from '../../state/burn/actions'
import { Field as FieldMint } from '../../state/mint/actions'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { Redirect } from 'react-router-dom'
import { useDerivedMintInfoMigration } from 'state/mint/hooks_for_migration'
import { useMintState } from 'state/mint/hooks'
import isZero from 'utils/isZero'
import { tokenAmountDmmToSushi, tokenDmmToSushi } from 'utils/dmm'
import { useUnAmplifiedPair } from 'data/Reserves'

const DashedLine = styled.div`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.bg3};
  border-style: dashed;
  margin-top: 1rem;
`

export default function MigrateLiquiditySUSHI({
  history,
  match: {
    params: { currencyIdA, currencyIdB, pairAddress }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; pairAddress: string }>) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const [tokenA, tokenB] = useMemo(() => [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)], [
    currencyA,
    currencyB,
    chainId
  ])
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { independentField, typedValue } = useBurnState()
  const unAmplifiedPairAddress = useUnAmplifiedPair(tokenA, tokenB)
  const { pair, parsedAmounts, error } = useDerivedBurnInfoSUSHI(currencyA ?? undefined, currencyB ?? undefined)

  const { onUserInput: _onUserInput } = useBurnActionHandlers()
  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
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
  const [approval, approveCallback] = useApproveCallbackSUSHI(parsedAmounts[Field.LIQUIDITY], MIGRATE_ADDRESS)

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
      name: 'SushiSwap LP Token',
      version: '1',
      chainId: chainId,
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
      spender: MIGRATE_ADDRESS,
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
      .then(signature => {
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadline.toNumber()
        })
      })
      .catch(error => {
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

  // tx sending
  const {
    parsedAmounts: parsedAmountsMaxA,
    liquidityMinted: liquidityMintedMaxA,
    poolTokenPercentage: poolTokenPercentageMaxA
  } = useDerivedMintInfoMigration(
    currencyA ?? undefined,
    currencyB ?? undefined,
    unAmplifiedPairAddress,
    FieldMint.CURRENCY_A,
    formattedAmounts[Field.CURRENCY_A]
  )

  const {
    parsedAmounts: parsedAmountsMaxB,
    liquidityMinted: liquidityMintedMaxB,
    poolTokenPercentage: poolTokenPercentageMaxB
  } = useDerivedMintInfoMigration(
    currencyA ?? undefined,
    currencyB ?? undefined,
    unAmplifiedPairAddress,
    FieldMint.CURRENCY_B,
    formattedAmounts[Field.CURRENCY_B]
  )
  const liquidityMinted =
    !liquidityMintedMaxA || !liquidityMintedMaxB
      ? undefined
      : liquidityMintedMaxA.lessThan(liquidityMintedMaxB)
      ? liquidityMintedMaxA
      : liquidityMintedMaxB

  let amountsMin
  let currencyAmountAToAddPool: CurrencyAmount | undefined
  let currencyAmountBToAddPool: CurrencyAmount | undefined
  let estimatedRefund = ''
  let poolShare = ''
  const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
  if (!!unAmplifiedPairAddress && !isZero(unAmplifiedPairAddress)) {
    amountsMin =
      !currencyAmountA || !currencyAmountB
        ? {
            [Field.CURRENCY_A]: undefined,
            [Field.CURRENCY_B]: undefined
          }
        : {
            [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
            [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0]
          }
    const {
      [FieldMint.CURRENCY_A]: currencyAmountAOfMaxA,
      [FieldMint.CURRENCY_B]: currencyAmountBOfMaxA
    } = parsedAmountsMaxA
    const {
      [FieldMint.CURRENCY_A]: currencyAmountAOfMaxB,
      [FieldMint.CURRENCY_B]: currencyAmountBOfMaxB
    } = parsedAmountsMaxB

    if (
      !currencyAmountBOfMaxA ||
      !currencyAmountB ||
      !currencyAmountAOfMaxB ||
      !currencyAmountA ||
      !poolTokenPercentageMaxA ||
      !poolTokenPercentageMaxB
    ) {
      currencyAmountAToAddPool = undefined
      currencyAmountBToAddPool = undefined
      estimatedRefund = ''
      poolShare = ''
    } else {
      const temp =
        +currencyAmountBOfMaxA.toSignificant(6) <= +currencyAmountB.toSignificant(6)
          ? parsedAmountsMaxA
          : parsedAmountsMaxB
      currencyAmountAToAddPool = temp[FieldMint.CURRENCY_A]
      currencyAmountBToAddPool = temp[FieldMint.CURRENCY_B]
      estimatedRefund =
        +currencyAmountBOfMaxA.toSignificant(6) <= +currencyAmountB.toSignificant(6)
          ? `${currencyAmountB
              .subtract(tokenAmountDmmToSushi(currencyAmountBOfMaxA as TokenAmount))
              .toSignificant(6)} ${tokenB?.symbol}`
          : `${currencyAmountA
              .subtract(tokenAmountDmmToSushi(currencyAmountAOfMaxB as TokenAmount))
              .toSignificant(6)} ${tokenA?.symbol}`
      poolShare =
        +currencyAmountBOfMaxA.toSignificant(6) <= +currencyAmountB.toSignificant(6)
          ? `${poolTokenPercentageMaxA?.toSignificant(2)}%`
          : `${poolTokenPercentageMaxB?.toSignificant(2)}%`
    }

    // const temp =
    //   !currencyAmountBOfMaxA || !currencyAmountB
    //     ? { [FieldMint.CURRENCY_A]: undefined, [FieldMint.CURRENCY_B]: undefined }
    //     : +currencyAmountBOfMaxA.toSignificant(6) <= +currencyAmountB.toSignificant(6)
    //     ? parsedAmountsMaxA
    //     : parsedAmountsMaxB
    // currencyAmountAToAddPool = temp[FieldMint.CURRENCY_A]
    // currencyAmountBToAddPool = temp[FieldMint.CURRENCY_B]
    // //vt

    // estimatedRefund =
    //   !currencyAmountBOfMaxA || !currencyAmountB || !currencyAmountAOfMaxB || !currencyAmountA
    //     ? ''
    //     : +currencyAmountBOfMaxA.toSignificant(6) <= +currencyAmountB.toSignificant(6)
    //     ? `${currencyAmountB.subtract(currencyAmountBOfMaxA).toSignificant(6)} ${tokenB?.symbol}`
    //     : `${currencyAmountA.subtract(currencyAmountAOfMaxB).toSignificant(6)} ${tokenB?.symbol}`
  } else {
    currencyAmountAToAddPool = currencyAmountA
    currencyAmountBToAddPool = currencyAmountB
    poolShare = '100%'
  }

  const addTransaction = useTransactionAdder()
  async function onRemove() {
    if (!chainId || !library || !account || !deadline) throw new Error('missing dependencies')
    const { [Field.CURRENCY_A]: currencyAmountA, [Field.CURRENCY_B]: currencyAmountB } = parsedAmounts
    if (!currencyAmountA || !currencyAmountB) {
      throw new Error('missing currency amounts')
    }

    // const router = getRouterContract(chainId, library, account)
    const migrator = getMigratorContract(chainId, library, account)

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountA, allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountB, allowedSlippage)[0]
    }
    if (!currencyA || !currencyB) throw new Error('missing tokens')
    const liquidityAmount = parsedAmounts[Field.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    const currencyBIsETH = currencyB === ETHER
    const oneCurrencyIsETH = currencyA === ETHER || currencyBIsETH

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<any>
    if (!!unAmplifiedPairAddress && !isZero(unAmplifiedPairAddress)) {
      //co pool amp = 1
      if (!currencyAmountAToAddPool || !currencyAmountBToAddPool) {
        throw new Error('missing currency amounts')
      }
      const amountsMinToAddPool = {
        [Field.CURRENCY_A]: calculateSlippageAmount(currencyAmountAToAddPool, allowedSlippage)[0],
        [Field.CURRENCY_B]: calculateSlippageAmount(currencyAmountBToAddPool, allowedSlippage)[0]
      }

      // we have approval, use normal remove liquidity
      if (approval === ApprovalState.APPROVED) {
        // removeLiquidity
        methodNames = ['migrateLpToDmmPool']
        args = [
          !!pair ? Pair.getAddress(pair?.token0, pair?.token1) : '',
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          amountsMinToAddPool[Field.CURRENCY_A].toString(),
          amountsMinToAddPool[Field.CURRENCY_B].toString(),
          !!unAmplifiedPairAddress && !isZero(unAmplifiedPairAddress)
            ? [unAmplifiedPairAddress, 123]
            : [ZERO_ADDRESS, 10000],
          deadline.toHexString()
        ]
      }
      // we have a signataure, use permit versions of remove liquidity
      else if (signatureData !== null) {
        // removeLiquidityETHWithPermit
        methodNames = ['migrateLpToDmmPoolWithPermit']
        // [uniPair, tokenA, tokenB, liquidity, amountAMin, amountBMin, [pooladdress, amp], deadline, [v,r,s]]
        // use unAmplifiedPairAddress = 0x5708D9442207D0ca4975bB746A158D98df842dCd for testing
        args = [
          !!pair ? Pair.getAddress(pair?.token0, pair?.token1) : '',
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          amountsMinToAddPool[Field.CURRENCY_A].toString(),
          amountsMinToAddPool[Field.CURRENCY_B].toString(),
          !!unAmplifiedPairAddress && !isZero(unAmplifiedPairAddress)
            ? [unAmplifiedPairAddress, 123]
            : [ZERO_ADDRESS, 10000],
          signatureData.deadline,
          [false, signatureData.v, signatureData.r, signatureData.s]
        ]
      } else {
        throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
      }
    } else {
      // we have approval, use normal remove liquidity
      if (approval === ApprovalState.APPROVED) {
        // removeLiquidity
        methodNames = ['migrateLpToDmmPool']
        args = [
          !!pair ? Pair.getAddress(pair?.token0, pair?.token1) : '',
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          !!unAmplifiedPairAddress && !isZero(unAmplifiedPairAddress)
            ? [unAmplifiedPairAddress, 123]
            : [ZERO_ADDRESS, 10000],
          deadline.toHexString()
        ]
      }
      // we have a signataure, use permit versions of remove liquidity
      else if (signatureData !== null) {
        // removeLiquidityETHWithPermit
        methodNames = ['migrateLpToDmmPoolWithPermit']
        // [uniPair, tokenA, tokenB, liquidity, amountAMin, amountBMin, [pooladdress, amp], deadline, [v,r,s]]
        // use unAmplifiedPairAddress = 0x5708D9442207D0ca4975bB746A158D98df842dCd for testing
        args = [
          !!pair ? Pair.getAddress(pair?.token0, pair?.token1) : '',
          tokenA.address,
          tokenB.address,
          liquidityAmount.raw.toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          amountsMin[Field.CURRENCY_A].toString(),
          amountsMin[Field.CURRENCY_B].toString(),
          !!unAmplifiedPairAddress && !isZero(unAmplifiedPairAddress)
            ? [unAmplifiedPairAddress, 123]
            : [ZERO_ADDRESS, 10000],
          signatureData.deadline,
          [false, signatureData.v, signatureData.r, signatureData.s]
        ]
      } else {
        throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
      }
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map(methodName =>
        migrator.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch(error => {
            console.error(`estimateGas failed`, methodName, args, error)
            return undefined
          })
      )
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex(safeGasEstimate =>
      BigNumber.isBigNumber(safeGasEstimate)
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await migrator[methodName](...args, {
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
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(error)
        })
    }
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

  function uniInfo() {
    return (
      <LightCard>
        <AutoColumn gap="10px">
          <RowFixed>
            <img src={require('../../assets/svg/sushiswap-icon.svg')} alt="sushiswap-icon" />
            <Text fontSize={14} fontWeight={500}>
              &nbsp; Sushi Pool
            </Text>
          </RowFixed>
        </AutoColumn>
        <AutoColumn gap="10px">
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              {formattedAmounts[Field.CURRENCY_A] || '-'}
            </Text>
            <RowFixed>
              <CurrencyLogo currency={currencyA} style={{ marginRight: '12px' }} />
              <Text fontSize={14} fontWeight={500} id="remove-liquidity-tokena-symbol">
                {currencyA?.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              {formattedAmounts[Field.CURRENCY_B] || '-'}
            </Text>
            <RowFixed>
              <CurrencyLogo currency={currencyB} style={{ marginRight: '12px' }} />
              <Text fontSize={14} fontWeight={500} id="remove-liquidity-tokenb-symbol">
                {currencyB?.symbol}
              </Text>
            </RowFixed>
          </RowBetween>
        </AutoColumn>
      </LightCard>
    )
  }

  function dmmInfo() {
    return (
      <LightCard>
        <AutoColumn gap="10px">
          <RowFixed>
            <img
              src={require('../../assets/svg/logo.svg')}
              alt="uniswap-icon"
              style={{ width: '30px', marginBottom: '3px' }}
            />
            <Text fontSize={14} fontWeight={500}>
              &nbsp; Pool
            </Text>
          </RowFixed>
        </AutoColumn>

        <AutoColumn gap="10px" style={{ marginTop: '10px', marginBottom: '10px' }}>
          <RowBetween>
            <RowFixed>
              <CurrencyLogo currency={currencyA} />
              <CurrencyLogo currency={currencyB} style={{ marginRight: '12px' }} />
              <Text fontSize={14} fontWeight={500}>
                DMM LP {currencyA?.symbol}-{currencyB?.symbol}
              </Text>
            </RowFixed>
            <Text fontSize={14} fontWeight={500}>
              {liquidityMinted?.toSignificant(4)}
            </Text>
          </RowBetween>
        </AutoColumn>
        <AutoColumn gap="10px">
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              Poole share
            </Text>
            <Text fontSize={14} fontWeight={500}>
              {poolShare}
            </Text>
          </RowBetween>
        </AutoColumn>
        <AutoColumn gap="10px">
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              Pooled {currencyA?.symbol}
            </Text>
            <Text fontSize={14} fontWeight={500}>
              {currencyAmountAToAddPool?.toSignificant(6)}
            </Text>
          </RowBetween>
        </AutoColumn>
        <AutoColumn gap="10px">
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              Pooled {currencyB?.symbol}
            </Text>
            <Text fontSize={14} fontWeight={500}>
              {currencyAmountBToAddPool?.toSignificant(6)}
            </Text>
          </RowBetween>
        </AutoColumn>
        <AutoColumn gap="10px">
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              AMP
            </Text>
            <Text fontSize={14} fontWeight={500}>
              1
            </Text>
          </RowBetween>
        </AutoColumn>
        {!!unAmplifiedPairAddress && !isZero(unAmplifiedPairAddress) && (
          <>
            <AutoColumn gap="10px">
              <RowBetween>
                <Text fontSize={14} fontWeight={500}>
                  Pool Address
                </Text>
                <RowFixed>
                  <Text fontSize={14} fontWeight={500}>
                    {shortenAddress(unAmplifiedPairAddress, 5)}
                  </Text>
                </RowFixed>
              </RowBetween>
            </AutoColumn>
            <DashedLine style={{ marginTop: '20px' }} />
            <AutoColumn gap="10px" style={{ marginTop: '20px' }}>
              <RowBetween>
                <Text fontSize={14} fontWeight={500}>
                  Estimated Refund
                </Text>
                <Text fontSize={14} fontWeight={500}>
                  {estimatedRefund}
                </Text>
              </RowBetween>
            </AutoColumn>
          </>
        )}
      </LightCard>
    )
  }

  function modalHeader() {
    return <div style={{ marginTop: '20px' }}>{dmmInfo()}</div>
    // <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
    //   <RowBetween align="flex-end">
    //     <Text fontSize={24} fontWeight={500}>
    //       {parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)}
    //     </Text>
    //     <RowFixed gap="4px">
    //       <CurrencyLogo currency={currencyA} size={'24px'} />
    //       <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
    //         {currencyA?.symbol}
    //       </Text>
    //     </RowFixed>
    //   </RowBetween>
    //   <RowFixed>
    //     <Plus size="16" color={theme.text2} />
    //   </RowFixed>
    //   <RowBetween align="flex-end">
    //     <Text fontSize={24} fontWeight={500}>
    //       {parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)}
    //     </Text>
    //     <RowFixed gap="4px">
    //       <CurrencyLogo currency={currencyB} size={'24px'} />
    //       <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
    //         {currencyB?.symbol}
    //       </Text>
    //     </RowFixed>
    //   </RowBetween>

    //   <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'12px 0 0 0'}>
    //     {`Output is estimated. If the price changes by more than ${allowedSlippage /
    //       100}% your transaction will revert.`}
    //   </TYPE.italic>
    // </AutoColumn>
  }

  function modalBottom() {
    return (
      <>
        {/* <RowBetween>
          <Text color={theme.text2} fontWeight={500} fontSize={16}>
            {currencyA?.symbol + '/' + currencyB?.symbol} Burned
          </Text>
          <RowFixed>
            <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
            <Text fontWeight={500} fontSize={16}>
              {parsedAmounts[Field.LIQUIDITY]?.toSignificant(6)}
            </Text>
          </RowFixed>
        </RowBetween>
        {pair && (
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
          <Text fontWeight={500} fontSize={20}>
            Confirm
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  return (
    <>
      {chainId && oneCurrencyIsETH ? (
        <Redirect
          to={`/migrateSushi/${currencyA === ETHER ? WETH[chainId].address : currencyIdA}/${
            currencyB === ETHER ? WETH[chainId].address : currencyIdB
          }`}
        />
      ) : (
        <>
          <AppBody>
            <MigrateTab />
            <Wrapper>
              <TransactionConfirmationModal
                isOpen={showConfirm}
                onDismiss={handleDismissConfirmation}
                attemptingTxn={attemptingTxn}
                hash={txHash ? txHash : ''}
                content={() => (
                  <ConfirmationModalContent
                    title={'You will receive'}
                    onDismiss={handleDismissConfirmation}
                    topContent={modalHeader}
                    bottomContent={modalBottom}
                  />
                )}
                pendingText={pendingText}
              />
              <AutoColumn gap="md">
                <LightCard>
                  <AutoColumn gap="20px">
                    <Row style={{ alignItems: 'flex-end' }}>
                      <Text fontSize={72} fontWeight={500}>
                        {formattedAmounts[Field.LIQUIDITY_PERCENT]}%
                      </Text>
                    </Row>
                    <>
                      <Slider value={innerLiquidityPercentage} onChange={setInnerLiquidityPercentage} />
                      <RowBetween>
                        <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')} width="20%">
                          25%
                        </MaxButton>
                        <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')} width="20%">
                          50%
                        </MaxButton>
                        <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')} width="20%">
                          75%
                        </MaxButton>
                        <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')} width="20%">
                          Max
                        </MaxButton>
                      </RowBetween>
                    </>
                  </AutoColumn>
                </LightCard>
                <>
                  <ColumnCenter>
                    <ArrowDown size="16" color={theme.text2} />
                  </ColumnCenter>
                  {uniInfo()}
                  <ColumnCenter>
                    <ArrowDown size="16" color={theme.text2} />
                  </ColumnCenter>
                  {dmmInfo()}
                  {!unAmplifiedPairAddress ||
                    (isZero(unAmplifiedPairAddress) && (
                      <YellowCard>
                        <RowFixed>
                          <img
                            src={require('../../assets/svg/warning-icon.svg')}
                            alt="warning-icon"
                            style={{ marginRight: '20px' }}
                          />
                          <Text fontSize={14} fontWeight={500}>
                            There is no existing pool for this token pair. You will be creating a new pool with AMP=1
                            and migrating tokens from Sushiswap to DMM.{' '}
                          </Text>
                        </RowFixed>
                      </YellowCard>
                    ))}
                </>

                {/* {pair && (
                  <div style={{ padding: '10px 20px' }}>
                    <RowBetween>
                      Price:
                      <div>
                        1 {currencyA?.symbol} = {tokenA ? pair.priceOf(tokenA).toSignificant(6) : '-'}{' '}
                        {currencyB?.symbol}
                      </div>
                    </RowBetween>
                    <RowBetween>
                      <div />
                      <div>
                        1 {currencyB?.symbol} = {tokenB ? pair.priceOf(tokenB).toSignificant(6) : '-'}{' '}
                        {currencyA?.symbol}
                      </div>
                    </RowBetween>
                  </div>
                )} */}
                <div style={{ position: 'relative' }}>
                  {!account ? (
                    <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
                  ) : (
                    <RowBetween>
                      <ButtonConfirmed
                        onClick={onAttemptToApprove}
                        confirmed={approval === ApprovalState.APPROVED || signatureData !== null}
                        disabled={approval !== ApprovalState.NOT_APPROVED || signatureData !== null}
                        mr="0.5rem"
                        fontWeight={500}
                        fontSize={16}
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
                        onClick={() => {
                          setShowConfirm(true)
                        }}
                        disabled={!isValid || (signatureData === null && approval !== ApprovalState.APPROVED)}
                        error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                      >
                        <Text fontSize={16} fontWeight={500}>
                          {error || 'Migrate'}
                        </Text>
                      </ButtonError>
                    </RowBetween>
                  )}
                </div>
              </AutoColumn>
            </Wrapper>
          </AppBody>

          {/* {pair ? (
          <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
            <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
          </AutoColumn>
        ) : null} */}
        </>
      )}
    </>
  )
}

// import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
// export default function AAA() {
//   return <></>
// }
