import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { InterfaceElementName, InterfaceEventName, LiquidityEventName } from '@uniswap/analytics-events'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  Currency,
  CurrencyAmount,
  NONFUNGIBLE_POSITION_MANAGER_ADDRESSES,
  Percent,
  V3_CORE_FACTORY_ADDRESSES,
} from '@uniswap/sdk-core'
import { FeeAmount, NonfungiblePositionManager, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonText } from 'components/Button/buttons'
import { BlueCard, OutlineCard, YellowCard } from 'components/Card/cards'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import FeeSelector from 'components/FeeSelector'
import HoverInlineText from 'components/HoverInlineText'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import { ConnectWalletButtonText } from 'components/NavBar/accountCTAsExperimentUtils'
import { AddRemoveTabs } from 'components/NavigationTabs'
import { PositionPreview } from 'components/PositionPreview'
import RangeSelector from 'components/RangeSelector'
import PresetsButtons from 'components/RangeSelector/PresetsButtons'
import RateToggle from 'components/RateToggle'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { OutOfSyncWarning } from 'components/addLiquidity/OutOfSyncWarning'
import OwnershipWarning from 'components/addLiquidity/OwnershipWarning'
import { TokenTaxV3Warning } from 'components/addLiquidity/TokenTaxV3Warning'
import { AutoColumn } from 'components/deprecated/Column'
import Row, { RowBetween, RowFixed } from 'components/deprecated/Row'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { ZERO_PERCENT } from 'constants/misc'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useArgentWalletContract } from 'hooks/useArgentWalletContract'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import { useDerivedPositionInfo } from 'hooks/useDerivedPositionInfo'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useIsPoolOutOfSync } from 'hooks/useIsPoolOutOfSync'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { PoolCache } from 'hooks/usePools'
import usePrevious from 'hooks/usePrevious'
import { useGetTransactionDeadline } from 'hooks/useTransactionDeadline'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { atomWithStorage, useAtomValue, useUpdateAtom } from 'jotai/utils'
import styled, { useTheme } from 'lib/styled-components'
import { Review } from 'pages/AddLiquidityV3/Review'
import { BlastRebasingAlert, BlastRebasingModal } from 'pages/AddLiquidityV3/blastAlerts'
import {
  DynamicSection,
  MediumOnly,
  ResponsiveTwoColumns,
  ScrollablePage,
  StyledInput,
  Wrapper,
} from 'pages/AddLiquidityV3/styled'
import { BodyWrapper } from 'pages/App/AppBody'
import { PositionPageUnsupportedContent } from 'pages/LegacyPool/PositionPage'
import { Dots } from 'pages/LegacyPool/styled'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Helmet } from 'react-helmet-async/lib/index'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Bound, Field } from 'state/mint/v3/actions'
import {
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from 'state/mint/v3/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionInfo, TransactionType } from 'state/transactions/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { Text } from 'ui/src'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId, isUniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'
import approveAmountCalldata from 'utils/approveAmountCalldata'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { currencyId } from 'utils/currencyId'
import { WrongChainError } from 'utils/errors'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { assume0xAddress } from 'utils/wagmi'
import { erc721Abi } from 'viem'
import { useReadContract } from 'wagmi'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)
const blastRebasingAlertAtom = atomWithStorage<boolean>('shouldShowBlastRebasingAlert', true)

const StyledBodyWrapper = styled(BodyWrapper)<{ $hasExistingPosition: boolean }>`
  padding: ${({ $hasExistingPosition }) => ($hasExistingPosition ? '10px' : 0)};
  max-width: 640px;
`

const BLAST_REBASING_TOKENS = [
  'ETH',
  '0x4300000000000000000000000000000000000004',
  '0x4300000000000000000000000000000000000003',
]

