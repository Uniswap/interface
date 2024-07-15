import { ColumnCenter } from 'components/Column'
import { useCurrency } from 'hooks/Tokens'
import { useScroll } from 'hooks/useScroll'
import { Trans } from 'i18n'
import styled, { css, keyframes } from 'lib/styled-components'
import { Box, H1 } from 'pages/Landing/components/Generics'
import { TokenCloud } from 'pages/Landing/components/TokenCloud/index'
import { Hover, RiseIn, RiseInText } from 'pages/Landing/components/animations'
import { Swap } from 'pages/Swap'
import { ChevronDown } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { BREAKPOINTS } from 'theme'
import { Text } from 'ui/src'
import { heightBreakpoints } from 'ui/src/theme'
import { UniverseChainId } from 'uniswap/src/types/chains'

const Container = styled(Box)`
  min-width: 100%;
  padding-top: ${({ theme }) => theme.navHeight}px;
`
const LandingSwapContainer = styled(Box)`
  width: 480px;
  padding: 8px;
  border-radius: 24px;
  background: ${({ theme }) => theme.surface1};
`
const LandingSwap = styled(Swap)`
  position: relative;
  width: 100%;

  & > div:first-child {
    padding: 0px;
  }
  & > div:first-child > div:first-child {
    display: none;
  }
`
const StyledH1 = styled(H1)`
  @media (max-width: 768px) {
    font-size: 52px;
  }
  @media (max-width: 464px) {
    font-size: 36px;
  }
  @media (max-height: 668px) {
    font-size: 28px;
  }
`
const shrinkAndFade = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
`
const Center = styled(Box)<{ transition?: boolean }>`
  width: unset;
  pointer-events: none;
  padding: 48px 0px;
  @media (max-width: 464px), (max-height: 700px) {
    padding-top: 24px;
  }
  @media (max-width: 464px), (max-height: 668px) {
    padding-top: 8px;
  }
  gap: 24px;
  @media (max-height: 800px) {
    gap: 16px;
  }
  ${({ transition }) =>
    transition &&
    css`
      animation: ${shrinkAndFade} 1s ease-in-out forwards;
    `};
`
const LearnMoreContainer = styled(Box)`
  bottom: 48px;
  @media (max-width: ${BREAKPOINTS.md}px) {
    bottom: 64px;
  }

  // Prevent overlap of Hero text and Learn More button on short screens
  @media (max-height: ${heightBreakpoints.short + 30}px) {
    display: none;
  }
`

interface HeroProps {
  scrollToRef: () => void
  transition?: boolean
}

export function Hero({ scrollToRef, transition }: HeroProps) {
  const { height: scrollPosition } = useScroll()
  const initialInputCurrency = useCurrency('ETH')
  const { t } = useTranslation()

  const translateY = -scrollPosition / 7
  const opacityY = 1 - scrollPosition / 1000

  return (
    <Container
      position="relative"
      height="100vh"
      justify="center"
      style={{ transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
    >
      <TokenCloud transition={transition} />
      <Center
        direction="column"
        align="center"
        maxWidth="85vw"
        transition={transition}
        style={{ transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
      >
        <Box maxWidth="920px" direction="column" align="center" style={{ pointerEvents: 'none' }}>
          <StyledH1>
            {t('hero.swap.title')
              .split(' ')
              .map((word, index) => {
                if (word === '<br/>') {
                  return <br key={word} />
                } else {
                  return (
                    <>
                      <RiseInText key={word} delay={index * 0.1}>
                        {word}
                      </RiseInText>{' '}
                    </>
                  )
                }
              })}
          </StyledH1>
        </Box>

        <RiseIn delay={0.4}>
          <LandingSwapContainer>
            <LandingSwap
              syncTabToUrl={false}
              chainId={initialInputCurrency?.chainId ?? UniverseChainId.Mainnet}
              initialInputCurrency={initialInputCurrency}
            />
          </LandingSwapContainer>
        </RiseIn>

        <RiseIn delay={0.3}>
          <Text
            variant="body1"
            textAlign="center"
            maxWidth={430}
            color="$neutral2"
            $short={{
              variant: 'body2',
            }}
          >
            <Trans i18nKey="hero.subtitle" />
          </Text>
        </RiseIn>
      </Center>
      <LearnMoreContainer
        position="absolute"
        width="100%"
        align="center"
        justify="center"
        pointerEvents="none"
        style={{ transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
      >
        <RiseIn delay={0.3}>
          <Box
            direction="column"
            align="center"
            justify="flex-start"
            onClick={() => scrollToRef()}
            style={{ cursor: 'pointer' }}
            width="500px"
          >
            <Hover>
              <ColumnCenter>
                <Text variant="body2">
                  <Trans i18nKey="hero.scroll" />
                </Text>
                <ChevronDown />
              </ColumnCenter>
            </Hover>
          </Box>
        </RiseIn>
      </LearnMoreContainer>
    </Container>
  )
}
