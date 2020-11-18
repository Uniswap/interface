import React, { useCallback, useContext, useState } from 'react'
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
import { getBridgeHomeAddress, getBridgeForeignAddress, isBasicBridgeToken } from '../../utils'
import { FOREIGN_BRIDGE_CHAIN, UNSUPPORTED_BRIDGE_TOKENS } from '../../constants'
import { TYPE } from '../../theme'
import UnsupportedBridgeTokenModal from '../../components/UnsupportedBridgeTokenModal'
import { useUserActionHandlers } from '../../state/user/hooks'
import fuseApi from '../../api/fuseApi'

export default function Bridge({
  match: {
    params: { inputCurrencyId }
  },
  history
}: RouteComponentProps<{ inputCurrencyId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const inputCurrency = useCurrency(inputCurrencyId, 'Bridge')

  const { independentField, typedValue } = useBridgeState()

  const { currencies, currencyBalances, parsedAmounts, inputError, bridgeTransactionStatus } = useDerivedBridgeInfo(
    inputCurrency ?? undefined
  )

  const { updateCompletedBridgeTransfer } = useUserActionHandlers()

  const { onFieldInput, transferToHome, transferToForeign } = useBridgeActionHandlers()

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

  const { isHome, isForeign } = useChain()

  const bridgeAddress = isHome ? getBridgeHomeAddress(FOREIGN_BRIDGE_CHAIN) : getBridgeForeignAddress(chainId)
  const approvalAddress = isHome ? inputCurrencyId : bridgeAddress

  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], approvalAddress)

  async function onTransfer() {
    if (!chainId || !library || !account) return

    try {
      const { [Field.INPUT]: parsedAmountInput } = parsedAmounts
      const symbol = currencies[Field.INPUT]?.symbol ?? ''
      const isMultiBridge = !isBasicBridgeToken(inputCurrencyId)

      if (!parsedAmountInput || !inputCurrencyId) {
        return
      }
      if (isHome) {
        await transferToForeign(inputCurrencyId, bridgeAddress, parsedAmountInput, symbol, isMultiBridge)
      } else {
        await transferToHome(inputCurrencyId, parsedAmountInput, symbol, isMultiBridge)

        if (isForeign) {
          await fuseApi.fund(account)
        }
      }

      onFieldInput('')
      updateCompletedBridgeTransfer()
    } catch (error) {
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
              showETH={false}
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
              </AutoColumn>
            )}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
    </>
  )
}
