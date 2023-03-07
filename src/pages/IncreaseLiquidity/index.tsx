import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMedia, usePrevious } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { BlackCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import Dots from 'components/Dots'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Loader from 'components/Loader'
import { StyledMenuButton } from 'components/NavigationTabs'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmPriceRangeConfirm from 'components/ProAmm/ProAmmPriceRangeConfirm'
import Rating from 'components/Rating'
import { RowBetween } from 'components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import TransactionSettings from 'components/TransactionSettings'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { APP_PATHS } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { useProAmmDerivedPositionInfo } from 'hooks/useProAmmDerivedPositionInfo'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useProAmmPreviousTicks from 'hooks/useProAmmPreviousTicks'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import {
  Container,
  Content,
  FirstColumn,
  GridColumn,
  SecondColumn,
  TokenId,
  TokenInputWrapper,
} from 'pages/RemoveLiquidityProAmm/styled'
import { useWalletModalToggle } from 'state/application/hooks'
import { useProAmmDerivedMintInfo, useProAmmMintActionHandlers, useProAmmMintState } from 'state/mint/proamm/hooks'
import { Field } from 'state/mint/proamm/type'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { calculateGasMargin, formattedNum, formattedNumLong, isAddressString, shortenAddress } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { unwrappedToken } from 'utils/wrappedCurrency'

import Chart from './Chart'