export default function AddLiquidityWrapper() {
  const { chainId } = useAccount()
  const isSupportedChain = useIsSupportedChainId(chainId)
  if (isSupportedChain) {
    return <AddLiquidity />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

function AddLiquidity() {
  const navigate = useNavigate()
  const {
    currencyIdA,
    currencyIdB,
    feeAmount: feeAmountFromUrl,
    tokenId,
  } = useParams<{
    currencyIdA?: string
    currencyIdB?: string
    feeAmount?: string
    tokenId?: string
  }>()
  const { t } = useTranslation()
  const account = useAccount()
  const signer = useEthersSigner()
  const theme = useTheme()
  const trace = useTrace()

  const accountDrawer = useAccountDrawer() // toggle wallet when disconnected
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()

  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined,
  )
  const hasExistingPosition = !!existingPositionDetails && !positionLoading
  const { position: existingPosition } = useDerivedPositionInfo(existingPositionDetails)

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
  const { independentField, typedValue, startPriceTypedValue } = useV3MintState()

  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    pricesAtLimit,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
    isTaxed,
  } = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition,
  )

  const { formatPrice } = useFormatter()
  const formattedPrice = formatPrice({
    price: invertPrice ? price?.invert() : price,
    type: NumberType.TokenTx,
  })
  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput } =
    useV3MintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const getDeadline = useGetTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const usdcValues = {
    [Field.CURRENCY_A]: useUSDCValue(parsedAmounts[Field.CURRENCY_A]),
    [Field.CURRENCY_B]: useUSDCValue(parsedAmounts[Field.CURRENCY_B]),
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

  const argentWalletContract = useArgentWalletContract()

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    account.status === 'connected' && account.chainId
      ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[account.chainId]
      : undefined,
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_B],
    account.status === 'connected' && account.chainId
      ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[account.chainId]
      : undefined,
  )

  const allowedSlippage = useUserSlippageToleranceWithDefault(
    outOfRange ? ZERO_PERCENT : DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE,
  )

  const usdcValueCurrencyA = usdcValues[Field.CURRENCY_A]
  const usdcValueCurrencyB = usdcValues[Field.CURRENCY_B]
  const currencyAFiat = useMemo(
    () => ({
      data: usdcValueCurrencyA ? parseFloat(usdcValueCurrencyA.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyA],
  )
  const currencyBFiat = useMemo(
    () => ({
      data: usdcValueCurrencyB ? parseFloat(usdcValueCurrencyB.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyB],
  )

  async function onAdd() {
    if (account.status !== 'connected' || !signer || !account.chainId) {
      return
    }

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    const deadline = await getDeadline()

    if (position && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined
      const { calldata, value } =
        hasExistingPosition && tokenId
          ? NonfungiblePositionManager.addCallParameters(position, {
              tokenId,
              slippageTolerance: allowedSlippage,
              deadline: deadline.toString(),
              useNative,
            })
          : NonfungiblePositionManager.addCallParameters(position, {
              slippageTolerance: allowedSlippage,
              recipient: account.address,
              deadline: deadline.toString(),
              useNative,
              createPool: noLiquidity,
            })

      let txn: { to: string; data: string; value: string } = {
        to: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[account.chainId],
        data: calldata,
        value,
      }

      if (argentWalletContract) {
        const amountA = parsedAmounts[Field.CURRENCY_A]
        const amountB = parsedAmounts[Field.CURRENCY_B]
        const batch = [
          ...(amountA && amountA.currency.isToken
            ? [approveAmountCalldata(amountA, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[account.chainId])]
            : []),
          ...(amountB && amountB.currency.isToken
            ? [approveAmountCalldata(amountB, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[account.chainId])]
            : []),
          {
            to: txn.to,
            data: txn.data,
            value: txn.value,
          },
        ]
        const data = argentWalletContract.interface.encodeFunctionData('wc_multiCall', [batch])
        txn = {
          to: argentWalletContract.address,
          data,
          value: '0x0',
        }
      }

      const connectedChainId = await signer.getChainId()
      if (account.chainId !== connectedChainId) {
        throw new WrongChainError()
      }

      setAttemptingTxn(true)

      signer
        .estimateGas(txn)
        .then((estimate) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate),
          }

          return signer.sendTransaction(newTxn).then((response: TransactionResponse) => {
            setAttemptingTxn(false)
            const transactionInfo: TransactionInfo = {
              type: TransactionType.ADD_LIQUIDITY_V3_POOL,
              baseCurrencyId: currencyId(baseCurrency),
              quoteCurrencyId: currencyId(quoteCurrency),
              createPool: Boolean(noLiquidity),
              expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
              expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient?.toString() ?? '0',
              feeAmount: position.pool.fee,
            }
            addTransaction(response, transactionInfo)
            setTxHash(response.hash)

            sendAnalyticsEvent(LiquidityEventName.ADD_LIQUIDITY_SUBMITTED, {
              ...transactionInfo,
              ...getLPBaseAnalyticsProperties({
                trace,
                fee: feeAmount,
                version: ProtocolVersion.V3,
                poolId:
                  feeAmount && account.chainId
                    ? PoolCache.getPoolAddress(
                        V3_CORE_FACTORY_ADDRESSES[account.chainId],
                        baseCurrency.wrapped,
                        quoteCurrency.wrapped,
                        feeAmount,
                        account.chainId,
                      )
                    : undefined,
                currency0: baseCurrency,
                currency1: quoteCurrency,
                currency0AmountUsd: usdcValueCurrencyA,
                currency1AmountUsd: usdcValueCurrencyB,
              }),
              createPosition: false,
              transaction_hash: response.hash,
            })
          })
        })
        .catch((error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            logger.warn('AddLiquidity', 'addLiquidity', 'Error completing add liquidity tx', error)
          }
        })
    } else {
      return
    }
  }

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew =
          currencyIdNew === 'ETH' ||
          (account.status === 'connected' &&
            account.chainId &&
            currencyIdNew === WRAPPED_NATIVE_CURRENCY[account.chainId]?.address)
        const isETHOrWETHOther =
          currencyIdOther !== undefined &&
          (currencyIdOther === 'ETH' ||
            (account.status === 'connected' &&
              account.chainId &&
              currencyIdOther === WRAPPED_NATIVE_CURRENCY[account.chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [account.chainId, account.status],
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        navigate(`/add/${idA}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, navigate],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        navigate(`/add/${idB}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, navigate],
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      navigate(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, navigate, onLeftRangeInput, onRightRangeInput],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      navigate('/pools')
    }
    setTxHash('')
  }, [navigate, onFieldAInput, txHash])

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    navigate(`/add`)
  }, [navigate, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks({
      baseCurrency,
      quoteCurrency,
      feeAmount,
      tickLower,
      tickUpper,
      pool,
    })

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB =
    !argentWalletContract && approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${
    !depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
  }`

  const [searchParams, setSearchParams] = useSearchParams()

  const handleSetFullRange = useCallback(() => {
    getSetFullRange()

    const minPrice = pricesAtLimit[Bound.LOWER]
    if (minPrice) {
      searchParams.set('minPrice', minPrice.toSignificant(5))
    }
    const maxPrice = pricesAtLimit[Bound.UPPER]
    if (maxPrice) {
      searchParams.set('maxPrice', maxPrice.toSignificant(5))
    }
    setSearchParams(searchParams)
  }, [getSetFullRange, pricesAtLimit, searchParams, setSearchParams])

  // START: sync values with query string
  const oldSearchParams = usePrevious(searchParams)
  // use query string as an input to onInput handlers
  useEffect(() => {
    const minPrice = searchParams.get('minPrice')
    const oldMinPrice = oldSearchParams?.get('minPrice')
    if (
      minPrice &&
      typeof minPrice === 'string' &&
      !isNaN(minPrice as any) &&
      (!oldMinPrice || oldMinPrice !== minPrice)
    ) {
      onLeftRangeInput(minPrice)
    }
    // disable eslint rule because this hook only cares about the url->input state data flow
    // input state -> url updates are handled in the input handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  useEffect(() => {
    const maxPrice = searchParams.get('maxPrice')
    const oldMaxPrice = oldSearchParams?.get('maxPrice')
    if (
      maxPrice &&
      typeof maxPrice === 'string' &&
      !isNaN(maxPrice as any) &&
      (!oldMaxPrice || oldMaxPrice !== maxPrice)
    ) {
      onRightRangeInput(maxPrice)
    }
    // disable eslint rule because this hook only cares about the url->input state data flow
    // input state -> url updates are handled in the input handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  // END: sync values with query string

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled={true} $borderRadius="12px" padding="12px">
        <ThemedText.DeprecatedMain mb="4px" style={{ textTransform: 'capitalize' }}>
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
        <ButtonLight onClick={accountDrawer.open} $borderRadius="12px" padding="12px">
          <ConnectWalletButtonText />
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
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={showApprovalB ? '48%' : '100%'}
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
                      values={{ tokenSymbol: currencies[Field.CURRENCY_A]?.symbol }}
                    />
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
                      <Trans
                        i18nKey="pools.approving.amount"
                        values={{ amount: currencies[Field.CURRENCY_B]?.symbol }}
                      />
                    </Dots>
                  ) : (
                    <Trans
                      i18nKey="account.transactionSummary.approve"
                      values={{ tokenSymbol: currencies[Field.CURRENCY_B]?.symbol }}
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
          disabled={
            !isValid ||
            (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
            (!argentWalletContract && approvalB !== ApprovalState.APPROVED && !depositBDisabled)
          }
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
        >
          <Text fontWeight="$medium" color="$neutralContrast">
            {errorMessage ? errorMessage : <Trans i18nKey="common.preview" />}
          </Text>
        </ButtonError>
      </AutoColumn>
    )

  const { data: owner } = useReadContract({
    address: assume0xAddress(NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[account.chainId ?? UniverseChainId.Mainnet]),
    chainId: account.chainId ?? UniverseChainId.Mainnet,
    abi: erc721Abi,
    functionName: 'ownerOf',
    args: tokenId ? [BigInt(tokenId)] : undefined,
    query: { enabled: !!tokenId },
  })

  const ownsNFT =
    addressesAreEquivalent(owner, account.address) ||
    addressesAreEquivalent(existingPositionDetails?.operator, account.address)
  const showOwnershipWarning = Boolean(hasExistingPosition && account.address && !ownsNFT)
  const showBlastRebasingWarning =
    account.chainId === UniverseChainId.Blast &&
    ((!!currencyIdA && BLAST_REBASING_TOKENS.includes(currencyIdA)) ||
      (!!currencyIdB && BLAST_REBASING_TOKENS.includes(currencyIdB)))

  const showBlastRebasingModal = useAtomValue(blastRebasingAlertAtom) && showBlastRebasingWarning
  const updateShowBlastRebasingModal = useUpdateAtom(blastRebasingAlertAtom)
  const handleBlastModalContinue = useCallback(() => {
    updateShowBlastRebasingModal(false)
  }, [updateShowBlastRebasingModal])

  const outOfSync = useIsPoolOutOfSync(price)

  return (
    <>
      <Helmet>
        <title>
          {t('pool.addLiquidity.seoTitle', {
            tokenPair:
              quoteCurrency?.symbol && baseCurrency?.symbol
                ? `${quoteCurrency.symbol}/${baseCurrency.symbol}`
                : quoteCurrency?.symbol ?? baseCurrency?.symbol ?? 'pools',
            chain: getChainLabel(isUniverseChainId(account.chainId) ? account.chainId : UniverseChainId.Mainnet),
          })}
        </title>
      </Helmet>
      <ScrollablePage>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          reviewContent={() => (
            <ConfirmationModalContent
              title={<Trans i18nKey="common.addLiquidity" />}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <Review
                  parsedAmounts={parsedAmounts}
                  position={position}
                  existingPosition={existingPosition}
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  outOfRange={outOfRange}
                  ticksAtLimit={ticksAtLimit}
                />
              )}
              bottomContent={() => (
                <ButtonPrimary style={{ marginTop: '1rem' }} onClick={onAdd}>
                  <Text fontWeight="$medium" fontSize={20} color="$neutralContrast">
                    <Trans i18nKey="common.add.label" />
                  </Text>
                </ButtonPrimary>
              )}
            />
          )}
          pendingText={pendingText}
        />
        <StyledBodyWrapper $hasExistingPosition={hasExistingPosition}>
          <AddRemoveTabs
            creating={false}
            adding={true}
            positionID={tokenId}
            autoSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={!hasExistingPosition}
          >
            {!hasExistingPosition && (
              <Row justify="flex-end" style={{ width: 'fit-content', minWidth: 'fit-content' }}>
                <MediumOnly>
                  <ButtonText onClick={clearAll}>
                    <Text color="$accent1" fontSize="12px">
                      <Trans i18nKey="tokens.selector.button.clear" />
                    </Text>
                  </ButtonText>
                </MediumOnly>
              </Row>
            )}
          </AddRemoveTabs>
          <Wrapper>
            <ResponsiveTwoColumns wide={!hasExistingPosition}>
              <AutoColumn gap="lg">
                {!hasExistingPosition && (
                  <>
                    <AutoColumn gap="md">
                      {outOfSync && (
                        <RowBetween paddingBottom="20px">
                          <OutOfSyncWarning />
                        </RowBetween>
                      )}
                      {isTaxed && (
                        <RowBetween paddingBottom="20px">
                          <TokenTaxV3Warning />
                        </RowBetween>
                      )}
                      <RowBetween paddingBottom="20px">
                        <ThemedText.DeprecatedLabel>
                          <Trans i18nKey="pool.selectPair" />
                        </ThemedText.DeprecatedLabel>
                      </RowBetween>
                      <RowBetween gap="md">
                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_A]}
                          onUserInput={onFieldAInput}
                          hideInput
                          onMax={() => {
                            onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                          }}
                          onCurrencySelect={handleCurrencyASelect}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                          currency={currencies[Field.CURRENCY_A] ?? null}
                          id="add-liquidity-input-tokena"
                        />

                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_B]}
                          hideInput
                          onUserInput={onFieldBInput}
                          onCurrencySelect={handleCurrencyBSelect}
                          onMax={() => {
                            onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                          }}
                          showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                          currency={currencies[Field.CURRENCY_B] ?? null}
                          id="add-liquidity-input-tokenb"
                        />
                      </RowBetween>
                      {showBlastRebasingWarning && <BlastRebasingAlert />}
                      <FeeSelector
                        disabled={!quoteCurrency || !baseCurrency}
                        feeAmount={feeAmount}
                        handleFeePoolSelect={handleFeePoolSelect}
                        currencyA={baseCurrency ?? undefined}
                        currencyB={quoteCurrency ?? undefined}
                      />
                    </AutoColumn>{' '}
                  </>
                )}
                {hasExistingPosition && existingPosition && (
                  <PositionPreview
                    position={existingPosition}
                    title={<Trans i18nKey="pool.selectedRange" />}
                    inRange={!outOfRange}
                    ticksAtLimit={ticksAtLimit}
                    showBlastAlert={showBlastRebasingWarning}
                  />
                )}
              </AutoColumn>

              {!hasExistingPosition && (
                <>
                  <DynamicSection gap="md" disabled={!feeAmount || invalidPool}>
                    <RowBetween>
                      <ThemedText.DeprecatedLabel>
                        <Trans i18nKey="migrate.setRange" />
                      </ThemedText.DeprecatedLabel>

                      {Boolean(baseCurrency && quoteCurrency) && (
                        <RowFixed gap="8px">
                          <PresetsButtons onSetFullRange={handleSetFullRange} />
                          <RateToggle
                            currencyA={baseCurrency as Currency}
                            currencyB={quoteCurrency as Currency}
                            handleRateToggle={() => {
                              if (!ticksAtLimit[Bound.LOWER] && !ticksAtLimit[Bound.UPPER]) {
                                onLeftRangeInput(
                                  (invertPrice ? priceLower : priceUpper?.invert())?.toSignificant(6) ?? '',
                                )
                                onRightRangeInput(
                                  (invertPrice ? priceUpper : priceLower?.invert())?.toSignificant(6) ?? '',
                                )
                                onFieldAInput(formattedAmounts[Field.CURRENCY_B] ?? '')
                              }
                              navigate(
                                `/add/${currencyIdB as string}/${currencyIdA as string}${
                                  feeAmount ? '/' + feeAmount : ''
                                }`,
                              )
                            }}
                          />
                        </RowFixed>
                      )}
                    </RowBetween>

                    <RangeSelector
                      priceLower={priceLower}
                      priceUpper={priceUpper}
                      getDecrementLower={getDecrementLower}
                      getIncrementLower={getIncrementLower}
                      getDecrementUpper={getDecrementUpper}
                      getIncrementUpper={getIncrementUpper}
                      onLeftRangeInput={onLeftRangeInput}
                      onRightRangeInput={onRightRangeInput}
                      currencyA={baseCurrency}
                      currencyB={quoteCurrency}
                      feeAmount={feeAmount}
                      ticksAtLimit={ticksAtLimit}
                    />

                    {outOfRange && (
                      <YellowCard padding="8px 12px" $borderRadius="12px">
                        <RowBetween>
                          <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                          <Text color="$yellow600" ml="12px" fontSize="12px">
                            <Trans i18nKey="migrate.positionNoFees" />
                          </Text>
                        </RowBetween>
                      </YellowCard>
                    )}

                    {invalidRange && (
                      <YellowCard padding="8px 12px" $borderRadius="12px">
                        <RowBetween>
                          <AlertTriangle stroke={theme.deprecated_yellow3} size="16px" />
                          <Text color="$yellow600" ml="12px" fontSize="12px">
                            <Trans i18nKey="migrate.invalidRange" />
                          </Text>
                        </RowBetween>
                      </YellowCard>
                    )}
                  </DynamicSection>

                  <DynamicSection gap="md" disabled={!feeAmount || invalidPool}>
                    {!noLiquidity ? (
                      <>
                        {Boolean(price && baseCurrency && quoteCurrency && !noLiquidity) && (
                          <AutoColumn gap="2px" style={{ marginTop: '0.5rem' }}>
                            <ThemedText.DeprecatedMain fontWeight={535} fontSize={12} color="text1">
                              <Trans i18nKey="common.currentPrice.label" />
                            </ThemedText.DeprecatedMain>
                            <ThemedText.DeprecatedBody color="text2" fontSize={12}>
                              <Trans
                                i18nKey="liquidityPool.positions.price.formatted"
                                components={{
                                  amountWithSymbol: (
                                    <ThemedText.DeprecatedBody fontWeight={535} fontSize={20} color="text1">
                                      {price && <HoverInlineText maxCharacters={20} text={formattedPrice} />}
                                    </ThemedText.DeprecatedBody>
                                  ),
                                  outputToken: (
                                    <ThemedText.DeprecatedBody color="text2" fontSize={12}>
                                      {baseCurrency?.symbol ?? ''}
                                    </ThemedText.DeprecatedBody>
                                  ),
                                }}
                              />
                            </ThemedText.DeprecatedBody>
                          </AutoColumn>
                        )}
                        <LiquidityChartRangeInput
                          currencyA={baseCurrency ?? undefined}
                          currencyB={quoteCurrency ?? undefined}
                          feeAmount={feeAmount}
                          ticksAtLimit={ticksAtLimit}
                          price={
                            price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined
                          }
                          priceLower={priceLower}
                          priceUpper={priceUpper}
                          onLeftRangeInput={onLeftRangeInput}
                          onRightRangeInput={onRightRangeInput}
                          interactive={!hasExistingPosition}
                          protocolVersion={ProtocolVersion.V3}
                          tickSpacing={feeAmount ? TICK_SPACINGS[feeAmount] : undefined}
                        />
                      </>
                    ) : (
                      <AutoColumn gap="md">
                        {noLiquidity && (
                          <BlueCard
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: '1rem 1rem',
                            }}
                          >
                            <ThemedText.DeprecatedBody
                              fontSize={14}
                              style={{ fontWeight: 535 }}
                              textAlign="left"
                              color={theme.accent1}
                            >
                              <Trans i18nKey="pool.mustBeInitialized" />
                            </ThemedText.DeprecatedBody>
                          </BlueCard>
                        )}
                        <OutlineCard padding="12px">
                          <StyledInput
                            className="start-price-input"
                            value={startPriceTypedValue}
                            onUserInput={onStartPriceInput}
                          />
                        </OutlineCard>
                        <RowBetween
                          style={{
                            backgroundColor: theme.surface1,
                            padding: '12px',
                            borderRadius: '12px',
                          }}
                        >
                          <ThemedText.DeprecatedMain>
                            <Trans i18nKey="pool.startingPrice" values={{ sym: baseCurrency?.symbol }} />
                          </ThemedText.DeprecatedMain>
                          <ThemedText.DeprecatedMain>
                            {price ? (
                              <ThemedText.DeprecatedMain>
                                <RowFixed>
                                  <HoverInlineText
                                    maxCharacters={20}
                                    text={invertPrice ? price?.invert()?.toSignificant(8) : price?.toSignificant(8)}
                                  />{' '}
                                  <span style={{ marginLeft: '4px' }}>
                                    <Trans
                                      i18nKey="common.feesEarnedPerBase"
                                      values={{ symbolA: quoteCurrency?.symbol, symbolB: baseCurrency?.symbol }}
                                    />
                                  </span>
                                </RowFixed>
                              </ThemedText.DeprecatedMain>
                            ) : (
                              '-'
                            )}
                          </ThemedText.DeprecatedMain>
                        </RowBetween>
                      </AutoColumn>
                    )}
                  </DynamicSection>
                </>
              )}
              <div>
                <DynamicSection disabled={invalidPool || invalidRange || (noLiquidity && !startPriceTypedValue)}>
                  <AutoColumn gap="md">
                    <ThemedText.DeprecatedLabel>
                      {hasExistingPosition ? (
                        <Trans i18nKey="pool.addMoreLiquidity" />
                      ) : (
                        <Trans i18nKey="pool.depositAmounts" />
                      )}
                    </ThemedText.DeprecatedLabel>

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                      currency={currencies[Field.CURRENCY_A] ?? null}
                      id="add-liquidity-input-tokena"
                      fiatValue={currencyAFiat}
                      locked={depositADisabled}
                    />

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      onUserInput={onFieldBInput}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                      fiatValue={currencyBFiat}
                      currency={currencies[Field.CURRENCY_B] ?? null}
                      id="add-liquidity-input-tokenb"
                      locked={depositBDisabled}
                    />
                  </AutoColumn>
                </DynamicSection>
              </div>
              <Buttons />
            </ResponsiveTwoColumns>
          </Wrapper>
        </StyledBodyWrapper>
        {showOwnershipWarning && <OwnershipWarning ownerAddress={owner} />}
        {addIsUnsupported && (
          <UnsupportedCurrencyFooter
            show={addIsUnsupported}
            currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
          />
        )}
      </ScrollablePage>
      <SwitchLocaleLink />
      {showBlastRebasingModal && (
        <BlastRebasingModal currencyIdA={currencyIdA} currencyIdB={currencyIdB} onContinue={handleBlastModalContinue} />
      )}
    </>
  )
}
