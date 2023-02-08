import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { darken, lighten, rgba } from 'polished'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ReactComponent as Lock } from 'assets/svg/ic_lock.svg'
import { ReactComponent as SwitchIcon } from 'assets/svg/switch.svg'
import Card from 'components/Card'
import CurrencyLogo from 'components/CurrencyLogo'
import Wallet from 'components/Icons/Wallet'
import { Input as NumericalInput } from 'components/NumericalInput'
import { RowFixed } from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { shortString } from 'utils/string'

export const InputRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
`

const StyledSwitchIcon = styled(SwitchIcon)<{ selected: boolean }>`
  height: 35%;

  path {
    stroke: ${({ selected, theme }) => (selected ? theme.subText : theme.primary)};
  }
`

export const CurrencySelect = styled.button<{
  tight?: boolean
  selected: boolean
  hideInput?: boolean
  isDisable?: boolean
}>`
  align-items: center;
  height: ${({ hideInput }) => (hideInput ? '2.5rem' : 'unset')};
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  font-size: 20px;
  font-weight: 500;
  background-color: ${({ theme, hideInput }) => (hideInput ? theme.buttonBlack : theme.background)};
  border: 1px solid ${({ theme, selected }) => (selected ? 'transparent' : theme.primary)} !important;
  color: ${({ selected, theme }) => (selected ? theme.subText : theme.primary)};
  border-radius: 999px;
  box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')};
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 6px 8px;
  padding-right: ${({ hideInput, tight }) => (hideInput && !tight ? '8px' : 0)};
  cursor: ${({ isDisable: disabled }) => (disabled ? 'default' : 'pointer')};
  :focus,
  :hover {
    background-color: ${({ selected, hideInput, theme, isDisable: disabled }) =>
      selected
        ? hideInput
          ? darken(disabled ? 0 : 0.05, theme.buttonBlack)
          : lighten(disabled ? 0 : 0.05, theme.background)
        : darken(0.05, theme.primary)};
    color: ${({ selected, theme }) => (selected ? theme.subText : theme.textReverse)};
  }
`

export const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

export const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.bg2)};
  z-index: 1;
`

const FixedContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.buttonGray};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

export const Container = styled.div<{ selected: boolean; hideInput: boolean; error?: boolean; $outline?: boolean }>`
  border-radius: 16px;
  background-color: ${({ theme, hideInput }) => (hideInput ? 'transparent' : theme.buttonBlack)};
  padding: ${({ hideInput }) => (hideInput ? 0 : '0.75rem')};
  ${({ error, theme, $outline }) =>
    error
      ? css`
          border: 1px solid ${theme.red};
        `
      : $outline
      ? css`
          border: 1px solid ${theme.border};
        `
      : ''}
`

export const StyledTokenName = styled.span<{ tight?: boolean; active?: boolean; fontSize?: string }>`
  ${({ tight }) =>
    tight
      ? ''
      : css`
          margin-left: 0.5rem;
        `}
  font-size: ${({ active, fontSize }) => (fontSize ? fontSize : active ? '20px' : '16px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media only screen and (max-width: 445px) {
    max-width: 102px;
  }

  @media only screen and (max-width: 420px) {
    max-width: 76px;
  }
`

const StyledBalanceMax = styled.button`
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  background-color: ${({ theme }) => rgba(theme.subText, 0.2)};
  color: ${({ theme }) => theme.subText};
  border: none;
  border-radius: 999px;
  cursor: pointer;
  &:focus-visible {
    outline-width: 0;
  }
`

const StyledCard = styled(Card)`
  padding: 0 0.25rem 0.5rem;
  text-align: right;
`

const PoolLockContent = (
  <FixedContainer>
    <Flex padding={'0 20px'} sx={{ gap: '16px' }}>
      <Box margin="auto" width="26px">
        <Lock />
      </Box>
      <Text fontSize="12px" textAlign="left" padding="8px 16px" lineHeight={'16px'}>
        <Trans>
          The price of the pool is outside your selected price range and hence you can only deposit a single token. To
          see more options, update the price range.
        </Trans>
      </Text>
    </Flex>
  </FixedContainer>
)

interface CurrencyInputPanelProps {
  value: string
  onMax: (() => void) | null
  onHalf: (() => void) | null
  onUserInput?: (value: string) => void
  onFocus?: () => void
  onClickSelect?: () => void
  positionMax?: 'inline' | 'top'
  label?: ReactNode
  positionLabel?: 'in' | 'out'
  onCurrencySelect?: (currency: Currency) => void
  onSwitchCurrency?: () => void
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  hideInput?: boolean
  disabledInput?: boolean
  otherCurrency?: Currency | null
  id: string
  showCommonBases?: boolean
  customBalanceText?: string
  hideLogo?: boolean
  fontSize?: string
  customCurrencySelect?: ReactNode
  estimatedUsd?: string
  isSwitchMode?: boolean
  locked?: boolean
  maxCurrencySymbolLength?: number
  error?: boolean
  maxLength?: number
  outline?: boolean
  filterWrap?: boolean
  loadingText?: string
  lockIcon?: boolean
  tight?: boolean
}

