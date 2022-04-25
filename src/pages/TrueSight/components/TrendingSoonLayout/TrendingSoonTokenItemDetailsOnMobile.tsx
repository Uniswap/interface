import React from 'react'
import { Flex, Text } from 'rebass'
import { ButtonOutlined } from 'components/Button'
import { ReactComponent as BarChartIcon } from 'assets/svg/bar_chart_icon.svg'
import { Trans } from '@lingui/macro'
import ButtonWithOptions from 'pages/TrueSight/components/ButtonWithOptions'
import Tags from 'pages/TrueSight/components/Tags'
import Divider from 'components/Divider'
import { formattedNum, isAddress } from 'utils'
import { ExternalLink } from 'theme'
import {
  FieldName,
  FieldValue,
  TruncatedText,
} from 'pages/TrueSight/components/TrendingSoonLayout/TrendingSoonTokenItem'
import { TrueSightTokenData } from 'pages/TrueSight/hooks/useGetTrendingSoonData'
import { TrueSightFilter } from 'pages/TrueSight/index'
import { CheckCircle, ChevronDown, Copy } from 'react-feather'
import TwitterIcon from 'components/Icons/TwitterIcon'
import useTheme from 'hooks/useTheme'
import { NETWORK_ICON, TRUESIGHT_NETWORK_TO_CHAINID } from 'constants/networks'
import getShortenAddress from 'utils/getShortenAddress'
import useCopyClipboard from 'hooks/useCopyClipboard'
import Facebook from 'components/Icons/Facebook'
import Reddit from 'components/Icons/Reddit'
import { useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import ModalCommunity from 'components/ModalCommunity'
import ModalContractAddress from 'components/ModalContractAddress'

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
  const defaultNetwork = tokenData.platforms.size ? tokenData.platforms.keys().next().value : ''
  const defaultAddress = defaultNetwork ? tokenData.platforms.get(defaultNetwork) ?? '' : ''

  const [isCopied, setCopied] = useCopyClipboard()

  const onCopy = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.stopPropagation()
    setCopied(isAddress(defaultAddress) || defaultAddress)
  }

  const toggleCommunityModal = useToggleModal(ApplicationModal.COMMUNITY)
  const toggleContractAddressModal = useToggleModal(ApplicationModal.CONTRACT_ADDRESS)

  return (
    <>
      <Flex style={{ gap: '20px', marginTop: '4px' }}>
        <ButtonOutlined height="36px" fontSize="14px" padding="0" flex="1" onClick={() => setIsOpenChartModal(true)}>
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
            <TruncatedText>{tokenData.official_web} ↗</TruncatedText>
          </FieldValue>
        </Flex>
        {Object.keys(tokenData.social_urls).length && (
          <>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center">
              <FieldName onClick={toggleCommunityModal}>
                <Trans>Community</Trans>
                <ChevronDown size={16} style={{ marginLeft: '4px' }} />
              </FieldName>
              <FieldValue
                as={ExternalLink}
                target="_blank"
                href={Object.values(tokenData.social_urls)[0]}
                style={{ textTransform: 'capitalize' }}
              >
                <Flex mr="4px" alignItems="center" width="fit-content">
                  {Object.keys(tokenData.social_urls)[0] === 'twitter' ? (
                    <TwitterIcon width={16} height={16} color={theme.text} />
                  ) : Object.keys(tokenData.social_urls)[0] === 'facebook' ? (
                    <Facebook size={16} color={theme.text} />
                  ) : Object.keys(tokenData.social_urls)[0] === 'reddit' ? (
                    <Reddit size={16} color={theme.text} />
                  ) : null}
                </Flex>
                <Text>{Object.keys(tokenData.social_urls)[0]} ↗</Text>
              </FieldValue>
            </Flex>
            <ModalCommunity communities={tokenData.social_urls} />
          </>
        )}
        {tokenData.platforms.size && (
          <>
            <Divider />
            <Flex justifyContent="space-between" alignItems="center" onClick={toggleContractAddressModal}>
              <FieldName>
                <Trans>Contract Address</Trans>
                <ChevronDown size={16} style={{ marginLeft: '4px' }} />
              </FieldName>
              <FieldValue>
                <img
                  src={NETWORK_ICON[TRUESIGHT_NETWORK_TO_CHAINID[defaultNetwork]]}
                  alt="Network"
                  style={{ minWidth: '16px', width: '16px', marginRight: '6px' }}
                />
                <Flex alignItems="center" onClick={onCopy}>
                  <div style={{ width: '90px' }}>{getShortenAddress(defaultAddress)}</div>
                  {isCopied ? <CheckCircle size={'14'} /> : <Copy size={'14'} />}
                </Flex>
              </FieldValue>
            </Flex>
            <ModalContractAddress platforms={tokenData.platforms} />
          </>
        )}
      </Flex>
    </>
  )
}

export default TrendingSoonTokenItemDetailsOnMobile
