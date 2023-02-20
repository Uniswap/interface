import { t } from '@lingui/macro'
import { rgba } from 'polished'
import React from 'react'
import { isMobile } from 'react-device-detect'
import { Star } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Logo from 'components/Logo'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'

import { SuggestionPairData } from './request'
import { isActivePair } from './utils'

const ItemWrapper = styled.div<{ isActive: boolean }>`
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme, isActive }) => (isActive ? rgba(theme.buttonBlack, 0.6) : 'transparent')};
  padding: 1em;
`

const StyledLogo = styled(Logo)`
  width: 20px;
  height: 20px;
  border-radius: 100%;
`

type PropsType = {
  onClickStar: () => void
  onSelectPair: () => void
  data: SuggestionPairData
  isActive: boolean
  amount: string
  isFavorite?: boolean
  isFullFavoritePair?: boolean
  onMouseEnter: () => void
}
export default function SuggestItem({
  data,
  isFavorite,
  isFullFavoritePair,
  isActive,
  amount,
  onClickStar,
  onSelectPair,
  onMouseEnter,
}: PropsType) {
  const theme = useTheme()
  const activeTokens = useAllTokens(true)
  const { account } = useActiveWeb3React()
  const { tokenInSymbol, tokenOutSymbol, tokenInImgUrl, tokenOutImgUrl, tokenInName, tokenOutName } = data

  const handleClickStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClickStar()
  }

  const isTokenNotImport = !isActivePair(activeTokens, data)
  const star = (
    <Star
      fill={isFavorite ? theme.primary : 'none'}
      color={isFavorite ? theme.primary : theme.subText}
      onClick={handleClickStar}
      size={20}
    />
  )
  return (
    <ItemWrapper
      tabIndex={isTokenNotImport ? 0 : undefined}
      className={isTokenNotImport ? 'no-blur' : ''}
      onClick={onSelectPair}
      isActive={isActive && !isMobile}
      onMouseEnter={onMouseEnter}
    >
      <Flex alignItems="center" style={{ gap: 10 }}>
        <Flex alignItems="flex-start" height="100%">
          <StyledLogo style={{ marginRight: 5 }} srcs={[tokenInImgUrl]} alt={tokenInSymbol} />
          <StyledLogo srcs={[tokenOutImgUrl]} alt={tokenOutSymbol} />
        </Flex>
        <div style={{ flex: 1 }}>
          <Text color={theme.text}>
            {amount} {tokenInSymbol} - {tokenOutSymbol}
          </Text>
          <Text color={theme.border} fontSize={14}>
            {tokenInName} - {tokenOutName}
          </Text>
        </div>
      </Flex>
      <Flex height="100%" tabIndex={0} className="no-blur" minWidth={20}>
        {account &&
          (isFullFavoritePair ? (
            <MouseoverTooltipDesktopOnly text={t`You can only favorite up to three token pairs`}>
              {star}
            </MouseoverTooltipDesktopOnly>
          ) : (
            star
          ))}
      </Flex>
    </ItemWrapper>
  )
}
