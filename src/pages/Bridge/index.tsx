import React, { useCallback, useContext } from 'react'
import AppBody from '../AppBody'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { Currency, TokenAmount } from 'uniswap-fuse-sdk'
import { RouteComponentProps } from 'react-router-dom'
import { currencyId } from '../../utils/currencyId'
import { useCurrency } from '../../hooks/Tokens'
import { useBridgeActionHandlers, useBridgeState, useDerivedBridgeInfo } from '../../state/bridge/hooks'
import { Field } from '../../state/bridge/actions'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { Wrapper, Logo, ArrowWrapper } from '../../components/bridge/styleds'
import { ArrowDown } from 'react-feather'
import { ThemeContext } from 'styled-components'
import { BottomGrouping } from '../../components/bridge/styleds'
import { ButtonLight, ButtonPrimary, ButtonError } from '../../components/Button'
import { DarkBlueCard } from '../../components/Card'
import fuseLogo from '../../assets/images/fuse-logo-wordmark.svg'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { ROUTER_ADDRESS } from '../../constants'
import { RowBetween } from '../../components/Row'
import { Dots } from '../Pool/styleds'
import { Text } from 'rebass'
import { useActiveWeb3React } from '../../hooks'

export default function Bridge({
  match: {
    params: { inputCurrencyId }
  },
  history
}: RouteComponentProps<{ inputCurrencyId?: string }>) {
  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const inputCurrency = useCurrency(inputCurrencyId)

  const { independentField, typedValue } = useBridgeState()

  const { currencies, currencyBalances, parsedAmounts, inputError } = useDerivedBridgeInfo(inputCurrency ?? undefined)

  const { onFieldInput } = useBridgeActionHandlers()

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

  const [approval, approveCallback] = useApproveCallback(parsedAmounts[Field.INPUT], ROUTER_ADDRESS)

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
                <ButtonError disabled={approval !== ApprovalState.APPROVED} error={!!parsedAmounts[Field.INPUT]}>
                  <Text fontSize={20} fontWeight={500}>
                    {inputError ?? 'Transfer'}
                  </Text>
                </ButtonError>
              </AutoColumn>
            )}
          </BottomGrouping>
        </Wrapper>
      </AppBody>
    </>
  )
}
