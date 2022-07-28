import React from 'react'
import styled from 'styled-components'
import { rgba } from 'polished'
import { Trans } from '@lingui/macro'
import { ChevronDown } from 'react-feather'
import dayjs from 'dayjs'
import { Box, Flex, Text } from 'rebass'

import useTheme from 'hooks/useTheme'
import { ButtonOutlined } from 'components/Button'
import Tags from 'pages/TrueSight/components/Tags'
import Divider from 'components/Divider'
import { ExternalLink } from 'theme'
import ButtonWithOptions from 'pages/TrueSight/components/ButtonWithOptions'
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

import CommunityRowOnMobile from '../CommunityRowOnMobile'
import AddressRowOnMobile from '../AddressRowOnMobile'

const StyledTrendingTokenItem = styled(Flex)`
  position: relative;
  padding: 10px 20px 10.5px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  cursor: pointer;
  gap: 16px;

  background: transparent;

  &[data-highlight='true'] {
    &,
    &:hover {
      background: ${({ theme }) => rgba(theme.bg8, 0.12)};
    }
  }

  &[data-selected='true'] {
    &,
    &:hover {
      background: ${({ theme }) => theme.tableHeader};
    }
  }
`

interface TrendingTokenItemProps {
  isSelected: boolean
  tokenData: TrueSightTokenData
  onSelect: () => void
  setIsOpenChartModal: React.Dispatch<React.SetStateAction<boolean>>
  setFilter: React.Dispatch<React.SetStateAction<TrueSightFilter>>
  tokenIndex: number
}

const TrendingTokenItemMobileOnly = ({
  isSelected,
  tokenData,
  onSelect,
  setIsOpenChartModal,
  setFilter,
  tokenIndex,
}: TrendingTokenItemProps) => {
  const theme = useTheme()

  const date = tokenData.discovered_on !== 0 ? dayjs(tokenData.discovered_on * 1000).format('YYYY/MM/DD') : undefined

  const isFoundByTrueSight = tokenData.discovered_on !== 0
  const formattedDetails = getFormattedNumLongDiscoveredDetails(tokenData)

  return (
    <StyledTrendingTokenItem flexDirection="column" data-highlight={isFoundByTrueSight} data-selected={isSelected}>
      <Flex
        justifyContent="space-between"
        alignItems="center"
        onClick={onSelect}
        sx={{
          columnGap: '16px',
        }}
      >
        <Flex
          alignItems="center"
          justifyContent="space-between"
          flex={1}
          sx={{
            columnGap: '4px',
          }}
        >
          <Flex alignItems="center" flex={1}>
            <Text
              fontSize="14px"
              fontWeight={500}
              color={theme.subText}
              width="18px"
              textAlign="center"
              marginRight={'16px'}
            >
              {tokenIndex}
            </Text>

            <img
              src={tokenData.logo_url}
              style={{
                minWidth: '24px',
                width: '24px',
                minHeight: '24px',
                height: '24px',
                borderRadius: '50%',
                marginRight: '8px',
              }}
              alt="logo"
            />

            <TruncatedText fontSize="14px" fontWeight={500} color={theme.subText} flex={1}>
              {tokenData.name}
            </TruncatedText>
          </Flex>

          {!!date && (
            <Text fontSize="14px" fontWeight={400} color={theme.text} flex="0 0 fit-content">
              {date}
            </Text>
          )}
        </Flex>

        <Flex
          flex="0 0 28px"
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
      </Flex>
      {isSelected && (
        <>
          <Flex sx={{ gap: '20px' }}>
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
            <ButtonWithOptions
              platforms={tokenData.platforms}
              style={{ flex: 1, padding: 0, minWidth: 'unset' }}
              tokenData={tokenData}
            />
          </Flex>

          <Divider />

          <Flex flexDirection="column" style={{ gap: '16px', marginTop: '4px', marginBottom: '8px' }}>
            <Flex
              justifyContent="space-between"
              alignItems="center"
              sx={{
                columnGap: '8px',
              }}
            >
              <FieldName>
                <Trans>Name</Trans>
              </FieldName>
              <FieldValue>
                <TruncatedText>{tokenData.name}</TruncatedText>
              </FieldValue>
            </Flex>

            <Divider />

            <Flex justifyContent="space-between" alignItems="center">
              <FieldName>
                <Trans>Symbol</Trans>
              </FieldName>
              <FieldValue>{tokenData.symbol}</FieldValue>
            </Flex>

            <Divider />

            <Flex
              justifyContent="space-between"
              alignItems="center"
              sx={{
                columnGap: '8px',
              }}
            >
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
              {isFoundByTrueSight && (
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
              {isFoundByTrueSight && (
                <Flex justifyContent="space-between" alignItems="center" marginTop="8px" color={theme.border}>
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
              {isFoundByTrueSight && (
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

            {Object.keys(tokenData.social_urls).length > 0 && (
              <>
                <Divider />
                <CommunityRowOnMobile socialURLs={tokenData.social_urls} />
              </>
            )}

            {tokenData.platforms.size > 0 && (
              <>
                <Divider />
                <AddressRowOnMobile platforms={tokenData.platforms} />
              </>
            )}
          </Flex>
        </>
      )}
    </StyledTrendingTokenItem>
  )
}

export default TrendingTokenItemMobileOnly

const SubFieldName = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-style: italic;
`

const SubFieldValue = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-style: normal;
`
