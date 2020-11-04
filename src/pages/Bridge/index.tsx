import React, { useCallback, useContext, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import AppBody from '../AppBody'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Currency, TokenAmount, ChainId } from '@fuseio/fuse-swap-sdk'
import { RouteComponentProps } from 'react-router-dom'
import { currencyId } from '../../utils/currencyId'
import { useCurrency } from '../../hooks/Tokens'
import { useBridgeActionHandlers, useBridgeState, useDerivedBridgeInfo } from '../../state/bridge/hooks'
import { Field } from '../../state/bridge/actions'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { Wrapper, Logo, ArrowWrapper, Loader } from '../../components/bridge/styleds'
import { ArrowDown } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { BottomGrouping } from '../../components/bridge/styleds'
import { ButtonLight, ButtonPrimary, ButtonError } from '../../components/Button'
import { DarkBlueCard } from '../../components/Card'
import fuseLogo from '../../assets/images/fuse-logo-wordmark.svg'
import loader from '../../assets/svg/loader.svg'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { RowBetween } from '../../components/Row'
import { Dots } from '../Pool/styleds'
import { Text } from 'rebass'
import { useActiveWeb3React } from '../../hooks'
import {
  getForiegnBridgeContract,
  getBridgeHomeAddress,
  getBridgeForeignAddress,
  calculateGasMargin,
  getERC677TokenContract,
  confirmHomeTokenTransfer,
  confirmForeignTokenTransfer,
  waitForTransaction,
  getHomeBridgeContractJsonRpc,
  getForiegnBridgeContractJsonRpc
} from '../../utils'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { FOREIGN_BRIDGE_CHAIN } from '../../constants'
import { useUserActionHandlers } from '../../state/user/hooks'
import fuseApi from '../../api/fuseApi'
import { TYPE } from '../../theme'

