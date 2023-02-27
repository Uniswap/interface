import dayjs from 'dayjs'
import { darken, rgba } from 'polished'
import React from 'react'
import { ChevronDown, X } from 'react-feather'
import { useMedia } from 'react-use'
import { Box, Flex, Image, Text } from 'rebass'
import styled from 'styled-components'

import Bronze from 'assets/svg/bronze_icon.svg'
import Gold from 'assets/svg/gold_icon.svg'
import Silver from 'assets/svg/silver_icon.svg'
import useTheme from 'hooks/useTheme'
import TrendingSoonTokenItemDetailsOnMobile from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItemDetailsOnMobile'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightFilter } from 'pages/TrueSight/index'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

const StyledTrendingSoonTokenItem = styled(Flex)`
  position: relative;
  padding: 0 20px;
  height: 56px;
  cursor: pointer;
  gap: 16px;

  &[data-rank='1'] {
    background: linear-gradient(
      90deg,
      rgba(255, 204, 102, 0.25) 0%,
      rgba(255, 204, 102, 0) 54.69%,
      rgba(255, 204, 102, 0) 100%
    );
  }

  &[data-rank='2'] {
    background: linear-gradient(
      90deg,
      rgba(224, 224, 224, 0.25) 0%,
      rgba(224, 224, 224, 0) 54.69%,
      rgba(224, 224, 224, 0) 100%
    );
  }

  &[data-rank='3'] {
    background: linear-gradient(
      90deg,
      rgba(255, 152, 56, 0.25) 0%,
      rgba(255, 152, 56, 0) 54.69%,
      rgba(255, 152, 56, 0) 100%
    );
  }

  @media (hover: hover) {
    &:hover {
      background: ${({ theme }) => darken(0.05, theme.background)};
    }
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 10px 20px 10.5px;
    height: auto;

    &[data-selected='true'] {
      background: ${({ theme }) => theme.tableHeader};
      @media (hover: hover) {
        &:hover {
          background: ${({ theme }) => theme.tableHeader};
        }
      }
    }
  `}
`

const SelectedHighlight = styled.div`
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
  const above1201 = useMedia('(min-width: 1201px)')

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

  if (above1201) {
    return (
      <StyledTrendingSoonTokenItem
        justifyContent="space-between"
        alignItems="center"
        onClick={onSelect}
        data-rank={isShowMedal && tokenIndex}
        data-selected={isSelected}
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
          <Text fontSize="14px" fontWeight={500} color={theme.border} marginLeft="8px">
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
      data-rank={isShowMedal && tokenIndex}
      data-selected={isSelected}
    >
      <Flex justifyContent="space-between" alignItems="center" onClick={onSelect} style={{ gap: '16px' }}>
        <Flex
          alignItems="center"
          justifyContent={'space-between'}
          flex={1}
          sx={{
            columnGap: '4px',
          }}
        >
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
              alt={tokenData.name}
            />
            <Box marginLeft={'8px'}>
              <TruncatedText fontSize="14px" fontWeight={400} color={theme.text}>
                {tokenData.name}
              </TruncatedText>
            </Box>
          </Flex>

          <Flex alignItems="center" flex="0 0 fit-content">
            <Text fontSize="14px" fontWeight={400} color={theme.text}>
              {date}
            </Text>
          </Flex>
        </Flex>
        {tokenIndex === undefined ? (
          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleTrendingSoonTokenDetailModal}>
            <X size={20} />
          </Flex>
        ) : (
          <Flex
            width="28px"
            height="28px"
            justifyContent={'center'}
            alignItems="center"
            sx={{
              backgroundColor: rgba(theme.subText, 0.2),
              borderRadius: '999px',
              color: theme.text,
            }}
          >
            <ChevronDown
              size={18}
              style={{ transform: isSelected ? 'rotate(180deg)' : 'unset', transition: 'transform 150ms ease-in-out' }}
            />
          </Flex>
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