export default function CurrencyInputPanel({
  value,
  error,
  onUserInput,
  onMax,
  onHalf,
  positionMax = 'inline',
  label = '',
  positionLabel = 'out',
  onCurrencySelect,
  onSwitchCurrency,
  onFocus,
  onClickSelect,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  hideInput = false,
  disabledInput = false,
  otherCurrency,
  id,
  showCommonBases,
  customBalanceText,
  hideLogo = false,
  fontSize,
  customCurrencySelect,
  estimatedUsd,
  isSwitchMode = false,
  locked = false,
  maxCurrencySymbolLength,
  maxLength,
  outline,
  filterWrap,
  lockIcon = false, // lock when need approve
  tight: tightProp,
  loadingText,
}: CurrencyInputPanelProps) {
  const tight = Boolean(tightProp && !currency)
  const [modalOpen, setModalOpen] = useState(false)
  const { chainId, account } = useActiveWeb3React()

  const selectedCurrencyBalance = useCurrencyBalance(currency ?? undefined)
  const balanceRef = useRef(selectedCurrencyBalance?.toSignificant(10))

  useEffect(() => {
    balanceRef.current = undefined
  }, [chainId])

  // Keep previous value of balance if rpc node was down
  useEffect(() => {
    if (!!selectedCurrencyBalance) balanceRef.current = selectedCurrencyBalance.toSignificant(10)
    if (!currency || !account) balanceRef.current = '0'
  }, [selectedCurrencyBalance, currency, account])

  const theme = useTheme()

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)

  return (
    <div style={{ width: '100%' }}>
      {label && positionLabel === 'out' && (
        <StyledCard borderRadius={'20px'}>
          <Flex justifyContent={'space-between'} alignItems="center">
            <Text fontSize={12} color={theme.subText} fontWeight={500}>
              {label}:
            </Text>
          </Flex>
        </StyledCard>
      )}
      <InputPanel id={id} hideInput={hideInput}>
        {locked && PoolLockContent}
        <Container hideInput={hideInput} selected={disableCurrencySelect} error={error} $outline={outline}>
          {!hideBalance && (
            <Flex justifyContent="space-between" fontSize="12px" marginBottom="12px" alignItems="center">
              {label && positionLabel === 'in' ? (
                label
              ) : (onMax || onHalf) && positionMax === 'top' && currency && account ? (
                <Flex alignItems="center" sx={{ gap: '4px' }}>
                  {onMax && (
                    <StyledBalanceMax onClick={onMax}>
                      <Trans>Max</Trans>
                    </StyledBalanceMax>
                  )}
                  {onHalf && (
                    <StyledBalanceMax onClick={onHalf}>
                      <Trans>Half</Trans>
                    </StyledBalanceMax>
                  )}
                </Flex>
              ) : (
                <div />
              )}
              <Flex onClick={onMax ?? undefined} style={{ cursor: onMax ? 'pointer' : undefined }} alignItems="center">
                <Wallet color={theme.subText} />
                <Text fontWeight={500} color={theme.subText} marginLeft="4px">
                  {customBalanceText || selectedCurrencyBalance?.toSignificant(10) || balanceRef.current || 0}
                </Text>
              </Flex>
            </Flex>
          )}
          <InputRow>
            {!hideInput && (
              <>
                <NumericalInput
                  error={error}
                  className="token-amount-input"
                  value={value}
                  disabled={disabledInput}
                  maxLength={maxLength}
                  onUserInput={onUserInput}
                  onFocus={onFocus}
                />
                {estimatedUsd ? (
                  <Text fontSize="0.875rem" marginRight="8px" fontWeight="500" color={theme.border}>
                    ~{estimatedUsd}
                  </Text>
                ) : (
                  account &&
                  currency &&
                  onMax &&
                  positionMax === 'inline' && (
                    <StyledBalanceMax onClick={onMax ?? undefined}>
                      <Trans>MAX</Trans>
                    </StyledBalanceMax>
                  )
                )}
                {lockIcon && <Lock color={theme.subText} style={{ marginRight: 8, height: 16 }} />}
              </>
            )}
            {customCurrencySelect || (
              <CurrencySelect
                isDisable={disableCurrencySelect}
                hideInput={hideInput}
                selected={!!currency}
                className="open-currency-select-button"
                onClick={() => {
                  if (disableCurrencySelect) return
                  if (!isSwitchMode) {
                    setModalOpen(true)
                  } else if (isSwitchMode && onSwitchCurrency) {
                    onSwitchCurrency()
                  }
                  onClickSelect?.()
                }}
                tight={tight}
              >
                <Aligner>
                  <RowFixed>
                    {currency && !hideLogo ? <CurrencyLogo currency={currency} size={'20px'} /> : null}
                    <StyledTokenName
                      tight={tight}
                      className="token-symbol-container"
                      active={Boolean(currency && currency.symbol)}
                      fontSize={tight ? '14px' : fontSize}
                      style={{ paddingRight: disableCurrencySelect ? '8px' : 0 }}
                    >
                      {(nativeCurrency?.symbol && maxCurrencySymbolLength
                        ? shortString(nativeCurrency.symbol, maxCurrencySymbolLength)
                        : nativeCurrency?.symbol) ||
                        loadingText || <Trans>Select a token</Trans>}
                    </StyledTokenName>
                  </RowFixed>
                  {!disableCurrencySelect && !isSwitchMode && (
                    <DropdownSVG style={{ marginLeft: tight ? '-8px' : undefined }} />
                  )}
                  {!disableCurrencySelect && isSwitchMode && <StyledSwitchIcon selected={!!currency} />}
                </Aligner>
              </CurrencySelect>
            )}
          </InputRow>
        </Container>
        {!disableCurrencySelect && !isSwitchMode && onCurrencySelect && (
          <CurrencySearchModal
            isOpen={modalOpen}
            onDismiss={handleDismissSearch}
            onCurrencySelect={onCurrencySelect}
            selectedCurrency={currency}
            otherSelectedCurrency={otherCurrency}
            showCommonBases={showCommonBases}
            filterWrap={filterWrap}
          />
        )}
      </InputPanel>
    </div>
  )
}
