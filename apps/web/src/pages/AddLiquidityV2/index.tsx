import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import {
  InterfaceElementName,
  InterfaceEventName,
  LiquidityEventName,
  LiquiditySource,
} from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Percent, V2_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { computePairAddress } from '@uniswap/v2-sdk'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { BlueCard, LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { DoubleCurrencyLogo } from 'components/DoubleLogo'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import Row, { AutoRow, RowBetween, RowFlat } from 'components/Row'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { V2Unsupported } from 'components/V2Unsupported'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { ZERO_PERCENT } from 'constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useV2RouterContract } from 'hooks/useContract'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import { useGetTransactionDeadline } from 'hooks/useTransactionDeadline'
import { PairState } from 'hooks/useV2Pairs'
import { Trans } from 'i18n'
import styled, { useTheme } from 'lib/styled-components'
import { ConfirmAddModalBottom } from 'pages/AddLiquidityV2/ConfirmAddModalBottom'
import { PoolPriceBar } from 'pages/AddLiquidityV2/PoolPriceBar'
import AppBody from 'pages/App/AppBody'
import { Dots, Wrapper } from 'pages/Pool/styled'
import { useCallback, useState } from 'react'
import { Plus } from 'react-feather'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Field } from 'state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from 'state/mint/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionInfo, TransactionType } from 'state/transactions/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { Text } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { calculateSlippageAmount } from 'utils/calculateSlippageAmount'
import { currencyId } from 'utils/currencyId'
import { maxAmountSpend } from 'utils/maxAmountSpend'

const DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

const AddLiquidityHeaderContainer = styled(AutoColumn)`
  gap: 20px;
  margin-bottom: 16px;
`

