import { Trans, t } from '@lingui/macro'
import { AlertTriangle, Star } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import { Z_INDEXS } from 'constants/styles'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'

import PairSuggestionItem from './PairSuggestionItem'
import { Container, MAX_FAVORITE_PAIRS } from './index'
import { SuggestionPairData } from './request'
import { isFavoritePair } from './utils'

const Break = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
`

const Title = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.subText};
  margin: 1em 0 1em 0;
`

const MenuFlyout = styled.div<{ showList: boolean; hasShadow?: boolean }>`
  overflow: auto;
  background-color: ${({ theme, showList }) => (showList ? theme.tabActive : theme.background)};
  border-radius: 20px;
  padding: 0;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  top: 55px;
  left: 0;
  right: 0;
  outline: none;
  z-index: ${Z_INDEXS.SUGGESTION_PAIR};
  ${({ hasShadow }) =>
    hasShadow
      ? css`
          box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.16);
          position: absolute;
        `
      : css`
          box-shadow: unset;
          position: unset;
        `};
`

const TextWithIcon = ({ text, icon, color }: { text: string; icon?: JSX.Element; color: string }) => (
  <Container>
    <Flex alignItems="center" style={{ margin: '1em 0' }}>
      {icon}
      <Text style={{ marginLeft: icon ? 7 : 0, color }}>{text}</Text>
    </Flex>
  </Container>
)

export type Props = {
  isFullFavoritePair: boolean
  suggestedAmount: string
  hasShadow?: boolean
  selectedIndex: number
  isShowListPair: boolean
  favoritePairs: SuggestionPairData[]
  suggestedPairs: SuggestionPairData[]
  isSearch: boolean
  onSelectPair: (item: SuggestionPairData) => void
  onClickStar: (item: SuggestionPairData) => void
  onMouseEnterItem: (index: number) => void
}
export default function ListPair({
  isShowListPair,
  isFullFavoritePair,
  hasShadow,
  suggestedAmount,
  favoritePairs,
  suggestedPairs,
  isSearch,
  selectedIndex,
  onSelectPair,
  onClickStar,
  onMouseEnterItem,
}: Props) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const isShowNotfound = isSearch && !suggestedPairs.length && !favoritePairs.length
  const isShowNotfoundFavoritePair = !favoritePairs.length && !isSearch

  return isShowListPair ? (
    <MenuFlyout showList={isShowListPair} tabIndex={0} className="no-blur" hasShadow={hasShadow}>
      {isShowNotfound && (
        <TextWithIcon
          color={theme.subText}
          text={t`We could not find anything. Try again.`}
          icon={<AlertTriangle color={theme.subText} size={17} />}
        />
      )}
      {account && (
        <>
          {!isSearch && (
            <Container>
              <Title>
                <Flex justifyContent="space-between">
                  <Trans>Favourites</Trans>
                  <div>
                    {favoritePairs.length}/{MAX_FAVORITE_PAIRS}
                  </div>
                </Flex>
              </Title>
            </Container>
          )}
          {isShowNotfoundFavoritePair && (
            <TextWithIcon
              color={theme.subText}
              icon={<Star color={theme.subText} size={20} fill={theme.subText} />}
              text={t`Your favourite pairs will appear here`}
            />
          )}
          {favoritePairs.map((item, i) => (
            <PairSuggestionItem
              onSelectPair={() => onSelectPair(item)}
              onClickStar={() => onClickStar(item)}
              amount={suggestedAmount}
              isActive={selectedIndex === i}
              data={item}
              isFavorite
              key={item.tokenIn + item.tokenOut}
              isFullFavoritePair={isFullFavoritePair}
              onMouseEnter={() => onMouseEnterItem(i)}
            />
          ))}
          {!isSearch && <Break />}
        </>
      )}
      {suggestedPairs.length > 0 && (
        <>
          {!isSearch && (
            <Container>
              <Title>
                <Trans>Top traded pairs</Trans>
              </Title>
            </Container>
          )}
          {suggestedPairs.map((item, i) => (
            <PairSuggestionItem
              onSelectPair={() => onSelectPair(item)}
              onClickStar={() => onClickStar(item)}
              amount={suggestedAmount}
              isActive={selectedIndex === favoritePairs.length + i}
              data={item}
              key={item.tokenIn + item.tokenOut + i}
              isFavorite={isFavoritePair(favoritePairs, item)}
              isFullFavoritePair={isFullFavoritePair}
              onMouseEnter={() => onMouseEnterItem(favoritePairs.length + i)}
            />
          ))}
        </>
      )}
      <Break />
      <TextWithIcon color={theme.subText} text={t`Try typing "10 ETH to KNC"`} />
    </MenuFlyout>
  ) : null
}
