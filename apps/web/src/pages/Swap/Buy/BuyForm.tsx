import { ChainId } from '@uniswap/sdk-core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { buildCurrencyInfo } from 'constants/routing'
import { nativeOnChain } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { useActiveLocalCurrencyComponents } from 'hooks/useActiveLocalCurrency'
import { useUSDTokenUpdater } from 'hooks/useUSDTokenUpdater'
import { PredefinedAmount } from 'pages/Swap/Buy/PredefinedAmount'
import {
  NumericalInputMimic,
  NumericalInputSymbolContainer,
  NumericalInputWrapper,
  StyledNumericalInput,
  useWidthAdjustedDisplayValue,
} from 'pages/Swap/common/shared'
import { useCallback, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import styled from 'styled-components'
import { Text } from 'ui/src/components/text/Text'
import { FiatOnRampCountryPicker } from 'uniswap/src/features/fiatOnRamp/FiatOnRampCountryPicker'
import { SelectTokenButton } from 'uniswap/src/features/fiatOnRamp/SelectTokenButton'
import { FiatOnRampCurrency } from 'uniswap/src/features/fiatOnRamp/types'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { InterfacePageNameLocal } from 'uniswap/src/features/telemetry/constants'
import useResizeObserver from 'use-resize-observer'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const InputWrapper = styled(Column)`
  position: relative;
  background-color: ${({ theme }) => theme.surface2};
  padding: 16px;
  height: 312px;
  align-items: center;
  border-radius: 20px;
  justify-content: center;
  overflow: hidden;
  gap: 16px;
`

const HeaderRow = styled(Row)`
  align-items: center;
  justify-content: space-between;
  position: absolute;
  top: 16px;
  left: 16px;
  width: calc(100% - 32px);
`

const PREDEFINED_AMOUNTS = [100, 300, 1000]
const ethCurrencyInfo = buildCurrencyInfo(nativeOnChain(ChainId.MAINNET))

type BuyFormProps = {
  disabled?: boolean
}

export function BuyForm({ disabled }: BuyFormProps) {
  const { isConnected } = useAccount()
  const accountDrawer = useAccountDrawer()
  const { formatNumberOrString } = useFormatter()
  const { symbol: fiatSymbol } = useActiveLocalCurrencyComponents()
  const [inputAmount, setInputAmount] = useState<string>('')
  const [quoteCurrency, setQuoteCurrency] = useState<FiatOnRampCurrency>({
    currencyInfo: ethCurrencyInfo,
    meldCurrencyCode: 'ETH',
  })
  const postWidthAdjustedDisplayValue = useWidthAdjustedDisplayValue(inputAmount)
  const hiddenObserver = useResizeObserver<HTMLElement>()
  const exactAmountOut = useUSDTokenUpdater(true /* inputInFiat */, inputAmount, quoteCurrency?.currencyInfo?.currency)
  const buyButtonState = useMemo(() => {
    if (!isConnected) {
      return {
        label: <Trans i18nKey="common.connectWallet.button" />,
        disabled: false,
        onClick: accountDrawer.open,
        Component: ButtonLight,
      }
    }
    if (!inputAmount) {
      return {
        label: <Trans i18nKey="common.noAmount.error" />,
        disabled: true,
        onClick: undefined,
        Component: ButtonPrimary,
      }
    }

    return {
      label: <Trans i18nKey="common.continue.button" />,
      disabled: false,
      Component: ButtonPrimary,
      onClick: () => {
        // TODO: open "choose FOR provider" modal
      },
    }
  }, [accountDrawer.open, inputAmount, isConnected])

  const handleUserInput = useCallback((newValue: string) => {
    setInputAmount(newValue)
  }, [])

  return (
    <Trace page={InterfacePageNameLocal.Buy}>
      <Column gap="xs">
        <InputWrapper>
          <HeaderRow>
            <Text variant="body3" userSelect="none" color="$neutral2">
              <Trans i18nKey="common.youreBuying" />
            </Text>
            <FiatOnRampCountryPicker
              onPress={function (): void {
                // TODO: open country picker modal
              }}
              // TODO: get country code from user's location
              countryCode="US"
            />
          </HeaderRow>
          <NumericalInputWrapper>
            <NumericalInputSymbolContainer showPlaceholder={!inputAmount}>{fiatSymbol}</NumericalInputSymbolContainer>
            <StyledNumericalInput
              value={postWidthAdjustedDisplayValue}
              disabled={disabled}
              onUserInput={handleUserInput}
              placeholder="0"
              $width={inputAmount && hiddenObserver.width ? hiddenObserver.width + 1 : undefined}
              maxDecimals={6}
            />
            <NumericalInputMimic ref={hiddenObserver.ref}>{inputAmount}</NumericalInputMimic>
          </NumericalInputWrapper>
          <SelectTokenButton
            onPress={() => {
              // TODO: open currency selector modal and call setQuoteCurrency
              setQuoteCurrency({
                currencyInfo: ethCurrencyInfo,
                meldCurrencyCode: 'ETH',
              })
            }}
            selectedCurrencyInfo={quoteCurrency.currencyInfo ?? ethCurrencyInfo}
            formattedAmount={formatNumberOrString({
              input: exactAmountOut || '0',
              type: NumberType.TokenNonTx,
            })}
            showCaret={false}
            disabled={disabled}
          />
          <Row gap="md" justify="center">
            {PREDEFINED_AMOUNTS.map((amount: number) => (
              <PredefinedAmount
                onClick={() => {
                  setInputAmount(amount.toString())
                }}
                key={amount}
                amount={amount}
                currentAmount={inputAmount}
                disabled={disabled}
              />
            ))}
          </Row>
        </InputWrapper>
        <buyButtonState.Component fontWeight={535} disabled={buyButtonState.disabled} onClick={buyButtonState.onClick}>
          {buyButtonState.label}
        </buyButtonState.Component>
      </Column>
    </Trace>
  )
}
