import { ColumnCenter } from 'components/deprecated/Column'
import { useCurrency } from 'hooks/Tokens'
import { useScroll } from 'hooks/useScroll'
import { GeometricBackground } from 'pages/Landing/components/GeometricBackground'
import { Hover, RiseIn, RiseInText } from 'pages/Landing/components/animations'
import { Swap } from 'pages/Swap'
import { Fragment, useCallback, useMemo } from 'react'
import { ChevronDown } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { serializeSwapStateToURLParameters } from 'state/swap/hooks'
import { Flex, Text, useMedia } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { SwapRedirectFn } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'

interface HeroProps {
  scrollToRef: () => void
  transition?: boolean
}

export function Hero({ scrollToRef, transition }: HeroProps) {
  const media = useMedia()
  const { height: scrollPosition } = useScroll({ enabled: !media.sm })
  const { defaultChainId } = useEnabledChains()
  const initialInputCurrency = useCurrency('ETH', defaultChainId)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const showLandingSwap = useFeatureFlag(FeatureFlags.ShowLandingSwap)
  const { translateY, opacityY } = useMemo(
    () => ({
      translateY: !media.sm ? -scrollPosition / 7 : 0,
      opacityY: !media.sm ? 1 - scrollPosition / 1000 : 1,
    }),
    [media.sm, scrollPosition],
  )

  const swapRedirectCallback = useCallback(
    ({ inputCurrency, outputCurrency, typedValue, independentField, chainId }: Parameters<SwapRedirectFn>[0]) => {
      navigate(
        `/swap${serializeSwapStateToURLParameters({
          inputCurrency,
          outputCurrency,
          typedValue,
          independentField,
          chainId,
        })}`,
      )
    },
    [navigate],
  )

  const renderRiseInText = useMemo(() => {
    return t('hero.swap.title')
      .split(/(<br\/>)|\s+/)
      .filter(Boolean) // splits the string by spaces but also captures "<br/>" as a separate element in the array
      .map((word, index) => {
        if (word === '<br/>') {
          return <br key={`${index}-${word}-br`} />
        } else {
          return (
            <Fragment key={`${index}-${word}`}>
              <RiseInText delay={index * 0.1}>{word}</RiseInText>{' '}
            </Fragment>
          )
        }
      })
  }, [t])

  return (
    <Flex
      position="relative"
      justifyContent="center"
      alignItems={showLandingSwap ? 'flex-start' : 'center'}
      y={translateY}
      opacity={opacityY}
      minWidth="100%"
      minHeight="100vh"
      height="min-content"
      pt={INTERFACE_NAV_HEIGHT}
      pointerEvents="none"
    >
      <GeometricBackground />

      <Flex
        alignSelf="center"
        maxWidth="85vw"
        pointerEvents="none"
        pt={showLandingSwap ? 48 : 0}
        gap={showLandingSwap ? '$gap20' : '$gap32'}
        transform={`translate(0px, ${translateY}px)`}
        opacity={opacityY}
        $lg={{ pt: showLandingSwap ? 24 : 0 }}
        $sm={{ pt: 8 }}
        $platform-web={{
          transition: transition ? 'shrinkAndFade 1s ease-in-out forwards' : undefined,
        }}
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <Flex maxWidth={920} alignItems="center" pointerEvents="none" width="100%">
          <Text
            variant="heading1"
            fontSize={64}
            lineHeight={76}
            textAlign="center"
            fontWeight="$book"
            $md={{ fontSize: 52 }}
            $sm={{ variant: 'heading2', fontSize: 36 }}
            $short={{ variant: 'heading2', fontSize: 36 }}
          >
            {renderRiseInText}
          </Text>
        </Flex>

        {showLandingSwap && (
          <RiseIn delay={0.4}>
            <Flex
              pointerEvents="auto"
              width={480}
              p="$padding8"
              borderRadius="$rounded24"
              backgroundColor="$surface1"
              maxWidth="100%"
              enterStyle={{ opacity: 0 }}
            >
              <Swap
                hideHeader
                hideFooter
                syncTabToUrl={false}
                chainId={defaultChainId}
                initialInputCurrency={initialInputCurrency}
                swapRedirectCallback={swapRedirectCallback}
                usePersistedFilteredChainIds
              />
            </Flex>
          </RiseIn>
        )}

        <RiseIn delay={0.3}>
          <Text
            variant="body1"
            textAlign="center"
            maxWidth={showLandingSwap ? 430 : 700}
            color="$neutral2"
            $short={{ variant: 'body2' }}
            width="100%"
          >
            <Trans i18nKey="hero.subtitle" />
          </Text>
        </RiseIn>
      </Flex>

      {showLandingSwap && <Flex flex={1} />}

      <Flex
        position="absolute"
        width="100%"
        centered
        pointerEvents="none"
        bottom={48}
        style={{ transform: `translate(0px, ${translateY}px)`, opacity: opacityY }}
        $midHeight={{ display: 'none' }}
      >
        <RiseIn delay={0.3}>
          <Flex
            alignItems="center"
            justifyContent="flex-start"
            onPress={() => scrollToRef()}
            cursor="pointer"
            width={500}
          >
            <Hover>
              <ColumnCenter>
                <Text variant="body2">
                  <Trans i18nKey="hero.scroll" />
                </Text>
                <ChevronDown />
              </ColumnCenter>
            </Hover>
          </Flex>
        </RiseIn>
      </Flex>
    </Flex>
  )
}
