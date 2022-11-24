import { Trans } from '@lingui/macro'
import React from 'react'
import { Flex } from 'rebass'

import { ReactComponent as BarChartIcon } from 'assets/svg/bar_chart_icon.svg'
import { ButtonOutlined } from 'components/Button'
import Divider from 'components/Divider'
import useTheme from 'hooks/useTheme'
import AddressRowOnMobile from 'pages/TrueSight/components/AddressRowOnMobile'
import ButtonWithOptions from 'pages/TrueSight/components/ButtonWithOptions'
import CommunityRowOnMobile from 'pages/TrueSight/components/CommunityRowOnMobile'
import Tags from 'pages/TrueSight/components/Tags'
import {
  FieldName,
  FieldValue,
  TruncatedText,
} from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightFilter } from 'pages/TrueSight/index'
import { ExternalLink } from 'theme'
import { formattedNum } from 'utils'

const TrendingSoonTokenItemDetailsOnMobile = ({
  tokenData,
  setIsOpenChartModal,
  setFilter,
}: {
  tokenData: TrueSightTokenData
  setIsOpenChartModal: React.Dispatch<React.SetStateAction<boolean>>
  setFilter?: React.Dispatch<React.SetStateAction<TrueSightFilter>>
}) => {
  const theme = useTheme()

  return (
    <>
      <Flex style={{ gap: '20px' }}>
        <ButtonOutlined height="36px" fontSize="14px" padding="0" flex="1" onClick={() => setIsOpenChartModal(true)}>
          <BarChartIcon color={theme.subText} />
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

      <Flex flexDirection="column" sx={{ gap: '16px', marginTop: '4px', marginBottom: '8px' }}>
        <Flex
          justifyContent="space-between"
          alignItems="center"
          sx={{
            columnGap: '4px',
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
            <TruncatedText>{tokenData.official_web} ↗</TruncatedText>
          </FieldValue>
        </Flex>

        {Object.keys(tokenData.social_urls).length && (
          <>
            <Divider />
            <CommunityRowOnMobile socialURLs={tokenData.social_urls} />
          </>
        )}

        {tokenData.platforms.size && (
          <>
            <Divider />
            <AddressRowOnMobile platforms={tokenData.platforms} />
          </>
        )}
      </Flex>
    </>
  )
}

export default TrendingSoonTokenItemDetailsOnMobile
