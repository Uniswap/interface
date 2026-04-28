import type { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount /*, Token*/ } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { ButtonConfirmed, ButtonError } from '~/components/Button/buttons'
import CurrencyInputPanel from '~/components/CurrencyInputPanel'
import { AutoColumn } from '~/components/deprecated/Column'
import { RowBetween } from '~/components/deprecated/Row'
import { LoadingView, SubmittedView } from '~/components/ModalViews'
import ProgressCircles from '~/components/ProgressSteps'
import { ApprovalState, useApproveCallback } from '~/hooks/useApproveCallback'
import JSBI from 'jsbi'
import styled from '~/lib/deprecated-styled'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { PoolInfo, useDerivedPoolInfo } from '~/state/buy/hooks'
import { usePoolExtendedContract } from '~/state/pool/hooks'
import { useIsTransactionConfirmed, useTransaction, useTransactionAdder } from '~/state/transactions/hooks'
import { ThemedText } from '~/theme/components'
import { ModalCloseIcon } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionStatus, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { calculateGasMargin } from '~/utils/calculateGasMargin'
import { maxAmountSpend } from '~/utils/maxAmountSpend'
import { parseUnits } from 'viem'

const mintAmountCache = new Map()

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface PoolModalProps {
  isOpen: boolean
  onDismiss: () => void
  poolInfo?: PoolInfo
  userBaseTokenBalance?: CurrencyAmount<Currency>
}

