import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { rgba } from 'polished'
import { useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Edit2, XCircle } from 'react-feather'
import styled from 'styled-components'

import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { AutoRow } from 'components/Row'
import useTheme from 'hooks/useTheme'

import { getDisplayTokenInfo } from './CurrencyList'

const HEIGHT_THRESHOLD = 400
const BaseWrapper = styled.div`
  padding: 6px;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 10px;
  display: flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  gap: 8px;
  @media only screen and (max-height: ${HEIGHT_THRESHOLD}px) {
    padding: 4px 5px;
    gap: 5px;
  }
  &[data-selected='true'] {
    background-color: ${({ theme }) => rgba(theme.primary, 0.15)};
  }
  @media (hover: hover) {
    :hover {
      background-color: ${({ theme }) => theme.buttonBlack};
      > .close-btn {
        display: block;
      }
    }
  }
`

const TokenName = styled.div`
  font-weight: 500;
  font-size: 16px;
  @media only screen and (max-height: ${HEIGHT_THRESHOLD}px) {
    font-size: 14px;
  }
`

const CloseBtn = styled(XCircle)<{ $forceShow: boolean }>`
  position: absolute;
  display: none;
  right: -5px;
  top: -5px;
  color: ${({ theme }) => theme.subText};
  display: ${({ $forceShow }) => ($forceShow ? 'block' : 'none')};
`

export default function CommonBases({
  onSelect,
  selectedCurrency,
  tokens = [],
  handleToggleFavorite,
}: {
  selectedCurrency?: Currency | null
  tokens: Currency[]
  onSelect: (currency: Currency) => void
  handleToggleFavorite: (e: React.MouseEvent, currency: Currency) => void
}) {
  const theme = useTheme()
  const [isEditMode, setEditMode] = useState(false)
  const isHeightSmall = window.outerHeight < HEIGHT_THRESHOLD
  if (!tokens.length) return null
  return (
    <AutoColumn gap="md">
      <AutoRow gap="4px">
        {(tokens as Token[]).map((token: Token) => {
          const selected = selectedCurrency instanceof Token && selectedCurrency.address === token.address
          const { symbol } = getDisplayTokenInfo(token)
          return (
            <BaseWrapper
              onClick={() => !selected && onSelect(token)}
              data-selected={selected}
              key={(token.address || token?.wrapped?.address) + token.symbol}
            >
              <CurrencyLogo currency={token} size={isHeightSmall ? '15px' : '20px'} />
              <TokenName>{symbol}</TokenName>
              <CloseBtn
                $forceShow={isEditMode}
                className="close-btn"
                size={16}
                onClick={e => handleToggleFavorite(e, token)}
              />
            </BaseWrapper>
          )
        })}
        {isMobile && (
          <BaseWrapper
            style={{ width: isHeightSmall ? 28 : 35, padding: isHeightSmall ? 5 : 8 }}
            onClick={() => {
              setEditMode(prev => !prev)
            }}
          >
            <Edit2 size={isHeightSmall ? 14 : 16} color={theme.subText} />
          </BaseWrapper>
        )}
      </AutoRow>
    </AutoColumn>
  )
}
