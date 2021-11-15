import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { toHex } from '@uniswap/v3-sdk'
import CurrencyLogo from 'components/CurrencyLogo'
import DowntimeWarning from 'components/DowntimeWarning'
import { useCallback, useState } from 'react'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { useV3DerivedMintInfo, useV3MintActionHandlers, useV3MintState } from 'state/mint/v3/hooks'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { RowBetween, RowFixed } from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { LIMIT_ORDER_MANAGER_ADDRESSES } from '../../constants/addresses'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import { useArgentWalletContract } from '../../hooks/useArgentWalletContract'
import { useLimitOrderManager } from '../../hooks/useContract'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/mint/v3/actions'
import { TransactionType } from '../../state/transactions/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useNetworkGasPrice, useUserGasPrice } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import approveAmountCalldata from '../../utils/approveAmountCalldata'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { currencyId } from '../../utils/currencyId'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { Dots } from '../Pool/styleds'
import { DynamicSection, PageWrapper, ScrollablePage, Wrapper } from './styled'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function AddLiquidity({
  match: {
    params: { currencyIdA },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
  const addTransaction = useTransactionAdder()
  const limitManager = useLimitOrderManager()

  const baseCurrency = useCurrency(currencyIdA)

  const { parsedAmounts, currencyBalances, currencies, errorMessage, depositADisabled, userGasPrice, networkGasPrice } =
    useV3DerivedMintInfo(baseCurrency ?? undefined, baseCurrency ?? undefined)

  const { independentField, typedValue } = useV3MintState()

  const { onFieldAInput } = useV3MintActionHandlers(true)

  const isValid = !errorMessage

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
  }

  const usdcValues = {
    [Field.CURRENCY_A]: useUSDCValue(parsedAmounts[Field.CURRENCY_A]),
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  const argentWalletContract = useArgentWalletContract()

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    chainId ? LIMIT_ORDER_MANAGER_ADDRESSES[chainId] : undefined
  )

  async function onAdd() {
    if (!chainId || !library || !account) return

    if (!limitManager || !baseCurrency) {
      return
    }

    const amount0 = parsedAmounts?.[Field.CURRENCY_A]?.quotient
    const calldatas: string[] = []

    if (account && amount0) {
      if (!userGasPrice?.greaterThan('0') && networkGasPrice?.quotient) {
        console.log(toHex(networkGasPrice?.quotient))
        calldatas.push(
          limitManager.interface.encodeFunctionData('setTargetGasPrice', [toHex(networkGasPrice?.quotient)])
        )
      }
      calldatas.push(limitManager.interface.encodeFunctionData('addFunding', [toHex(amount0)]))
      const calldata =
        calldatas.length === 1 ? calldatas[0] : limitManager.interface.encodeFunctionData('multicall', [calldatas])

      let txn: { to: string; data: string; value: string } = {
        to: LIMIT_ORDER_MANAGER_ADDRESSES[chainId],
        data: calldata,
        value: '0x0',
      }

      if (argentWalletContract) {
        const amountA = parsedAmounts[Field.CURRENCY_A]
        const batch = [
          ...(amountA && amountA.currency.isToken
            ? [approveAmountCalldata(amountA, LIMIT_ORDER_MANAGER_ADDRESSES[chainId])]
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

      setAttemptingTxn(true)

      library
        .getSigner()
        .estimateGas(txn)
        .then((estimate) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(chainId, estimate),
          }

          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              addTransaction(response, {
                type: TransactionType.ADD_FUNDING,
                baseCurrencyId: currencyId(baseCurrency),
                expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
              })
              setTxHash(response.hash)
              ReactGA.event({
                category: 'Liquidity',
                action: 'Add',
                label: [currencies[Field.CURRENCY_A]?.symbol].join('/'),
              })
            })
        })
        .catch((error) => {
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

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <LightCard padding="12px 16px">
          <AutoColumn gap="md">
            <RowBetween>
              <RowFixed>
                <CurrencyLogo
                  currency={parsedAmounts[Field.CURRENCY_A]?.currency}
                  size={'20px'}
                  style={{ marginRight: '0.5rem' }}
                />
                <TYPE.main>{formatCurrencyAmount(parsedAmounts[Field.CURRENCY_A], 4)}</TYPE.main>
              </RowFixed>
              <TYPE.main>{parsedAmounts[Field.CURRENCY_A]?.currency?.symbol}</TYPE.main>
            </RowBetween>
          </AutoColumn>
        </LightCard>
        <TYPE.italic>
          <Trans>Adding Funds will allow you to automatically process trades.</Trans>
        </TYPE.italic>
        <ButtonPrimary onClick={onAdd}>
          <Trans>Add</Trans>
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      history.push('/pool')
    }
    setTxHash('')
  }, [history, onFieldAInput, txHash])

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]

  const pendingText = `Adding ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  }`

  const Buttons = () =>
    !account ? (
      <ButtonLight onClick={toggleWalletModal} $borderRadius="12px" padding={'12px'}>
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    ) : (
      <AutoColumn gap={'md'}>
        {(approvalA === ApprovalState.NOT_APPROVED || approvalA === ApprovalState.PENDING) && isValid && (
          <RowBetween>
            {showApprovalA && (
              <ButtonPrimary onClick={approveACallback} disabled={approvalA === ApprovalState.PENDING} width={'100%'}>
                {approvalA === ApprovalState.PENDING ? (
                  <Dots>
                    <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                  </Dots>
                ) : (
                  <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                )}
              </ButtonPrimary>
            )}
          </RowBetween>
        )}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={!isValid || (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled)}
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A]}
        >
          <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
        </ButtonError>
      </AutoColumn>
    )

  return (
    <>
      <ScrollablePage>
        <DowntimeWarning />
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() => (
            <ConfirmationModalContent
              title={<Trans>Add Funds</Trans>}
              onDismiss={() => setShowConfirm(false)}
              topContent={modalHeader}
            />
          )}
          pendingText={pendingText}
        />
        <PageWrapper wide={true}>
          <AddRemoveTabs
            creating={false}
            adding={true}
            defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={true}
          ></AddRemoveTabs>
          <Wrapper>
            <AutoColumn gap="lg"></AutoColumn>
            <div>
              <DynamicSection disabled={false}>
                <AutoColumn gap="md">
                  <TYPE.label>
                    <Trans>Amount</Trans>
                  </TYPE.label>

                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onFieldAInput}
                    onMax={() => {
                      onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                    }}
                    showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                    currency={currencies[Field.CURRENCY_A] ?? null}
                    id="add-liquidity-input-tokena"
                    fiatValue={usdcValues[Field.CURRENCY_A]}
                    showCommonBases
                    locked={depositADisabled}
                  />
                </AutoColumn>
              </DynamicSection>
            </div>

            <Buttons />
          </Wrapper>
        </PageWrapper>
      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  )
}