export default function AddLiquidity() {
  const { currencyIdB, currencyIdA, feeAmount: feeAmountFromUrl, tokenId } = useParams()
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()
  const navigate = useNavigate()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const [expertMode] = useExpertModeManager()
  const addTransactionWithType = useTransactionAdder()

  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (!!chainId && !!prevChainId && chainId !== prevChainId) {
      navigate(APP_PATHS.MY_POOLS)
    }
  }, [chainId, prevChainId, navigate])

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

  const removed = existingPositionDetails?.liquidity?.eq(0)

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
  const { positions } = useProAmmMintState()
  const { independentField, typedValue } = positions[0]
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
    outOfRange,
    depositADisabled,
    depositBDisabled,
    ticksAtLimit,
    riskPoint,
    profitPoint,
  } = useProAmmDerivedMintInfo(
    0,
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

  const address0 = baseCurrency?.wrapped.address || ''
  const address1 = quoteCurrency?.wrapped.address || ''
  const usdPrices = useTokenPrices([address0, address1])

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[address0]
      ? parseFloat(parsedAmounts[Field.CURRENCY_A]?.toExact() || '0') * usdPrices[address0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[address1]
      ? parseFloat(parsedAmounts[Field.CURRENCY_B]?.toExact() || '0') * usdPrices[address1]
      : 0
  const pooledAmount0 =
    existingPosition &&
    CurrencyAmount.fromRawAmount(unwrappedToken(existingPosition.pool.token0), existingPosition.amount0.quotient)
  const pooledAmount1 =
    existingPosition &&
    CurrencyAmount.fromRawAmount(unwrappedToken(existingPosition.pool.token1), existingPosition.amount1.quotient)

  const totalPooledUSD =
    parseFloat(pooledAmount0?.toExact() || '0') * usdPrices[pooledAmount0?.currency?.wrapped.address || ''] +
    parseFloat(pooledAmount1?.toExact() || '0') * usdPrices[pooledAmount1?.currency?.wrapped.address || '']

  const previousTicks =
    // : number[] = []
    useProAmmPreviousTicks(pool, position)
  const { onFieldAInput, onFieldBInput, onResetMintState } = useProAmmMintActionHandlers(noLiquidity, 0)

  useEffect(() => {
    onResetMintState()
  }, [onResetMintState])

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
              const tokenAmountIn = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) || '0'
              const tokenAmountOut = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) || '0'
              const tokenSymbolIn = baseCurrency?.symbol ?? ''
              const tokenSymbolOut = quoteCurrency?.symbol ?? ''
              addTransactionWithType({
                hash: response.hash,
                type: TRANSACTION_TYPE.ELASTIC_INCREASE_LIQUIDITY,
                extraInfo: {
                  tokenAmountIn,
                  tokenAmountOut,
                  tokenAddressIn: baseCurrency.wrapped.address,
                  tokenAddressOut: quoteCurrency.wrapped.address,
                  tokenSymbolIn,
                  tokenSymbolOut,
                  arbitrary: {
                    token_1: tokenSymbolIn,
                    token_2: tokenSymbolOut,
                  },
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
      navigate('/myPools')
    }
    setTxHash('')
  }, [navigate, onFieldAInput, txHash])

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
      <>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <Flex sx={{ gap: '16px' }} flexDirection={isValid && showApprovalA && showApprovalB ? 'column' : 'row'}>
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
            </Flex>
          )}
        <ButtonError
          style={{ width: upToMedium ? '100%' : 'fit-content', minWidth: '164px' }}
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
      </>
    )

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  if (!isEVM) return <Navigate to="/" />
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
                  <ProAmmPoolInfo position={existingPosition} tokenId={tokenId} />
                  <ProAmmPooledTokens
                    liquidityValue0={parsedAmounts[Field.CURRENCY_A]}
                    liquidityValue1={parsedAmounts[Field.CURRENCY_B]}
                    title={t`Increase Amount`}
                  />
                  <ProAmmPriceRangeConfirm position={existingPosition} ticksAtLimit={ticksAtLimit} />
                </div>
              )
            }
            bottomContent={() => (
              <ButtonPrimary id="btnSupply" onClick={onAdd}>
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
        <Flex justifyContent="space-between" alignItems="center" marginTop="32px" marginBottom="24px">
          <Flex
            role="button"
            onClick={() => navigate(-1)}
            alignItems="center"
            sx={{ cursor: 'pointer', ':hover': { opacity: '0.8' } }}
          >
            <ChevronLeft size={28} color={theme.subText} />
            <Text fontSize="24px" fontWeight="500" marginLeft="8px">
              <Trans>Increase Liquidity</Trans>
            </Text>
          </Flex>

          <Flex>
            {owner && account && !ownsNFT && !ownByFarm && (
              <Text
                fontSize="12px"
                fontWeight="500"
                color={theme.subText}
                display="flex"
                alignItems="center"
                marginRight="8px"
              >
                <Trans>The owner of this liquidity position is {shortenAddress(chainId, owner)}</Trans>
                <Copy toCopy={owner}></Copy>
              </Text>
            )}

            <Tutorial
              type={TutorialType.ELASTIC_INCREASE_LIQUIDITY}
              customIcon={
                <StyledMenuButton>
                  <TutorialIcon />
                </StyledMenuButton>
              }
            />
            <TransactionSettings hoverBg={theme.buttonBlack} />
          </Flex>
        </Flex>

        <Content>
          {existingPosition ? (
            <AutoColumn gap="md" style={{ textAlign: 'left' }}>
              <GridColumn>
                <FirstColumn style={{ height: 'calc(100% - 56px)' }}>
                  <ProAmmPoolInfo position={existingPosition} tokenId={tokenId} showRangeInfo={false} />

                  <BlackCard style={{ borderRadius: '1rem', padding: '1rem' }}>
                    <Flex alignItems="center" sx={{ gap: '4px' }}>
                      <TokenId color={removed ? theme.red : outOfRange ? theme.warning : theme.primary}>
                        #{tokenId?.toString()}
                      </TokenId>
                      <RangeBadge removed={removed} inRange={!outOfRange} hideText size={14} />
                    </Flex>

                    <Flex
                      justifyContent="space-between"
                      fontSize="12px"
                      fontWeight="500"
                      marginTop="1rem"
                      marginBottom="0.75rem"
                    >
                      <Text>
                        <Trans>My Liquidity</Trans>
                      </Text>
                      <Text>{formattedNumLong(totalPooledUSD, true)}</Text>
                    </Flex>

                    <Divider />

                    <Flex justifyContent="space-between" fontSize="12px" marginTop="0.75rem">
                      <Text color={theme.subText}>Pooled {existingPosition.pool.token0.symbol}</Text>
                      <Flex alignItems="center">
                        <CurrencyLogo currency={existingPosition.pool.token0} size="16px" />
                        <Text fontWeight="500" marginLeft="4px">
                          <FormattedCurrencyAmount
                            currencyAmount={CurrencyAmount.fromRawAmount(
                              unwrappedToken(existingPosition.pool.token0),
                              existingPosition.amount0.quotient,
                            )}
                          />{' '}
                          {existingPosition.pool.token0.symbol}
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex justifyContent="space-between" fontSize="12px" marginTop="0.75rem">
                      <Text color={theme.subText}>Pooled {existingPosition.pool.token1.symbol}</Text>
                      <Flex alignItems="center">
                        <CurrencyLogo currency={existingPosition.pool.token1} size="16px" />
                        <Text fontWeight="500" marginLeft="4px">
                          <FormattedCurrencyAmount
                            currencyAmount={CurrencyAmount.fromRawAmount(
                              unwrappedToken(existingPosition.pool.token1),
                              existingPosition.amount1.quotient,
                            )}
                          />{' '}
                          {existingPosition.pool.token1.symbol}
                        </Text>
                      </Flex>
                    </Flex>
                  </BlackCard>
                </FirstColumn>

                <SecondColumn>
                  <BlackCard style={{ marginBottom: '1rem' }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridGap: upToMedium ? '12px' : '24px',
                        gridTemplateColumns: `repeat(${upToMedium ? 1 : 2} , fit-content(100%) fit-content(100%))`,
                      }}
                    >
                      <Text fontSize={12} color={theme.red}>
                        <Trans>Estimated Risk</Trans>
                      </Text>
                      <Rating point={riskPoint} color={theme.red} />
                      <Text fontSize={12} color={theme.primary}>
                        <Trans>Estimated Profit</Trans>
                      </Text>
                      <Rating point={profitPoint} color={theme.primary} />
                    </Box>
                    <Flex marginTop="1rem" />
                    <Chart position={existingPosition} ticksAtLimit={ticksAtLimit} />

                    <TokenInputWrapper>
                      <div
                        style={{
                          flex: 1,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '1rem',
                        }}
                      >
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
                              navigate(
                                `/elastic/increase/${
                                  baseCurrencyIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                                }/${currencyIdB}/${feeAmount}/${tokenId}`,
                                {
                                  replace: true,
                                },
                              )
                          }}
                        />
                      </div>

                      <div
                        style={{
                          flex: 1,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '1rem',
                          overflow: 'hidden',
                        }}
                      >
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
                              navigate(
                                `/elastic/increase/${currencyIdA}/${
                                  quoteCurrencyIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                                }/${feeAmount}/${tokenId}`,
                                { replace: true },
                              )
                          }}
                        />
                      </div>
                    </TokenInputWrapper>
                  </BlackCard>

                  <Flex justifyContent="flex-end">
                    <Buttons />
                  </Flex>
                </SecondColumn>
              </GridColumn>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Content>
      </Container>
    </>
  )
}