export default function Bridge({
  match: {
    params: { inputCurrencyId }
  },
  history
}: RouteComponentProps<{ inputCurrencyId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const inputCurrency = useCurrency(inputCurrencyId)

  const { updateCompletedBridgeTransfer } = useUserActionHandlers()

  const { independentField, typedValue } = useBridgeState()

  const { currencies, currencyBalances, parsedAmounts, inputError } = useDerivedBridgeInfo(inputCurrency ?? undefined)

  const { onFieldInput } = useBridgeActionHandlers()

  // modal and loading
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setAttemptingTxn] = useState<boolean>(false)

  // txn values
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [, setTxHash] = useState<string>('')

  const [loadingText, setLoadingText] = useState<string>('')

  const handleInputCurrencySelect = useCallback(
    (inputCurrency: Currency) => {
      const newInputCurrency = currencyId(inputCurrency)
      history.push(`/bridge/${newInputCurrency}`)
    },
    [history]
  )

  const formattedAmounts = {
    [independentField]: typedValue
  }

  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.INPUT].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [field]: maxAmountSpend(currencyBalances[field])
    }
  }, {})

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.INPUT].reduce((accumulator, field) => {
    return {
      ...accumulator,
      [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0')
    }
  }, {})

  const toggleWalletModal = useWalletModalToggle()

  const isHome = chainId === ChainId.FUSE

  // set bridge and approval address
  const bridgeAddress = isHome ? getBridgeHomeAddress(FOREIGN_BRIDGE_CHAIN) : getBridgeForeignAddress(chainId)
  const approvalAddress = isHome ? inputCurrencyId : bridgeAddress

  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], approvalAddress)

  const addTransaction = useTransactionAdder()

  async function onTransfer() {
    if (!chainId || !library || !account) return

    const { [Field.INPUT]: parsedAmountInput } = parsedAmounts
    if (!parsedAmountInput || !inputCurrencyId) {
      return
    }

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null,
      confirmations: number | null,
      waitingBridgeText: string,
      bridgeOtherSideContract: Contract

    // home
    if (isHome) {
      const contract = getERC677TokenContract(inputCurrencyId, library, account)

      estimate = contract.estimateGas.transferAndCall
      method = contract.transferAndCall
      args = [bridgeAddress, parsedAmountInput.raw.toString(), []]
      value = null
      confirmations = null
      waitingBridgeText = 'Moving Funds to Ethereum'
      bridgeOtherSideContract = getForiegnBridgeContractJsonRpc(chainId)

      // foreign
    } else {
      const contract = getForiegnBridgeContract(chainId, library, account)

      estimate = contract.estimateGas['relayTokens(address,uint256)']
      method = contract['relayTokens(address,uint256)']
      args = [inputCurrencyId, parsedAmountInput.raw.toString()]
      value = null
      confirmations = 2
      waitingBridgeText = 'Moving Funds to Fuse'
      bridgeOtherSideContract = getHomeBridgeContractJsonRpc(chainId)
    }

    setAttemptingTxn(true)

    try {
      const estimatedGas = await estimate(...args, value ? { value } : {})

      setLoadingText('Transfering...')
      const response = await method(...args, {
        ...(value ? { value } : {}),
        gasLimit: calculateGasMargin(estimatedGas)
      })

      // waiting for confirmation
      if (confirmations) {
        await waitForTransaction(response, confirmations, library, (confirmationCount: number) =>
          setLoadingText(`Waiting for ${confirmationCount}/${confirmations} Confirmations`)
        )
      }

      // waiting for bridge
      setLoadingText(waitingBridgeText)

      const listener = async (tokenAddress: string, recipient: string) => {
        const tokenTransferConfirmed = isHome
          ? await confirmHomeTokenTransfer(inputCurrencyId, tokenAddress, library, account)
          : await confirmForeignTokenTransfer(inputCurrencyId, tokenAddress, bridgeOtherSideContract)

        if (recipient === account && tokenTransferConfirmed) {
          bridgeOtherSideContract.removeListener('TokensBridged', listener)

          setAttemptingTxn(false)
          setTxHash(response.hash)
          setLoadingText('')
          onFieldInput('')

          addTransaction(response, {
            summary: 'Transfer ' + currencies[Field.INPUT]?.symbol
          })
          updateCompletedBridgeTransfer()

          // reward account
          if (chainId === ChainId.MAINNET) {
            await fuseApi.fund(account)
          }
        }
      }

      bridgeOtherSideContract.on('TokensBridged', listener)
    } catch (error) {
      setAttemptingTxn(false)

      setLoadingText('')

      if (error?.code !== 4001) {
        console.log(error)
      }
    }
  }

  return (
    <>
      <AppBody>
        <SwapPoolTabs active={'bridge'} />
        <Wrapper id="bridge-page">
          <AutoColumn gap={'md'}>
            <CurrencyInputPanel
              label="Amount"
              value={formattedAmounts[Field.INPUT]}
              onUserInput={onFieldInput}
              onCurrencySelect={handleInputCurrencySelect}
              onMax={() => {
                onFieldInput(maxAmounts[Field.INPUT]?.toExact() ?? '')
              }}
              currency={inputCurrency}
              showMaxButton={!atMaxAmounts[Field.INPUT]}
              id="bridge-input-token"
              showETH={false}
            />
          </AutoColumn>
          <ColumnCenter>
            <ArrowWrapper>
              <ArrowDown size="16" color={theme.text2} />
            </ArrowWrapper>
          </ColumnCenter>
          <DarkBlueCard>
            <Logo src={fuseLogo} alt="fuse logo" />
          </DarkBlueCard>
          <BottomGrouping>
            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap={'md'}>
                {(approval === ApprovalState.NOT_APPROVED ||
                  approval === ApprovalState.PENDING ||
                  approval === ApprovalState.APPROVED) && (
                  <RowBetween>
                    {approval !== ApprovalState.APPROVED && (
                      <ButtonPrimary
                        onClick={approveCallback}
                        disabled={approval === ApprovalState.PENDING}
                        width="100%"
                      >
                        {approval === ApprovalState.PENDING ? (
                          <Dots>Approving {currencies[Field.INPUT]?.symbol}</Dots>
                        ) : (
                          'Approve ' + currencies[Field.INPUT]?.symbol
                        )}
                      </ButtonPrimary>
                    )}
                  </RowBetween>
                )}
                <ButtonError
                  onClick={onTransfer}
                  disabled={approval !== ApprovalState.APPROVED || !!inputError || !!loadingText}
                  error={!loadingText && !!inputError}
                >
                  {loadingText ? (
                    <>
                      <Loader src={loader} />
                      <Text fontSize={20} fontWeight={500}>
                        {loadingText}
                      </Text>
                    </>
                  ) : (
                    <Text fontSize={20} fontWeight={500}>
                      {inputError ?? 'Transfer'}
                    </Text>
                  )}
                </ButtonError>
                <TYPE.body fontSize={14} textAlign="center">
                  Once you transfer your tokens using the bridge you will be gifted FUSE tokens directly to your wallet
                  which will act as network gas. This will allow you to transact freely on FuseSwap
                </TYPE.body>
              </AutoColumn>
            )}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
    </>
  )
}
