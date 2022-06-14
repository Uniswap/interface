import { TransactionResponse } from '@ethersproject/providers'
import { t, Trans } from '@lingui/macro'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { RowBetween } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES, FARM_CONTRACTS, VERSION } from 'constants/v2'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { useProAmmDerivedPositionInfo } from 'hooks/useProAmmDerivedPositionInfo'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import React, { useCallback, useEffect, useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/mint/proamm/actions'
import { useProAmmDerivedMintInfo, useProAmmMintActionHandlers, useProAmmMintState } from 'state/mint/proamm/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useIsExpertMode } from 'state/user/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { Flex, Text } from 'rebass'
import { Container, GridColumn, FirstColumn } from './styled'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import useProAmmPreviousTicks from 'hooks/useProAmmPreviousTicks'
import { calculateGasMargin, formattedNum, shortenAddress, isAddressString } from 'utils'
import JSBI from 'jsbi'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import { BigNumber } from 'ethers'
import Divider from 'components/Divider'
import Loader from 'components/Loader'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { SecondColumn } from './styled'
import ProAmmPriceRange from 'components/ProAmm/ProAmmPriceRange'
import { StyledInternalLink } from 'theme/components'
import { nativeOnChain } from 'constants/tokens'
import usePrevious from 'hooks/usePrevious'
import { useSingleCallResult } from 'state/multicall/hooks'
import useTheme from 'hooks/useTheme'
import Copy from 'components/Copy'
export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
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
  const ownByFarm = Object.values(FARM_CONTRACTS)
    .flat()
    .includes(isAddressString(owner))

  const { position: existingPosition } = useProAmmDerivedPositionInfo(existingPositionDetails)

  console.log(existingPositionDetails, existingPosition)

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
    chainId ? PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined,
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    chainId ? PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined,
  )

  const allowedSlippage = useUserSlippageTolerance()

  //TODO: on add
  async function onAdd() {
    if (!chainId || !library || !account || !tokenId) return

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
        to: PRO_AMM_NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
        data: calldata,
        value,
      }

      setAttemptingTxn(true)
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
              console.log(response)
              setAttemptingTxn(false)
              addTransactionWithType(response, {
                type: 'Increase liquidity',
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
        .catch(error => {
          console.error('Failed to send transaction', error)
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error)
          }

          // const newTxn = {
          //   ...txn,
          //   gasLimit: '0x0827f6'
          // }
          // return library
          //   .getSigner()
          //   .sendTransaction(newTxn)
          //   .then((response: TransactionResponse) => {
          //     console.log(response)
          //     setAttemptingTxn(false)
          //     addTransactionWithType(response, {
          //       type: 'Add liquidity',
          //       summary:
          //         (parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) || 0) +
          //         ' ' +
          //         baseCurrency?.symbol +
          //         ' and ' +
          //         (parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) || 0) +
          //         ' ' +
          //         quoteCurrency?.symbol +
          //         //  ' with fee ' +  position.pool.fee / 100 + '%' +
          //         ' (ProMM)'
          //     })
          //     setTxHash(response.hash)
          //   })
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

  //disable = !feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)
  // useProAmmClientSideTrade(
  //   0,
  //   position && CurrencyAmount.fromRawAmount(position?.pool.token0, JSBI.BigInt('10000000000000')),
  //   position?.pool.token1,
  // )

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
                  <ProAmmPriceRange position={existingPosition} ticksAtLimit={ticksAtLimit} />
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
        <AddRemoveTabs action={LiquidityAction.INCREASE} showTooltip={false} hideShare />
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
            The owner of this liquidity position is {shortenAddress(owner)}
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
                    showMaxButton
                    currency={currencies[Field.CURRENCY_A] ?? null}
                    id="add-liquidity-input-tokena"
                    showCommonBases
                    positionMax="top"
                    disableCurrencySelect
                    locked={depositADisabled}
                    estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                  />
                  {chainId && (baseCurrencyIsETHER || baseCurrencyIsWETH) && (
                    <div style={!depositADisabled ? { visibility: 'visible' } : { visibility: 'hidden' }}>
                      <StyledInternalLink
                        replace
                        to={`/elastic/increase/${
                          baseCurrencyIsETHER ? WETH[chainId].address : nativeOnChain(chainId).symbol
                        }/${currencyIdB}/${feeAmount}/${tokenId}`}
                        style={{ fontSize: '14px', float: 'right' }}
                      >
                        {baseCurrencyIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    </div>
                  )}
                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_B]}
                    onUserInput={onFieldBInput}
                    onMax={() => {
                      onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                    }}
                    disableCurrencySelect
                    showMaxButton
                    currency={currencies[Field.CURRENCY_B] ?? null}
                    id="add-liquidity-input-tokenb"
                    showCommonBases
                    positionMax="top"
                    locked={depositBDisabled}
                    estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                  />
                  {chainId && (quoteCurrencyIsETHER || quoteCurrencyIsWETH) && (
                    <div style={!depositBDisabled ? { visibility: 'visible' } : { visibility: 'hidden' }}>
                      <StyledInternalLink
                        replace
                        to={`/elastic/increase/${currencyIdA}/${
                          quoteCurrencyIsETHER ? WETH[chainId].address : nativeOnChain(chainId).symbol
                        }/${feeAmount}/${tokenId}`}
                        style={{ fontSize: '14px', float: 'right' }}
                      >
                        {quoteCurrencyIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                      </StyledInternalLink>
                    </div>
                  )}
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

        {/* <DynamicSection disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}>
          <AutoColumn gap="md">
            <Text fontWeight="500">
              <Trans>Add More Liquidity</Trans>
            </Text>

            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              onUserInput={onFieldAInput}
              onMax={() => {
                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
              }}
              showMaxButton
              currency={currencies[Field.CURRENCY_A] ?? null}
              id="add-liquidity-input-tokena"
              showCommonBases
              positionMax="top"
              disableCurrencySelect
              locked={depositADisabled}
            />

            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_B]}
              onUserInput={onFieldBInput}
              onMax={() => {
                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
              }}
              disableCurrencySelect
              showMaxButton
              currency={currencies[Field.CURRENCY_B] ?? null}
              id="add-liquidity-input-tokenb"
              showCommonBases
              positionMax="top"
              locked={depositBDisabled}
            />
          </AutoColumn>
        </DynamicSection>

        <Buttons /> */}
      </Container>
    </>
  )
}
