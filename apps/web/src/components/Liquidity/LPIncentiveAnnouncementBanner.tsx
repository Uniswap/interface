import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, IconButton, styled, Text } from 'ui/src'
import { CoinStack } from 'ui/src/components/icons/CoinStack'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { isMobileWeb } from 'utilities/src/platform'

const LP_INCENTIVE_BANNER_STORAGE_KEY = 'lpIncentiveHidden'

const BannerContainer = styled(Flex, {
  borderRadius: '$rounded16',
  backgroundColor: '$surface1',
  width: 280,
  height: 204,
  borderWidth: 1,
  borderColor: '$surface3',
  shadowColor: '$shadowColor',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  overflow: 'hidden',
  '$platform-web': {
    position: 'fixed',
    bottom: 29,
    left: 40,
  },
})

const BannerContainerMobile = styled(Flex, {
  flexDirection: 'row',
  gap: '$spacing12',
  alignItems: 'flex-start',
  borderRadius: '$rounded16',
  backgroundColor: '$surface2',
  paddingTop: '$spacing16',
  paddingBottom: '$spacing12',
  borderWidth: 1,
  borderColor: '$surface3',
  overflow: 'hidden',
  '$platform-web': {
    position: 'fixed',
    bottom: 21,
    left: 10,
    right: 10,
  },
})

const DottedTopBackground = styled(Flex, {
  position: 'absolute',
  width: '100%',
  height: '32%',
  backgroundImage: 'radial-gradient(circle at 0.5px 0.5px, rgba(255, 255, 255, 0.2) 0.5px, transparent 0.5px)',
  backgroundSize: '10px 10px',
  backgroundColor: 'transparent',
  backgroundRepeat: 'repeat',
  maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)',
  '$platform-web': {
    WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)',
  },
  mixBlendMode: 'exclusion',
  $xs: {
    top: 0,
  },
})

const SolidBottom = styled(Flex, {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: '$surface2',
  height: '68%',
})

const IconBorderWrapper = styled(Flex, {
  position: 'absolute',
  top: 32,
  left: 16,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  padding: '$spacing2',
  $sm: {
    position: 'static',
  },
})

const IconContainer = styled(Flex, {
  width: 48,
  height: 48,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$accent2',
  borderRadius: '10.5px',
  $sm: {
    marginLeft: '$spacing12',
    width: 40,
    height: 40,
  },
})

const BannerContentContainer = styled(Flex, {
  position: 'absolute',
  bottom: 0,
  gap: '$spacing2',
  justifyContent: 'center',
  width: '100%',
  padding: '$spacing16',
})

const BannerContentContainerMobile = styled(Flex, {
  marginRight: '$spacing16',
  gap: '$spacing2',
  maxWidth: '75%',
})

export function LPIncentiveAnnouncementBanner() {
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const hasSeenBanner = localStorage.getItem(LP_INCENTIVE_BANNER_STORAGE_KEY) !== null
    setHidden(hasSeenBanner)
  }, [])

  const handleClose = () => {
    setHidden(true)
    localStorage.setItem(LP_INCENTIVE_BANNER_STORAGE_KEY, 'true')
  }

  if (hidden) {
    return null
  }

  return isMobileWeb ? <MobileBanner handleClose={handleClose} /> : <DesktopBanner handleClose={handleClose} />
}

function DesktopBanner({ handleClose }: { handleClose: () => void }) {
  return (
    <BannerContainer zIndex={zIndexes.sticky}>
      <BannerXButton handleClose={handleClose} />
      <DottedTopBackground />
      <SolidBottom />
      <IconBorderWrapper>
        <IconContainer>
          <CoinStack size={24} />
        </IconContainer>
      </IconBorderWrapper>
      <LpIncentiveBannerContent handleClose={handleClose} />
    </BannerContainer>
  )
}

function MobileBanner({ handleClose }: { handleClose: () => void }) {
  return (
    <BannerContainerMobile zIndex={zIndexes.sticky}>
      <BannerXButton handleClose={handleClose} />
      <DottedTopBackground />
      <IconContainer>
        <CoinStack size={20} />
      </IconContainer>
      <LpIncentiveBannerContent handleClose={handleClose} />
    </BannerContainerMobile>
  )
}

function BannerXButton({ handleClose }: { handleClose: () => void }) {
  return (
    <Flex row centered position="absolute" right={8} top={8} zIndex={zIndexes.mask}>
      <IconButton size="xxsmall" emphasis="secondary" onPress={handleClose} icon={<X />} p={3} scale={0.8} />
    </Flex>
  )
}

function LpIncentiveBannerContent({ handleClose }: { handleClose: () => void }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const LpContentWrapper = isMobileWeb ? BannerContentContainerMobile : BannerContentContainer

  const onClickViewMore = () => {
    handleClose()
    navigate('/explore/pools')
  }

  return (
    <LpContentWrapper>
      <Text variant="body3" color="$neutral1">
        {t('pool.incentives.uni')}
      </Text>
      <Text variant="body4" color="$neutral2">
        {t('pool.incentives.uni.description')}
      </Text>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        gap="$spacing2"
        $sm={{
          mt: '$spacing12',
        }}
      >
        <Trace logPress eventOnTrigger={UniswapEventName.LpIncentiveLearnMoreCtaClicked}>
          <LearnMoreLink
            textVariant="body4"
            textColor="$neutral2"
            url={uniswapUrls.helpArticleUrls.lpIncentiveInfo}
            hoverStyle={{ color: '$neutral3' }}
          />
        </Trace>
        <Button size="small" emphasis="primary" maxWidth="fit-content" onPress={onClickViewMore}>
          {t('pool.viewPools')}
        </Button>
      </Flex>
    </LpContentWrapper>
  )
}