export default function AddLiquidity() {
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA?: string; currencyIdB?: string }>()
  const navigate = useNavigate()
  const account = useAccount()
  const signer = useEthersSigner()

  const theme = useTheme()
  const trace = useTrace()

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const wrappedNativeCurrency =
    account.status === 'connected' && account.chainId ? WRAPPED_NATIVE_CURRENCY[account.chainId] : undefined

  const oneCurrencyIsWETH = Boolean(
    account.chainId &&
      wrappedNativeCurrency &&
      ((currencyA && currencyA.equals(wrappedNativeCurrency)) ||
        (currencyB && currencyB.equals(wrappedNativeCurrency))),
  )

  const accountDrawer = useAccountDrawer() // toggle wallet when disconnected

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)

  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const getDeadline = useGetTransactionDeadline() // custom from users settings
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE) // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
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

  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {},
  )

  const router = useV2RouterContract()

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], router?.address)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], router?.address)

  const addTransaction = useTransactionAdder()
  const networkSupportsV2 = useNetworkSupportsV2()

  async function onAdd() {
    if (account.status !== 'connected' || !signer || !router || !networkSupportsV2) {
      return
    }

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    const deadline = await getDeadline()

    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? ZERO_PERCENT : allowedSlippage)[0],
    }

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (currencyA.isNative || currencyB.isNative) {
      const tokenBIsETH = currencyB.isNative
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        (tokenBIsETH ? currencyA : currencyB)?.wrapped?.address ?? '', // token
        (tokenBIsETH ? parsedAmountA : parsedAmountB).quotient.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account.address,
        deadline.toHexString(),
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).quotient.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        currencyA?.wrapped?.address ?? '',
        currencyB?.wrapped?.address ?? '',
        parsedAmountA.quotient.toString(),
        parsedAmountB.quotient.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account.address,
        deadline.toHexString(),
      ]
      value = null
    }

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then((estimatedGasLimit) =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        }).then((response) => {
          setAttemptingTxn(false)

          const transactionInfo: TransactionInfo = {
            type: TransactionType.ADD_LIQUIDITY_V2_POOL,
            baseCurrencyId: currencyId(currencyA),
            expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient.toString() ?? '0',
            quoteCurrencyId: currencyId(currencyB),
            expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient.toString() ?? '0',
          }

          addTransaction(response, transactionInfo)

          setTxHash(response.hash)

          sendAnalyticsEvent(LiquidityEventName.ADD_LIQUIDITY_SUBMITTED, {
            label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
            ...trace,
            ...transactionInfo,
            type: LiquiditySource.V2,
            transaction_hash: response.hash,
            pool_address: computePairAddress({
              factoryAddress: V2_FACTORY_ADDRESSES[currencyA.chainId],
              tokenA: currencyA.wrapped,
              tokenB: currencyB.wrapped,
            }),
          })
        }),
      )
      .catch((error) => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          logger.error(error, {
            tags: {
              file: 'AddLiquidityV2',
              function: 'AddLiquidity',
            },
          })
        }
      })
  }

  const modalHeader = () => {
    return (
      <AddLiquidityHeaderContainer>
        {noLiquidity ? (
          <LightCard mt="20px" $borderRadius="20px">
            <AutoRow justify="space-between">
              <Text fontSize={24} fontWeight="$medium" lineHeight={42} mr={10}>
                {currencies[Field.CURRENCY_A]?.symbol + '/' + currencies[Field.CURRENCY_B]?.symbol}
              </Text>
              <DoubleCurrencyLogo currencies={[currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]]} size={30} />
            </AutoRow>
          </LightCard>
        ) : (
          <>
            <RowFlat style={{ marginTop: '20px' }}>
              <Text fontSize={48} fontWeight="$medium" lineHeight={42} mr={10}>
                {liquidityMinted?.toSignificant(6)}
              </Text>
              <DoubleCurrencyLogo currencies={[currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]]} size={30} />
            </RowFlat>
            <Row>
              <Text fontSize={24}>
                {currencies[Field.CURRENCY_A]?.symbol + '/' + currencies[Field.CURRENCY_B]?.symbol + ' Pool Tokens'}
              </Text>
            </Row>
            <Text fontSize={12} textAlign="left" pt={8} fontStyle="italic" color="$neutral2">
              <Trans i18nKey="pool.estimatePercentToRevert" values={{ allowed: allowedSlippage.toSignificant(4) }} />
            </Text>
          </>
        )}
      </AddLiquidityHeaderContainer>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = (
    <Trans
      i18nKey="pool.supplyingMaths"
      values={{
        amtA: parsedAmounts[Field.CURRENCY_A]?.toSignificant(6),
        symA: currencies[Field.CURRENCY_A]?.symbol,
        amtB: parsedAmounts[Field.CURRENCY_B]?.toSignificant(6),
        symB: currencies[Field.CURRENCY_B]?.symbol,
      }}
    />
  )

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        navigate(`/add/v2/${currencyIdB}/${currencyIdA}`)
      } else {
        navigate(`/add/v2/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, navigate, currencyIdA],
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          navigate(`/add/v2/${currencyIdB}/${newCurrencyIdB}`)
        } else {
          navigate(`/add/v2/${newCurrencyIdB}`)
        }
      } else {
        navigate(`/add/v2/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, navigate, currencyIdB],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const { pathname } = useLocation()
  const isCreate = pathname.includes('/create')

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  if (!networkSupportsV2) {
    return <V2Unsupported />
  }

  return (
    <>
      <AppBody>
        <AddRemoveTabs creating={isCreate} adding={true} autoSlippage={DEFAULT_ADD_V2_SLIPPAGE_TOLERANCE} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            reviewContent={() => (
              <ConfirmationModalContent
                title={noLiquidity ? <Trans i18nKey="pool.areCreating" /> : <Trans i18nKey="common.youWillReceive" />}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
            currencyToAdd={pair?.liquidityToken}
          />
          <AutoColumn gap="20px">
            {noLiquidity ||
              (isCreate ? (
                <ColumnCenter>
                  <BlueCard>
                    <AutoColumn gap="10px">
                      <ThemedText.DeprecatedLink fontWeight={535} color="accent1">
                        <Trans i18nKey="pool.areFirst" />
                      </ThemedText.DeprecatedLink>
                      <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
                        <Trans i18nKey="pool.ratioTokenToPrice" />
                      </ThemedText.DeprecatedLink>
                      <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
                        <Trans i18nKey="pool.onceHappyReview" />
                      </ThemedText.DeprecatedLink>
                    </AutoColumn>
                  </BlueCard>
                </ColumnCenter>
              ) : (
                <ColumnCenter>
                  <BlueCard>
                    <AutoColumn gap="10px">
                      <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
                        <b>
                          <Trans i18nKey="common.tip.label" />
                        </b>{' '}
                        <Trans i18nKey="pool.liquidityPoolFeesNotice" />
                      </ThemedText.DeprecatedLink>
                    </AutoColumn>
                  </BlueCard>
                </ColumnCenter>
              ))}
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_A]}
              onUserInput={onFieldAInput}
              onMax={() => {
                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
              }}
              onCurrencySelect={handleCurrencyASelect}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
              currency={currencies[Field.CURRENCY_A] ?? null}
              id="add-liquidity-input-tokena"
            />
            <ColumnCenter>
              <Plus size="16" color={theme.neutral2} />
            </ColumnCenter>
            <CurrencyInputPanel
              value={formattedAmounts[Field.CURRENCY_B]}
              onUserInput={onFieldBInput}
              onCurrencySelect={handleCurrencyBSelect}
              onMax={() => {
                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
              }}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
              currency={currencies[Field.CURRENCY_B] ?? null}
              id="add-liquidity-input-tokenb"
            />
            {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
              <>
                <LightCard padding="0px" $borderRadius="20px">
                  <RowBetween padding="1rem">
                    <ThemedText.DeprecatedSubHeader fontWeight={535} fontSize={14}>
                      {noLiquidity ? <Trans i18nKey="pool.initialShare" /> : <Trans i18nKey="pool.share" />}
                    </ThemedText.DeprecatedSubHeader>
                  </RowBetween>{' '}
                  <LightCard padding="1rem" $borderRadius="20px">
                    <PoolPriceBar
                      currencies={currencies}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                    />
                  </LightCard>
                </LightCard>
              </>
            )}

            {addIsUnsupported ? (
              <ButtonPrimary disabled={true}>
                <ThemedText.DeprecatedMain mb="4px">
                  <Trans i18nKey="common.unsupportedAsset_one" />
                </ThemedText.DeprecatedMain>
              </ButtonPrimary>
            ) : account.status !== 'connected' ? (
              <Trace
                logPress
                eventOnTrigger={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                properties={{ received_swap_quote: false }}
                element={InterfaceElementName.CONNECT_WALLET_BUTTON}
              >
                <ButtonLight onClick={accountDrawer.open}>
                  <Trans i18nKey="common.connectWallet.button" />
                </ButtonLight>
              </Trace>
            ) : (
              <AutoColumn gap="md">
                {(approvalA === ApprovalState.NOT_APPROVED ||
                  approvalA === ApprovalState.PENDING ||
                  approvalB === ApprovalState.NOT_APPROVED ||
                  approvalB === ApprovalState.PENDING) &&
                  isValid && (
                    <RowBetween>
                      {approvalA !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveACallback}
                          disabled={approvalA === ApprovalState.PENDING}
                          width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalA === ApprovalState.PENDING ? (
                            <Dots>
                              <Trans
                                i18nKey="pools.approving.amount"
                                values={{ amount: currencies[Field.CURRENCY_A]?.symbol }}
                              />
                            </Dots>
                          ) : (
                            <Trans
                              i18nKey="account.transactionSummary.approve"
                              values={{ sym: currencies[Field.CURRENCY_A]?.symbol }}
                            />
                          )}
                        </ButtonPrimary>
                      )}
                      {approvalB !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveBCallback}
                          disabled={approvalB === ApprovalState.PENDING}
                          width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalB === ApprovalState.PENDING ? (
                            <Dots>
                              <Trans
                                i18nKey="pools.approving.amount"
                                values={{ amount: currencies[Field.CURRENCY_B]?.symbol }}
                              />
                            </Dots>
                          ) : (
                            <Trans
                              i18nKey="account.transactionSummary.approve"
                              values={{ sym: currencies[Field.CURRENCY_B]?.symbol }}
                            />
                          )}
                        </ButtonPrimary>
                      )}
                    </RowBetween>
                  )}
                <ButtonError
                  onClick={() => {
                    setShowConfirm(true)
                  }}
                  disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                  error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                >
                  <Text fontSize={20} fontWeight="$medium">
                    {error ?? <Trans i18nKey="pool.supply" />}
                  </Text>
                </ButtonError>
              </AutoColumn>
            )}
          </AutoColumn>
        </Wrapper>
      </AppBody>
      <SwitchLocaleLink />

      {!addIsUnsupported ? (
        pair && !noLiquidity && pairState !== PairState.INVALID ? (
          <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '400px', marginTop: '1rem' }}>
            <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
          </AutoColumn>
        ) : null
      ) : (
        <UnsupportedCurrencyFooter
          show={addIsUnsupported}
          currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
        />
      )}
    </>
  )
}
