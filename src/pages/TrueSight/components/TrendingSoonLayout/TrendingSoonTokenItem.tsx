import React from 'react'
import styled from 'styled-components'
import { darken, rgba } from 'polished'
import { Trans } from '@lingui/macro'

import useTheme from 'hooks/useTheme'
import { Flex, Image, Text } from 'rebass'
import dayjs from 'dayjs'
import Gold from 'assets/svg/gold_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import Bronze from 'assets/svg/bronze_icon.svg'
import { useMedia } from 'react-use'
import { ChevronDown, X } from 'react-feather'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightFilter } from 'pages/TrueSight/index'
import TrendingSoonTokenItemDetailsOnMobile from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItemDetailsOnMobile'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'

const StyledTrendingSoonTokenItem = styled(Flex)<{
  isSelected: boolean
  isHighlightBackground: boolean
}>`
  position: relative;
  padding: 0 20px;
  height: 56px;
  background: ${({ theme, isHighlightBackground }) => (isHighlightBackground ? rgba(theme.bg8, 0.12) : 'transparent')};
  cursor: pointer;
  gap: 16px;

  &:hover {
    background: ${({ theme, isHighlightBackground }) =>
      isHighlightBackground ? darken(0.12, rgba(theme.bg8, 0.12)) : darken(0.05, theme.background)};
  }

  ${({ theme, isHighlightBackground, isSelected }) => theme.mediaWidth.upToLarge`
    &, &:hover {
      background: ${isSelected ? theme.tableHeader : isHighlightBackground ? rgba(theme.bg8, 0.12) : 'transparent'};
    }
  `};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 10px 20px 10.5px;
    height: auto;
  `}
`

export const SelectedHighlight = styled.div`
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.primary};
  height: 40px;
  width: 4px;
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
`

export const TruncatedText = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

export const FieldName = styled(Text)`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  display: flex;
  align-items: center;
`

export const FieldValue = styled(TruncatedText)`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  flex: 1;
  margin-left: 16px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
`

interface TrendingSoonTokenItemProps {
  isSelected: boolean
  tokenIndex?: number
  tokenData: TrueSightTokenData
  onSelect?: () => void
  setIsOpenChartModal: React.Dispatch<React.SetStateAction<boolean>>
  setFilter?: React.Dispatch<React.SetStateAction<TrueSightFilter>>
  isShowMedal: boolean
}

const TrendingSoonTokenItem = ({
  isSelected,
  tokenIndex, // tokenIndex === undefined ==> is show in a modal.
  tokenData,
  onSelect,
  setIsOpenChartModal,
  setFilter,
  isShowMedal,
}: TrendingSoonTokenItemProps) => {
  const theme = useTheme()
  // const date = dayjs(tokenData.discovered_on * 1000).format('YYYY/MM/DD, HH:mm')
  const date = dayjs(tokenData.discovered_on * 1000).format('YYYY/MM/DD')
  const above1200 = useMedia('(min-width: 1200px)')

  const toggleTrendingSoonTokenDetailModal = useToggleModal(ApplicationModal.TRENDING_SOON_TOKEN_DETAIL)

  const MedalIndex = () =>
    isShowMedal && tokenIndex === 1 ? (
      <Image src={Gold} style={{ minWidth: '18px' }} />
    ) : isShowMedal && tokenIndex === 2 ? (
      <Image src={Silver} style={{ minWidth: '18px' }} />
    ) : isShowMedal && tokenIndex === 3 ? (
      <Image src={Bronze} style={{ minWidth: '18px' }} />
    ) : tokenIndex !== undefined ? (
      <Text fontSize="14px" fontWeight={500} color={theme.subText} width="18px" textAlign="center">
        {tokenIndex}
      </Text>
    ) : null

  if (above1200) {
    return (
      <StyledTrendingSoonTokenItem
        justifyContent="space-between"
        alignItems="center"
        isSelected={isSelected}
        isHighlightBackground={isShowMedal && tokenIndex !== undefined && tokenIndex <= 3}
        onClick={onSelect}
      >
        <Flex alignItems="center" style={{ flex: 1 }}>
          <MedalIndex />
          <img
            src={tokenData.logo_url}
            style={{
              minWidth: '16px',
              width: '16px',
              minHeight: '16px',
              height: '16px',
              marginLeft: '16px',
              borderRadius: '50%',
            }}
            alt="logo"
          />
          <TruncatedText
            fontSize="14px"
            fontWeight={500}
            color={isSelected ? theme.primary : theme.subText}
            marginLeft="8px"
          >
            {tokenData.name}
          </TruncatedText>
          <Text fontSize="14px" fontWeight={500} color={theme.disableText} marginLeft="8px">
            {tokenData.symbol}
          </Text>
        </Flex>
        <Text fontSize="12px" color={isSelected ? theme.primary : theme.subText}>
          {date}
        </Text>
        {isSelected && <SelectedHighlight />}
      </StyledTrendingSoonTokenItem>
    )
  }

  return (
    <StyledTrendingSoonTokenItem
      flexDirection="column"
      isSelected={isSelected}
      isHighlightBackground={isShowMedal && tokenIndex !== undefined && tokenIndex <= 3}
    >
      <Flex justifyContent="space-between" alignItems="center" onClick={onSelect} style={{ gap: '16px' }}>
        <Flex alignItems="center">
          <MedalIndex />
          <img
            src={tokenData.logo_url}
            style={{
              minWidth: '24px',
              width: '24px',
              minHeight: '24px',
              height: '24px',
              borderRadius: '50%',
              marginLeft: tokenIndex === undefined ? 'unset' : '16px',
            }}
            alt="logo"
          />
          <Flex flexDirection="column" style={{ gap: '4px', marginLeft: '8px' }}>
            <Flex>
              <TruncatedText fontSize="14px" fontWeight={500} color={theme.subText}>
                {tokenData.name}
              </TruncatedText>
              <Text fontSize="14px" fontWeight={500} color={theme.disableText} marginLeft="8px">
                {tokenData.symbol}
              </Text>
            </Flex>
            <Text fontSize="12px" color={theme.subText}>
              <Trans>Discovered on</Trans>: {date}
            </Text>
          </Flex>
        </Flex>
        {tokenIndex === undefined ? (
          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleTrendingSoonTokenDetailModal}>
            <X size={20} />
          </Flex>
        ) : (
          <ChevronDown size={16} style={{ transform: isSelected ? 'rotate(180deg)' : 'unset', minWidth: '16px' }} />
        )}
      </Flex>
      {isSelected && (
        <TrendingSoonTokenItemDetailsOnMobile
          tokenData={tokenData}
          setIsOpenChartModal={setIsOpenChartModal}
          setFilter={setFilter}
        />
      )}
    </StyledTrendingSoonTokenItem>
  )
}

export default TrendingSoonTokenItem
