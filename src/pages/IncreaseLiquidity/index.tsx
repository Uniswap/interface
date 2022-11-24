import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import { useCallback, useEffect, useState } from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Divider from 'components/Divider'
import Loader from 'components/Loader'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmPriceRange from 'components/ProAmm/ProAmmPriceRange'
import { RowBetween } from 'components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { TutorialType } from 'components/Tutorial'
import { Dots } from 'components/swap/styleds'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { VERSION } from 'constants/v2'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import usePrevious from 'hooks/usePrevious'
import { useProAmmDerivedPositionInfo } from 'hooks/useProAmmDerivedPositionInfo'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useProAmmPreviousTicks from 'hooks/useProAmmPreviousTicks'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/mint/proamm/actions'
import { useProAmmDerivedMintInfo, useProAmmMintActionHandlers, useProAmmMintState } from 'state/mint/proamm/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { calculateGasMargin, formattedNum, isAddressString, shortenAddress } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { unwrappedToken } from 'utils/wrappedCurrency'

import { Container, FirstColumn, GridColumn, SecondColumn } from './styled'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const [expertMode] = useExpertModeManager()
  const addTransactionWithType = useTransactionAdder()

  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (!!chainId && !!prevChainId && chainId !== prevChainId) {
      history.push('/myPools')
    }
  }, [chainId, prevChainId, history])

  const positionManager = useProAmmNFTPositionManagerContract()

  // check for existing position if tokenId in url
  const { position: existingPositionDetails } = useProAmmPositionsFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined,
  )

  const owner = useSingleCallResult(!!tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0]
  const ownsNFT = owner === account || existingPositionDetails?.operator === account
  const ownByFarm = isEVM
    ? (networkInfo as EVMNetworkInfo).elastic.farms.flat().includes(isAddressString(chainId, owner))
    : false

  const { position: existingPosition } = useProAmmDerivedPositionInfo(existingPositionDetails)

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined
  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB
  // mint state
  const { independentField, typedValue } = useProAmmMintState()
  const {
    pool,
    // ticks,
    dependentField,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    // invalidPool,
    invalidRange,
    // outOfRange,
    depositADisabled,
    depositBDisabled,
    ticksAtLimit,
  } = useProAmmDerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition,
  )
  const baseCurrencyIsETHER = !!(chainId && baseCurrency && baseCurrency.isNative)
  const baseCurrencyIsWETH = !!(chainId && baseCurrency && baseCurrency.equals(WETH[chainId]))
  const quoteCurrencyIsETHER = !!(chainId && quoteCurrency && quoteCurrency.isNative)
  const quoteCurrencyIsWETH = !!(chainId && quoteCurrency && quoteCurrency.equals(WETH[chainId]))

  const usdPrices = useTokensPrice([baseCurrency?.wrapped, quoteCurrency?.wrapped], VERSION.ELASTIC)

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[0]
      ? parseFloat((parsedAmounts[Field.CURRENCY_A] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[1]
      ? parseFloat((parsedAmounts[Field.CURRENCY_B] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[1]
      : 0

  const previousTicks =
    // : number[] = []
    useProAmmPreviousTicks(pool, position)
  const { onFieldAInput, onFieldBInput } = useProAmmMintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }
  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {},
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_A],
    (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager,
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager,
  )

  const allowedSlippage = useUserSlippageTolerance()

  //TODO: on add
  async function onAdd() {
    if (!isEVM || !library || !account || !tokenId) {
      return
    }

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    if (!previousTicks || previousTicks.length !== 2) {
      return
    }

    if (position && account && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, previousTicks, {
        slippageTolerance: new Percent(allowedSlippage[0], 10000),
        deadline: deadline.toString(),
        useNative,
        tokenId: JSBI.BigInt(tokenId),
      })

      //0.00283161
      const txn: { to: string; data: string; value: string } = {
        to: (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager,
        data: calldata,
        value,
      }

      setAttemptingTxn(true)
      library
        .getSigner()
        .estimateGas(txn)
        .then((estimate: BigNumber) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate),
          }

          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              addTransactionWithType({
                hash: response.hash,
                type: TRANSACTION_TYPE.INCREASE_LIQUIDITY,
                summary:
                  (parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) || 0) +
                  ' ' +
                  baseCurrency?.symbol +
                  ' and ' +
                  (parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) || 0) +
                  ' ' +
                  quoteCurrency?.symbol,
                //  ' with fee ' +  position.pool.fee / 100 + '%' +
                // (tokenId ? ' Token ID: (' + tokenId + ')' : ''),
                arbitrary: {
                  token_1: baseCurrency?.symbol,
                  token_2: quoteCurrency?.symbol,
                },
              })
              setTxHash(response.hash)
            })
        })
        .catch((error: any) => {
          console.error('Failed to send transaction', error)
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error)
          }
        })
    } else {
      return
    }
  }

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      history.push('/myPools')
    }
    setTxHash('')
  }, [history, onFieldAInput, txHash])

  const addIsUnsupported = false

  // get value and prices at ticks
  // const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA = approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB = approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!depositADisabled && !depositBDisabled ? 'and' : ''} ${
    !depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''
  } ${!depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''}`

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled={true}>
        <Trans>Unsupported Asset</Trans>
      </ButtonPrimary>
    ) : !account ? (
      <ButtonLight onClick={toggleWalletModal}>
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    ) : (
      <Flex sx={{ gap: '16px' }} flexDirection={isValid && showApprovalA && showApprovalB ? 'column' : 'row'}>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <RowBetween>
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={showApprovalB ? '48%' : '100%'}
                >
                  {approvalA === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
              {showApprovalB && (
                <ButtonPrimary
                  onClick={approveBCallback}
                  disabled={approvalB === ApprovalState.PENDING}
                  width={showApprovalA ? '48%' : '100%'}
                >
                  {approvalB === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
            </RowBetween>
          )}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={
            !isValid ||
            (approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (approvalB !== ApprovalState.APPROVED && !depositBDisabled)
          }
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B] && false}
        >
          <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
        </ButtonError>
      </Flex>
    )

  if (!isEVM) return <Redirect to="/" />
  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <ConfirmationModalContent
            title={t`Increase Liquidity`}
            onDismiss={handleDismissConfirmation}
            topContent={() =>
              existingPosition && (
                <div style={{ marginTop: '1rem' }}>
                  {/* <PositionPreview
                    position={position}
                    title={<Trans>Selected Range</Trans>}
                    inRange={!outOfRange}
                    ticksAtLimit={ticksAtLimit}
                  /> */}
                  <ProAmmPoolInfo position={existingPosition} />
                  <ProAmmPooledTokens
                    liquidityValue0={parsedAmounts[Field.CURRENCY_A]}
                    liquidityValue1={parsedAmounts[Field.CURRENCY_B]}
                    title={t`Increase Amount`}
                  />
                  <ProAmmPriceRange position={existingPosition} ticksAtLimit={ticksAtLimit} hideChart />
                </div>
              )
            }
            bottomContent={() => (
              <ButtonPrimary onClick={onAdd}>
                <Text fontWeight={500}>
                  <Trans>Supply</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
        pendingText={pendingText}
      />
      <Container>
        <AddRemoveTabs
          action={LiquidityAction.INCREASE}
          showTooltip={false}
          hideShare
          tutorialType={TutorialType.ELASTIC_INCREASE_LIQUIDITY}
        />
        {owner && account && !ownsNFT && !ownByFarm ? (
          <Text
            fontSize="12px"
            fontWeight="500"
            paddingTop={'10px'}
            paddingBottom={'10px'}
            backgroundColor={theme.bg3Opacity4}
            color={theme.subText}
            style={{ borderRadius: '4px', marginBottom: '1.25rem' }}
          >
            The owner of this liquidity position is {shortenAddress(chainId, owner)}
            <span style={{ display: 'inline-block' }}>
              <Copy toCopy={owner}></Copy>
            </span>
          </Text>
        ) : (
          <Divider style={{ marginBottom: '1.25rem' }} />
        )}

        {existingPosition ? (
          <AutoColumn gap="md" style={{ textAlign: 'left' }}>
            <ProAmmPoolInfo position={existingPosition} tokenId={tokenId} />
            <GridColumn>
              <FirstColumn>
                <ProAmmPooledTokens
                  pooled
                  liquidityValue0={CurrencyAmount.fromRawAmount(
                    unwrappedToken(existingPosition.pool.token0),
                    existingPosition.amount0.quotient,
                  )}
                  liquidityValue1={CurrencyAmount.fromRawAmount(
                    unwrappedToken(existingPosition.pool.token1),
                    existingPosition.amount1.quotient,
                  )}
                />

                <AutoColumn gap="md">
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onFieldAInput}
                    onMax={() => {
                      onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                    }}
                    onHalf={() => {
                      onFieldAInput(currencyBalances[Field.CURRENCY_A]?.divide(2)?.toExact() ?? '')
                    }}
                    currency={currencies[Field.CURRENCY_A] ?? null}
                    id="add-liquidity-input-tokena"
                    showCommonBases
                    positionMax="top"
                    locked={depositADisabled}
                    estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                    disableCurrencySelect={!baseCurrencyIsETHER && !baseCurrencyIsWETH}
                    isSwitchMode={baseCurrencyIsETHER || baseCurrencyIsWETH}
                    onSwitchCurrency={() => {
                      chainId &&
                        history.replace(
                          `/elastic/increase/${
                            baseCurrencyIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                          }/${currencyIdB}/${feeAmount}/${tokenId}`,
                        )
                    }}
                  />
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_B]}
                    onUserInput={onFieldBInput}
                    onMax={() => {
                      onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                    }}
                    onHalf={() => {
                      onFieldBInput(currencyBalances[Field.CURRENCY_B]?.divide(2).toExact() ?? '')
                    }}
                    currency={currencies[Field.CURRENCY_B] ?? null}
                    id="add-liquidity-input-tokenb"
                    showCommonBases
                    positionMax="top"
                    locked={depositBDisabled}
                    estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                    disableCurrencySelect={!quoteCurrencyIsETHER && !quoteCurrencyIsWETH}
                    isSwitchMode={quoteCurrencyIsETHER || quoteCurrencyIsWETH}
                    onSwitchCurrency={() => {
                      chainId &&
                        history.replace(
                          `/elastic/increase/${currencyIdA}/${
                            quoteCurrencyIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                          }/${feeAmount}/${tokenId}`,
                        )
                    }}
                  />
                </AutoColumn>
                {/* <PositionPreview
                  position={existingPosition}
                  title={<Trans>Selected Range</Trans>}
                  inRange={!outOfRange}
                  ticksAtLimit={ticksAtLimit}
                /> */}
              </FirstColumn>
              <SecondColumn>
                <ProAmmPriceRange position={existingPosition} ticksAtLimit={ticksAtLimit} />
                <Buttons />
              </SecondColumn>
            </GridColumn>
          </AutoColumn>
        ) : (
          // <PositionPreview
          //   position={existingPosition}
          //   title={<Trans>Selected Range</Trans>}
          //   inRange={!outOfRange}
          //   ticksAtLimit={ticksAtLimit}
          // />
          <Loader />
        )}
      </Container>
    </>
  )
}
