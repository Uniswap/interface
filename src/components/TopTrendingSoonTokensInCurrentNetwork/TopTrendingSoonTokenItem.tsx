import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { rgba } from 'polished'
import React from 'react'
import { Info } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Image, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import Cart from 'components/Icons/Cart'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'
import { formatNumberWithPrecisionRange, formattedNum } from 'utils'

const TopTrendingSoonTokenItem = ({
  tokenData,
  setSelectedToken,
}: {
  tokenData: TrueSightTokenData
  setSelectedToken: React.Dispatch<React.SetStateAction<TrueSightTokenData | undefined>>
}) => {
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()
  const { chainId = ChainId.MAINNET } = useActiveWeb3React()
  const currentNetworkIndex = Object.values(TRUESIGHT_NETWORK_TO_CHAINID).indexOf(chainId)
  const currentNetwork = Object.keys(TRUESIGHT_NETWORK_TO_CHAINID)[currentNetworkIndex]
  const toggleTrendingSoonTokenDetailModal = useToggleModal(ApplicationModal.TRENDING_SOON_TOKEN_DETAIL)

  const onSelectToken = () => {
    setSelectedToken(tokenData)
    toggleTrendingSoonTokenDetailModal()
    mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_MORE_INFO_CLICKED, { trending_token: tokenData.symbol })
  }

  return (
    <Container>
      <Flex style={{ gap: '4px' }} alignItems="center">
        <Image
          src={tokenData.logo_url}
          minWidth="16px"
          width="16px"
          minHeight="16px"
          height="16px"
          sx={{ borderRadius: '50%', cursor: 'pointer' }}
          onClick={onSelectToken}
        />
        <Text
          as="span"
          fontSize="12px"
          mr="4px"
          color={theme.subText}
          sx={{ cursor: 'pointer' }}
          onClick={onSelectToken}
        >
          {tokenData.symbol}
        </Text>
        <Text
          fontSize="12px"
          as="span"
          sx={{
            whiteSpace: 'nowrap',
          }}
        >
          {formattedNum(tokenData.price.toString(), true)}
        </Text>
        <Text
          as="span"
          fontSize="12px"
          sx={{
            whiteSpace: 'nowrap',
            color: tokenData.price_change_percentage_24h >= 0 ? theme.apr : theme.red,
          }}
        >
          (
          {tokenData.price_change_percentage_24h >= 1
            ? formatNumberWithPrecisionRange(tokenData.price_change_percentage_24h, 0, 0)
            : formatNumberWithPrecisionRange(tokenData.price_change_percentage_24h, 0, 2)}
          %)
        </Text>
        <MouseoverTooltipDesktopOnly text={t`More info`} placement="top" width="fit-content">
          <ButtonEmpty
            padding="0"
            onClick={onSelectToken}
            style={{
              background: theme.background,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
            }}
          >
            <Info size="10px" color={theme.subText} />
          </ButtonEmpty>
        </MouseoverTooltipDesktopOnly>
        {/*<MouseoverTooltipDesktopOnly text={t`Buy now`} placement="top" width="fit-content">*/}
        <ButtonEmpty
          padding="0"
          as={Link}
          to={`/swap?inputCurrency=ETH&outputCurrency=${tokenData.platforms.get(currentNetwork)}`}
          style={{
            background: rgba(theme.primary, 0.2),
            width: '16px',
            height: '16px',
            borderRadius: '50%',
          }}
          onClick={() =>
            mixpanelHandler(MIXPANEL_TYPE.DISCOVER_SWAP_BUY_NOW_CLICKED, { trending_token: tokenData.symbol })
          }
        >
          <Cart color={theme.primary} size={10} />
        </ButtonEmpty>
        {/*</MouseoverTooltipDesktopOnly>*/}
      </Flex>
    </Container>
  )
}

const Container = styled.div`
  padding: 6px 12px;
  background: ${({ theme }) => theme.buttonBlack};
  position: relative;
  border-radius: 40px;
`

export default TopTrendingSoonTokenItem
