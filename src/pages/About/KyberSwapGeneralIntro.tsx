import { Trans } from '@lingui/macro'
import { Repeat } from 'react-feather'
import { Link } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Box, Flex, Text } from 'rebass'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import { MoneyBagOutline } from 'components/Icons'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'

const KyberSwapGeneralIntro = () => {
  const { networkInfo, isSolana } = useActiveWeb3React()
  const above768 = useMedia('(min-width: 768px)')
  const theme = useTheme()
  const { mixpanelHandler } = useMixpanel()

  const renderKyberSwapIntroDEX = () => {
    return (
      <Text
        as="span"
        sx={{
          fontWeight: 400,
          fontSize: '18px',
          lineHeight: '28px',
          textAlign: 'center',
        }}
      >
        <Trans>
          KyberSwap is a decentralized exchange (DEX) aggregator. We provide our traders with the{' '}
          <b>best token prices</b> by analyzing rates across thousands of exchanges instantly!
        </Trans>
      </Text>
    )
  }

  const renderKyberSwapIntroAMM = () => {
    return (
      <Text
        as="span"
        sx={{
          fontWeight: 400,
          fontSize: '18px',
          lineHeight: '28px',
          textAlign: 'center',
        }}
      >
        <Trans>
          KyberSwap is also an automated market maker (AMM) with industry-leading liquidity protocols and{' '}
          <b>concentrated liquidity</b>. Liquidity providers can add liquidity to our pools & <b>earn fees</b>!
        </Trans>
      </Text>
    )
  }

  const renderSwapNowButton = () => {
    return (
      <ButtonPrimary
        onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_SWAP_CLICKED)}
        as={Link}
        to={`${APP_PATHS.SWAP}/${networkInfo.route}?highlightBox=true`}
        style={{
          width: '216px',
          padding: '10px 12px',
          borderRadius: '32px',
        }}
      >
        <Repeat size={20} />
        <Text fontSize="14px" marginLeft="8px">
          <Trans>Swap Now</Trans>
        </Text>
      </ButtonPrimary>
    )
  }

  const renderStartEarningButton = () => {
    return (
      <ButtonLight
        as={Link}
        to={`${APP_PATHS.POOLS}/${networkInfo.route}?tab=elastic`}
        onClick={() => mixpanelHandler(MIXPANEL_TYPE.ABOUT_START_EARNING_CLICKED)}
        style={{
          width: '216px',
        }}
      >
        <MoneyBagOutline color={theme.primary} size={20} />
        <Text fontSize="14px" marginLeft="8px">
          <Trans>Start Earning</Trans>
        </Text>
      </ButtonLight>
    )
  }

  if (above768 && isSolana) {
    return (
      <Box
        style={{
          marginTop: '36px',
          display: 'flex',
          flexFlow: 'column',
          alignItems: 'center',
          gap: '36px',
          padding: '0px 80px',
        }}
      >
        <Text
          as="span"
          sx={{
            fontWeight: 400,
            fontSize: '18px',
            lineHeight: '28px',
            textAlign: 'center',
          }}
        >
          <Trans>
            KyberSwap is a decentralized exchange (DEX) aggregator. We provide our traders with the{' '}
            <b>best token prices</b> by analyzing rates across thousands of exchanges instantly!
          </Trans>{' '}
          <Trans>
            KyberSwap is also an automated market maker (AMM) with industry-leading liquidity protocols and{' '}
            <b>concentrated liquidity</b>. Liquidity providers can add liquidity to our pools & <b>earn fees</b>!
          </Trans>
        </Text>
        {renderSwapNowButton()}
      </Box>
    )
  }

  if (above768) {
    return (
      <Box
        sx={{
          marginTop: '32px',
          width: '100%',
          paddingLeft: '64px',
          paddingRight: '64px',

          display: 'grid',
          gap: '24px 72px ',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr auto',
          justifyItems: 'center',
        }}
      >
        {renderKyberSwapIntroDEX()}
        {renderKyberSwapIntroAMM()}
        {renderSwapNowButton()}
        {renderStartEarningButton()}
      </Box>
    )
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        marginTop: '32px',
        width: '100%',
        paddingLeft: '32px',
        paddingRight: '32px',
        rowGap: '48px',
      }}
    >
      {isSolana ? (
        <Flex
          flexDirection={'column'}
          sx={{
            alignItems: 'center',
            rowGap: '16px',
          }}
        >
          {renderKyberSwapIntroDEX()}
          {renderKyberSwapIntroAMM()}
          {renderSwapNowButton()}
        </Flex>
      ) : (
        <>
          <Flex
            flexDirection={'column'}
            sx={{
              alignItems: 'center',
              rowGap: '16px',
            }}
          >
            {renderKyberSwapIntroDEX()}
            {renderSwapNowButton()}
          </Flex>

          <Flex
            flexDirection={'column'}
            sx={{
              alignItems: 'center',
              rowGap: '16px',
            }}
          >
            {renderKyberSwapIntroAMM()}
            {renderStartEarningButton()}
          </Flex>
        </>
      )}
    </Flex>
  )
}

export default KyberSwapGeneralIntro
