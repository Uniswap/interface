import React, { useCallback, useContext, useState } from 'react'
import * as Sentry from '@sentry/react'
import AppBody from '../AppBody'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Currency, TokenAmount } from '@fuseio/fuse-swap-sdk'
import { RouteComponentProps } from 'react-router-dom'
import { currencyId } from '../../utils/currencyId'
import { useCurrency } from '../../hooks/Tokens'
import {
  useBridgeActionHandlers,
  useBridgeState,
  useDerivedBridgeInfo,
  useBridgeStatus
} from '../../state/bridge/hooks'
import { Field } from '../../state/bridge/actions'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { Wrapper, Logo, ArrowWrapper, Loader } from '../../components/bridge/styleds'
import { ArrowDown } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { BottomGrouping } from '../../components/bridge/styleds'
import { ButtonLight, ButtonPrimary, ButtonError } from '../../components/Button'
import { DarkBlueCard } from '../../components/Card'
import ethLogo from '../../assets/images/ethereum-logo.png'
import fuseLogo from '../../assets/images/fuse-logo-wordmark.svg'
import loader from '../../assets/svg/loader.svg'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { RowBetween } from '../../components/Row'
import { Dots } from '../Pool/styleds'
import { Text } from 'rebass'
import { useActiveWeb3React, useChain } from '../../hooks'
import { getHomeMultiErc20ToErc677BridgeAddress, getForeignMultiErc20ToErc677BridgeAddress } from '../../utils'
import { UNSUPPORTED_BRIDGE_TOKENS } from '../../constants'
import { TYPE, ExternalLink } from '../../theme'
import UnsupportedBridgeTokenModal from '../../components/UnsupportedBridgeTokenModal'
import { useUserActionHandlers } from '../../state/user/hooks'
import fuseApi from '../../api/fuseApi'
import { getBridgeMode } from '../../state/bridge/bridges/utils'
import TokenBridge, { BridgeMode } from '../../state/bridge/bridges/tokenBridge'
import NativeToErcBridge from '../../state/bridge/bridges/nativeToErc'
import Erc677ToErc677Bridge from '../../state/bridge/bridges/erc677Toerc677'
import Erc20ToErc677Bridge from '../../state/bridge/bridges/erc20Toerc677'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../../state'
import { useTransactionAdder } from '../../state/transactions/hooks'
import BridgeDetails from '../../components/bridge/BridgeDetails'

export default function Bridge({
  match: {
    params: { inputCurrencyId }
  },
  history
}: RouteComponentProps<{ inputCurrencyId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const dispatch = useDispatch<AppDispatch>()

  const inputCurrency = useCurrency(inputCurrencyId, 'Bridge')

  const { independentField, typedValue } = useBridgeState()

  const {
    currencies,
    currencyBalances,
    parsedAmounts,
    inputError,
    bridgeTransactionStatus,
    bridgeFee
  } = useDerivedBridgeInfo(inputCurrencyId)

  const { updateCompletedBridgeTransfer } = useUserActionHandlers()

  const { onFieldInput } = useBridgeActionHandlers()

  // modal and loading
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  const handleInputCurrencySelect = useCallback(
    (inputCurrency: Currency) => {
      if (inputCurrency.symbol && UNSUPPORTED_BRIDGE_TOKENS.includes(inputCurrency.symbol)) {
        setModalOpen(true)
        return
      }

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

  const { isHome, isEtheruem } = useChain()

  const bridgeAddress = isHome ? getHomeMultiErc20ToErc677BridgeAddress() : getForeignMultiErc20ToErc677BridgeAddress()
  const approvalAddress = isHome ? inputCurrencyId : bridgeAddress

  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], approvalAddress)

  const addTransaction = useTransactionAdder()

  async function onTransfer() {
    if (!chainId || !library || !account || !inputCurrency?.symbol) return

    try {
      const { [Field.INPUT]: parsedAmountInput } = parsedAmounts

      if (!parsedAmountInput || !inputCurrencyId) {
        return
      }

      const mode = getBridgeMode(inputCurrencyId)

      let bridge: TokenBridge
      switch (mode) {
        case BridgeMode.NATIVE_TO_ERC:
          bridge = new NativeToErcBridge(
            inputCurrencyId,
            inputCurrency.symbol,
            parsedAmountInput,
            library,
            chainId,
            account,
            dispatch,
            isHome,
            addTransaction
          )
          break
        case BridgeMode.ERC677_TO_ERC677:
          bridge = new Erc677ToErc677Bridge(
            inputCurrencyId,
            inputCurrency.symbol,
            parsedAmountInput,
            library,
            chainId,
            account,
            dispatch,
            isHome,
            addTransaction
          )
          break
        case BridgeMode.ERC20_TO_ERC677:
          bridge = new Erc20ToErc677Bridge(
            inputCurrencyId,
            inputCurrency.symbol,
            parsedAmountInput,
            library,
            chainId,
            account,
            dispatch,
            isHome,
            addTransaction,
            bridgeAddress
          )
          break
      }

      await bridge.executeTransaction()

      if (isEtheruem) {
        await fuseApi.fund(account)
      }

      onFieldInput('')
      updateCompletedBridgeTransfer()
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          section: 'Bridge'
        }
      })

      console.log(error)
    }
  }

  const bridgeStatus = useBridgeStatus(bridgeTransactionStatus)

  return (
    <>
      <AppBody>
        <SwapPoolTabs active={'bridge'} />
        <Wrapper id="bridge-page">
          <UnsupportedBridgeTokenModal isOpen={modalOpen} setIsOpen={setModalOpen} />
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
              showETH={isHome}
              listType="Bridge"
            />
          </AutoColumn>
          <ColumnCenter>
            <ArrowWrapper>
              <ArrowDown size="16" color={theme.text2} />
            </ArrowWrapper>
          </ColumnCenter>
          {isHome ? (
            <DarkBlueCard padding="0.75rem 1.25rem">
              <Logo src={ethLogo} style={{ width: 45 }} alt="eth logo" />
            </DarkBlueCard>
          ) : (
            <DarkBlueCard>
              <Logo src={fuseLogo} alt="fuse logo" />
            </DarkBlueCard>
          )}
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
                  id="bridge-transfer-button"
                  onClick={onTransfer}
                  disabled={approval !== ApprovalState.APPROVED || !!inputError || !!bridgeStatus}
                  error={approval !== ApprovalState.APPROVED || (!bridgeStatus && !!inputError)}
                >
                  {bridgeStatus ? (
                    <>
                      <Loader src={loader} />
                      <Text fontSize={20} fontWeight={500}>
                        {bridgeStatus}
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
                <TYPE.body fontSize={14} textAlign="center">
                  <ExternalLink
                    target="_blank"
                    href="https://docs.fuse.io/fuseswap/bridge-fuse-erc20-tokens"
                    style={{ color: theme.secondary1 }}
                  >
                    Click here
                  </ExternalLink>{' '}
                  to learn how to bridge tokens
                </TYPE.body>
              </AutoColumn>
            )}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
      <BridgeDetails amount={formattedAmounts[Field.INPUT]} currency={inputCurrency} bridgeFee={bridgeFee} />
    </>
  )
}