export default function BuyModal({ isOpen, onDismiss, poolInfo, userBaseTokenBalance }: PoolModalProps) {
  //console.log('Rendering BuyModal with poolInfo:', poolInfo, 'and userBaseTokenBalance:', userBaseTokenBalance)
  const { provider } = useWeb3React()

  // track and parse user input
  const [typedValue, setTypedValue] = useState('')

  // state for pending and submitted txn views
  const addTransaction = useTransactionAdder()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const { formatCurrencyAmount } = useLocalizationContext()
  const transactionSuccess = transaction?.status === TransactionStatus.Success

  const { parsedAmount, error } = useDerivedPoolInfo(typedValue, userBaseTokenBalance?.currency, userBaseTokenBalance)

  // approval data for buy with tokens
  //const deadline = useTransactionDeadline()
  const [approval, approveCallback] = useApproveCallback(parsedAmount, poolInfo?.pool.address)

  const poolContract = usePoolExtendedContract(poolInfo?.pool.address)
  const [expectedMintAmount, setExpectedMintAmount] = useState<any>(undefined)
  const [mintCallError, setMintCallError] = useState<string | undefined>()

  useEffect(() => {
    async function retrieveRealTimeMintAmount() {
      if (
        !poolContract ||
        !poolInfo?.recipient ||
        !parsedAmount?.quotient ||
        !JSBI.greaterThan(parsedAmount.quotient, JSBI.BigInt(parseUnits('0.0001', parsedAmount.currency.decimals).toString()))
      ) {
        return
      }

      // TODO: handle error if contract call fails
      const value = userBaseTokenBalance?.currency.isNative ? parsedAmount.quotient.toString() : null
      const args = [poolInfo.recipient, parsedAmount.quotient.toString(), 1]
      let mintAmount
      try {
        const cacheKey = JSON.stringify(args) + (value ? value.toString() : '')
        if (mintAmountCache.has(cacheKey)) {
          mintAmount = mintAmountCache.get(cacheKey)
        } else {
          mintAmount = await poolContract.callStatic['mint(address,uint256,uint256)'](...args, value ? { value } : {})
          mintAmountCache.set(cacheKey, mintAmount)
        }
      } catch (e: unknown) {
        setExpectedMintAmount(undefined)
        // Before approval the ERC-20 transferFrom inside mint() always reverts due to zero allowance.
        // That is expected — suppress it. Only surface errors once the user has already approved,
        // which means something in the contract logic itself is rejecting the call.
        if (approval === ApprovalState.APPROVED) {
          setMintCallError(e instanceof Error ? e.message : String(e))
        } else {
          setMintCallError(undefined)
        }
        return
      }
      setExpectedMintAmount(mintAmount)
      setMintCallError(undefined)
    }
    retrieveRealTimeMintAmount()
  }, [poolContract, poolInfo?.recipient, parsedAmount?.quotient, userBaseTokenBalance?.currency.isNative, approval])

  const { expectedPoolTokens, minimumAmount } = useMemo(() => {
    if (!parsedAmount || !poolInfo || !expectedMintAmount) {
      return {
        expectedPoolTokens: undefined,
        minimumAmount: undefined,
      }
    }

    // extra 10% margin
    const mintJSBI = JSBI.BigInt(expectedMintAmount.toString())
    const minimumAmount = JSBI.subtract(mintJSBI, JSBI.divide(mintJSBI, JSBI.BigInt(10)))
    return {
      expectedPoolTokens: CurrencyAmount.fromRawAmount(poolInfo.poolPriceAmount.currency, expectedMintAmount),
      minimumAmount: CurrencyAmount.fromRawAmount(poolInfo.poolPriceAmount.currency, minimumAmount),
    }
  }, [parsedAmount, poolInfo, expectedMintAmount])

  async function onBuy(): Promise<void | undefined> {
    setAttempting(true)
    if (poolContract && parsedAmount && poolInfo /*&& deadline*/) {
      if (approval === ApprovalState.APPROVED) {
        const value = userBaseTokenBalance?.currency.isNative ? parsedAmount.quotient.toString() : null
        // minimumAmount is guaranteed defined here: the Buy button is disabled until the callStatic
        // succeeds and minimumAmount is set (see disabled condition on ButtonError below).
        const args = [poolInfo.recipient, parsedAmount.quotient.toString(), minimumAmount!.quotient.toString()]

        // mint method not unique in interface
        return poolContract.estimateGas['mint(address,uint256,uint256)'](...args, value ? { value } : {}).then(
          (estimatedGasLimit) => {
            return poolContract['mint(address,uint256,uint256)'](...args, {
              value,
              gasLimit: calculateGasMargin(estimatedGasLimit),
            })
              .then((response: TransactionResponse) => {
                addTransaction(response, {
                  type: TransactionType.Buy,
                  vaultAddress: poolInfo.pool.address,
                  purchaseCurrencyAmountRaw: parsedAmount.quotient.toString(),
                })
                setAttempting(false)
                setHash(response.hash)
                return response.hash
              })
              .catch(() => {
                setAttempting(false)
              })
          },
        )
      } else {
        setAttempting(false)
        throw new Error('Attempting to stake without approval. Please contact support.')
      }
    } else {
      return undefined
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback((typedValue: string) => {
    setTypedValue(typedValue)
  }, [])

  // used for max input button
  // When buying pool tokens with native ETH, the gas reserve is appropriate
  // because the user pays gas from the same wallet balance.
  const maxAmountInput = maxAmountSpend(userBaseTokenBalance)
  const atMaxAmount = Boolean(maxAmountInput && parsedAmount?.equalTo(maxAmountInput))
  const handleMax = useCallback(() => {
    maxAmountInput && onUserInput(maxAmountInput.toExact())
  }, [maxAmountInput, onUserInput])

  async function onAttemptToApprove() {
    if (!poolContract || !provider /*|| !deadline*/) {
      throw new Error('missing dependencies')
    }
    if (!parsedAmount) {
      throw new Error('missing liquidity amount')
    }

    await approveCallback()
  }

  return (
    <Modal name={ModalName.DappRequest} isModalOpen={isOpen} isDismissible onClose={wrappedOnDismiss} maxHeight={480}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          {userBaseTokenBalance && poolInfo && (
            <>
              <RowBetween>
                <ThemedText.DeprecatedMediumHeader>
                  <Trans>
                    Buy {poolInfo.pool.symbol} using {userBaseTokenBalance.currency.symbol}
                  </Trans>
                </ThemedText.DeprecatedMediumHeader>
                <ModalCloseIcon onClose={wrappedOnDismiss} />
              </RowBetween>
              <CurrencyInputPanel
                value={typedValue}
                onUserInput={onUserInput}
                onMax={handleMax}
                showMaxButton={!atMaxAmount}
                currency={userBaseTokenBalance.currency}
                isAccount={true}
                label=""
                renderBalance={(amount) => (
                  <Trans>Available to deposit: {formatCurrencyAmount({ value: amount })}</Trans>
                )}
                id="buy-pool-tokens"
              />
            </>
          )}

          <RowBetween>
            <ButtonConfirmed
              mr="0.5rem"
              onClick={onAttemptToApprove}
              confirmed={approval === ApprovalState.APPROVED}
              disabled={approval !== ApprovalState.NOT_APPROVED}
            >
              <Trans>Approve</Trans>
            </ButtonConfirmed>
            <ButtonError
              disabled={!!error || approval !== ApprovalState.APPROVED || !minimumAmount}
              error={!!error && !!parsedAmount}
              onClick={onBuy}
            >
              {error ?? <Trans>Buy</Trans>}
            </ButtonError>
            {mintCallError && approval === ApprovalState.APPROVED && (
              <ThemedText.DeprecatedBody style={{ color: '#ff6b6b', wordBreak: 'break-all', fontSize: '12px' }}>
                {mintCallError}
              </ThemedText.DeprecatedBody>
            )}
          </RowBetween>
          <ProgressCircles steps={[approval === ApprovalState.APPROVED]} disabled={true} />
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify="center">
            <ThemedText.DeprecatedLargeHeader>
              <Trans>Depositing</Trans>
            </ThemedText.DeprecatedLargeHeader>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>
                {parsedAmount?.toSignificant(4)} {userBaseTokenBalance?.currency.symbol}
              </Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody fontSize={20}>
              <Trans>
                Expected {expectedPoolTokens?.toSignificant(4)} {poolInfo?.pool.symbol}
              </Trans>
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </LoadingView>
      )}
      {hash && (
        <SubmittedView onDismiss={wrappedOnDismiss} hash={hash} transactionSuccess={transactionSuccess}>
          <AutoColumn gap="12px" justify="center">
            {!confirmed ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Submitted</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedBody fontSize={20}>
                  <Trans>
                    Depositing {parsedAmount?.toSignificant(4)} {userBaseTokenBalance?.currency.symbol}
                  </Trans>
                </ThemedText.DeprecatedBody>
              </>
            ) : transactionSuccess ? (
              <>
                <ThemedText.DeprecatedLargeHeader>
                  <Trans>Transaction Success</Trans>
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedBody fontSize={20}>
                  <Trans>
                    Deposited {parsedAmount?.toSignificant(4)} {userBaseTokenBalance?.currency.symbol}
                  </Trans>
                </ThemedText.DeprecatedBody>
              </>
            ) : (
              <ThemedText.DeprecatedLargeHeader>
                <Trans>Transaction Failed</Trans>
              </ThemedText.DeprecatedLargeHeader>
            )}
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
