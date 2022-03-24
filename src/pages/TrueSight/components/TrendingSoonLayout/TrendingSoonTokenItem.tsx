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
import { ChevronDown } from 'react-feather'
import { ButtonOutlined } from 'components/Button'
import Tags from 'pages/TrueSight/components/Tags'
import Divider from 'components/Divider'
import { ExternalLink } from 'theme'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import CommunityButton from 'pages/TrueSight/components/CommunityButton'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import { ReactComponent as BarChartIcon } from 'assets/svg/bar_chart_icon.svg'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { formattedNum } from 'utils'
import { TrueSightFilter } from 'pages/TrueSight/index'

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
`

export const FieldValue = styled(TruncatedText)`
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.text};
  flex: 1;
  margin-left: 16px;
  text-align: right;
`

interface TrendingSoonTokenItemProps {
  isSelected: boolean
  tokenIndex: number
  tokenData: TrueSightTokenData
  onSelect: () => void
  setIsOpenChartModal: React.Dispatch<React.SetStateAction<boolean>>
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}

const TrendingSoonTokenItem = ({
  isSelected,
  tokenIndex,
  tokenData,
  onSelect,
  setIsOpenChartModal,
  setFilter,
}: TrendingSoonTokenItemProps) => {
  const theme = useTheme()
  const date = dayjs(tokenData.discovered_on * 1000).format('YYYY/MM/DD')
  const above1200 = useMedia('(min-width: 1200px)')

  const MedalIndex = () =>
    tokenIndex === 1 ? (
      <Image src={Gold} style={{ minWidth: '18px' }} />
    ) : tokenIndex === 2 ? (
      <Image src={Silver} style={{ minWidth: '18px' }} />
    ) : tokenIndex === 3 ? (
      <Image src={Bronze} style={{ minWidth: '18px' }} />
    ) : (
      <Text fontSize="14px" fontWeight={500} color={theme.subText} width="18px" textAlign="center">
        {tokenIndex}
      </Text>
    )

  if (above1200) {
    return (
      <StyledTrendingSoonTokenItem
        justifyContent="space-between"
        alignItems="center"
        isSelected={isSelected}
        isHighlightBackground={tokenIndex <= 3}
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
          <Trans>Discovered on</Trans> {date}
        </Text>
        {isSelected && <SelectedHighlight />}
      </StyledTrendingSoonTokenItem>
    )
  }

  return (
    <StyledTrendingSoonTokenItem flexDirection="column" isSelected={isSelected} isHighlightBackground={tokenIndex <= 3}>
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
              marginLeft: '16px',
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
        <ChevronDown size={16} style={{ transform: isSelected ? 'rotate(180deg)' : 'unset', minWidth: '16px' }} />
      </Flex>
      {isSelected && (
        <>
          <Flex style={{ gap: '20px', marginTop: '4px' }}>
            <ButtonOutlined
              height="36px"
              fontSize="14px"
              padding="0"
              flex="1"
              onClick={() => setIsOpenChartModal(true)}
            >
              <BarChartIcon />
              <span style={{ marginLeft: '6px' }}>
                <Trans>View chart</Trans>
              </span>
            </ButtonOutlined>
            <SwapButtonWithOptions
              platforms={tokenData.platforms}
              style={{ flex: 1, padding: 0, minWidth: 'unset' }}
              tokenData={tokenData}
            />
          </Flex>

          <Flex flexDirection="column" style={{ gap: '16px', marginTop: '4px' }}>
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Tag</Trans>
              </FieldName>
              <Tags tags={tokenData.tags} style={{ justifyContent: 'flex-end' }} setFilter={setFilter} />
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Price</Trans>
              </FieldName>
              <FieldValue>{formattedNum(tokenData.price.toString(), true)}</FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Trading Volume (24H)</Trans>
              </FieldName>
              <FieldValue>{formattedNum(tokenData.trading_volume.toString(), true)}</FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Market Cap</Trans>
              </FieldName>
              <FieldValue>
                {tokenData.market_cap <= 0 ? '--' : formattedNum(tokenData.market_cap.toString(), true)}
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Holders</Trans>
              </FieldName>
              <FieldValue>
                {tokenData.number_holders <= 0 ? '--' : formattedNum(tokenData.number_holders.toString(), false)}
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Website</Trans>
              </FieldName>
              <FieldValue as={ExternalLink} target="_blank" href={tokenData.official_web}>
                <Trans>{tokenData.official_web} ↗</Trans>
              </FieldValue>
            </Flex>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <CommunityButton communityOption={tokenData.social_urls} />
              <AddressButton platforms={tokenData.platforms} />
            </Flex>
          </Flex>
        </>
      )}
    </StyledTrendingSoonTokenItem>
  )
}

export default TrendingSoonTokenItem
