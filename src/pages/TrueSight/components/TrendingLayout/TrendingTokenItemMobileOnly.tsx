import React from 'react'
import styled from 'styled-components'
import { rgba } from 'polished'
import { Trans } from '@lingui/macro'

import useTheme from 'hooks/useTheme'
import { Box, Flex, Text } from 'rebass'
import dayjs from 'dayjs'
import { ChevronDown } from 'react-feather'
import { ButtonOutlined } from 'components/Button'
import Tags from 'pages/TrueSight/components/Tags'
import Divider from 'components/Divider'
import { ExternalLink } from 'theme'
import AddressButton from 'pages/TrueSight/components/AddressButton'
import CommunityButton from 'pages/TrueSight/components/CommunityButton'
import SwapButtonWithOptions from 'pages/TrueSight/components/SwapButtonWithOptions'
import { ReactComponent as BarChartIcon } from 'assets/svg/bar_chart_icon.svg'
import { formattedNumLong } from 'utils'
import {
  FieldName,
  FieldValue,
  TruncatedText,
} from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TableBodyItemSmallDiff } from 'pages/TrueSight/components/TrendingLayout/index'
import { TrueSightFilter } from 'pages/TrueSight/index'
import getFormattedNumLongDiscoveredDetails from 'pages/TrueSight/utils/getFormattedNumLongDiscoveredDetails'

const StyledTrendingTokenItem = styled(Flex)<{
  isSelected: boolean
  isTrueSightToken: boolean
}>`
  position: relative;
  padding: ${({ isTrueSightToken }) => (isTrueSightToken ? `10px 16px 10.5px` : `15.5px 16px 15.5px`)};
  border-bottom: 1px solid ${({ theme }) => theme.border};
  background: ${({ theme, isTrueSightToken }) => (isTrueSightToken ? rgba(theme.bg8, 0.12) : 'transparent')};
  cursor: pointer;
  gap: 16px;

  ${({ theme, isTrueSightToken, isSelected }) => `
    &, &:hover {
      background: ${isSelected ? theme.tableHeader : isTrueSightToken ? rgba(theme.bg8, 0.12) : 'transparent'};
    }
  `};
`

interface TrendingTokenItemProps {
  isSelected: boolean
  tokenData: TrueSightTokenData
  onSelect: () => void
  setIsOpenChartModal: React.Dispatch<React.SetStateAction<boolean>>
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}

const TrendingTokenItemMobileOnly = ({
  isSelected,
  tokenData,
  onSelect,
  setIsOpenChartModal,
  setFilter,
}: TrendingTokenItemProps) => {
  const theme = useTheme()
  const date = dayjs(tokenData.discovered_on * 1000).format('YYYY/MM/DD')

  const isTrueSightToken = tokenData.discovered_on !== 0
  const formattedDetails = getFormattedNumLongDiscoveredDetails(tokenData)

  return (
    <StyledTrendingTokenItem flexDirection="column" isSelected={isSelected} isTrueSightToken={isTrueSightToken}>
      <Flex justifyContent="space-between" alignItems="center" onClick={onSelect} style={{ gap: '16px' }}>
        <Flex alignItems="center">
          <img
            src={tokenData.logo_url}
            style={{ minWidth: '24px', width: '24px', minHeight: '24px', height: '24px', borderRadius: '50%' }}
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
            {isTrueSightToken && (
              <Text fontSize="12px" color={theme.subText}>
                <Trans>We discovered this on</Trans> {date}
              </Text>
            )}
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
            <SwapButtonWithOptions platforms={tokenData.platforms} style={{ flex: 1, padding: 0, minWidth: 'unset' }} />
          </Flex>

          <Flex flexDirection="column" style={{ gap: '16px', marginTop: '4px' }}>
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Tag</Trans>
              </FieldName>
              <Tags tags={tokenData.tags} style={{ justifyContent: 'flex-end' }} setFilter={setFilter} />
            </Flex>

            <Divider />

            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <FieldName>
                  <Trans>Price</Trans>
                </FieldName>
                <FieldValue>{formattedNumLong(tokenData.price, true)}</FieldValue>
              </Flex>
              {isTrueSightToken && (
                <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
                  <SubFieldName>Since {date}</SubFieldName>
                  <Flex alignItems="center" style={{ gap: '4px' }}>
                    <SubFieldValue>{formattedDetails.price}</SubFieldValue>
                    <TableBodyItemSmallDiff up={!formattedDetails.pricePercent.startsWith('-')}>
                      {formattedDetails.pricePercent}
                    </TableBodyItemSmallDiff>
                  </Flex>
                </Flex>
              )}
            </Box>

            <Divider />

            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <FieldName>
                  <Trans>Trading Volume (24H)</Trans>
                </FieldName>
                <FieldValue>{formattedNumLong(tokenData.trading_volume, true)}</FieldValue>
              </Flex>
              {isTrueSightToken && (
                <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
                  <SubFieldName>Since {date}</SubFieldName>
                  <Flex alignItems="center" style={{ gap: '4px' }}>
                    <SubFieldValue>{formattedDetails.tradingVolume}</SubFieldValue>
                    <TableBodyItemSmallDiff up={!formattedDetails.tradingVolumePercent.startsWith('-')}>
                      {formattedDetails.tradingVolumePercent}
                    </TableBodyItemSmallDiff>
                  </Flex>
                </Flex>
              )}
            </Box>

            <Divider />

            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <FieldName>
                  <Trans>Market Cap</Trans>
                </FieldName>
                <FieldValue>
                  {tokenData.market_cap <= 0 ? '--' : formattedNumLong(tokenData.market_cap, true)}
                </FieldValue>
              </Flex>
              {isTrueSightToken && (
                <Flex justifyContent="space-between" alignItems="center" marginTop="8px">
                  <SubFieldName>Since {date}</SubFieldName>
                  <Flex alignItems="center" style={{ gap: '4px' }}>
                    <SubFieldValue>{formattedDetails.marketCap}</SubFieldValue>
                    <TableBodyItemSmallDiff up={!formattedDetails.marketCapPercent.startsWith('-')}>
                      {formattedDetails.marketCapPercent}
                    </TableBodyItemSmallDiff>
                  </Flex>
                </Flex>
              )}
            </Box>

            <Divider />

            <Box>
              <Flex justifyContent="space-between" alignItems="center">
                <FieldName>
                  <Trans>Holders</Trans>
                </FieldName>
                <FieldValue>
                  {tokenData.number_holders <= 0 ? '--' : formattedNumLong(tokenData.number_holders, false)}
                </FieldValue>
              </Flex>
            </Box>

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
    </StyledTrendingTokenItem>
  )
}

export default TrendingTokenItemMobileOnly

const SubFieldName = styled.div`
  color: ${({ theme }) => theme.disableText};
  font-size: 12px;
  font-style: italic;
`

const SubFieldValue = styled.div`
  color: ${({ theme }) => theme.disableText};
  font-size: 12px;
  font-style: normal;
`
