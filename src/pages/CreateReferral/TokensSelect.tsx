import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import React, { useState } from 'react'
import { ChevronDown, X } from 'react-feather'
import { Text } from 'rebass'
import styled from 'styled-components'

import CurrencyLogo from 'components/CurrencyLogo'
import Modal from 'components/Modal'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'

const TokensSelectWrapper = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 4px;
  padding: 10px 14px;
  font-weight: 500;
  font-size: 16px;
  color: ${({ theme }) => theme.text};
  text-align: left;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 40px;
`

export default function TokensSelect({
  onClick,
  currency,
  onCurrencySelect,
  onRemoveSelect,
  otherSelectedCurrency,
  ...rest
}: {
  onClick?: () => void
  currency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  onRemoveSelect: () => void
  otherSelectedCurrency?: Currency | null
  style?: React.CSSProperties
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const { chainId } = useActiveWeb3React()
  return (
    <TokensSelectWrapper {...rest} onClick={() => setModalOpen(true)}>
      {currency ? (
        <>
          <CurrencyLogo currency={currency || undefined} size={'20px'} style={{ marginRight: '8px' }} />
          {currency.isNative ? NativeCurrencies[chainId].symbol : currency.symbol}
        </>
      ) : (
        <Text fontSize={15}>
          <Trans>Select a token</Trans>
        </Text>
      )}
      {currency ? (
        <X
          size={20}
          style={{ top: '10px', right: '10px', position: 'absolute' }}
          onClick={(e: any) => {
            e.stopPropagation()
            onRemoveSelect()
          }}
        />
      ) : (
        <ChevronDown size={20} style={{ top: '10px', right: '10px', position: 'absolute' }} />
      )}
      <Modal isOpen={modalOpen} onDismiss={() => setModalOpen(false)}>
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={() => setModalOpen(false)}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={currency}
          otherSelectedCurrency={otherSelectedCurrency}
        />
      </Modal>
    </TokensSelectWrapper>
  )
}
