import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import {
  LiquidityPositionStatusIndicator,
  LiquidityPositionStatusIndicatorLoader,
} from 'components/Liquidity/LiquidityPositionStatusIndicator'
import { PositionInfo } from 'components/Liquidity/types'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { TextLoader } from 'pages/Pool/Positions/shared'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Anchor, Button, Circle, Flex, Text, useMedia } from 'ui/src'
import { RightArrow } from 'ui/src/components/icons/RightArrow'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'

interface LiquidityPositionInfoProps {
  positionInfo: PositionInfo
  currencyLogoSize?: number
  hideStatusIndicator?: boolean
  showMigrateButton?: boolean
  isMiniVersion?: boolean
  linkToPool?: boolean
}

export function LiquidityPositionInfoLoader({ hideStatus }: { hideStatus?: boolean }) {
  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }}>
      <Circle size={44} backgroundColor="$surface3" />
      <Flex grow $md={{ row: true, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Flex my={hideStatus ? 'auto' : '$none'}>
          <TextLoader variant="subheading1" width={100} />
        </Flex>
        {!hideStatus && <LiquidityPositionStatusIndicatorLoader />}
      </Flex>
    </Flex>
  )
}

export function LiquidityPositionInfo({
  positionInfo,
  currencyLogoSize = 44,
  hideStatusIndicator = false,
  showMigrateButton = false,
  isMiniVersion = false,
  linkToPool = false,
}: LiquidityPositionInfoProps) {
  const { currency0Amount, currency1Amount, status, feeTier, v4hook, version } = positionInfo
  const versionLabel = getProtocolVersionLabel(version)
  const navigate = useNavigate()
  const chainInfo = getChainInfo(positionInfo.chainId)
  const media = useMedia()
  const { t } = useTranslation()

  const isMigrateToV4ButtonVisible = useMemo(() => {
    if (!(positionInfo.version === ProtocolVersion.V3 && showMigrateButton)) {
      return false
    }
    // if we're in the md-lg or xl-xxl ranges, hide the button due to overlapping issues
    const isInMdToLgRange = media.lg && !media.md
    const isInXlToXxlRange = media.xxl && !media.xl
    const shouldHideInRange = isInMdToLgRange || isInXlToXxlRange

    return !shouldHideInRange
  }, [positionInfo.version, showMigrateButton, media.lg, media.md, media.xxl, media.xl])

  const migrateToV4Button = (): JSX.Element => {
    return (
      <Button
        icon={<RightArrow />}
        iconPosition="after"
        py="$spacing2"
        borderRadius="$rounded4"
        emphasis="secondary"
        size="xxsmall"
        onPress={(e) => {
          e.preventDefault()
          navigate(`/migrate/v3/${chainInfo.urlParam}/${positionInfo.tokenId}`)
        }}
      >
        {t('pool.migrateToV4')}
      </Button>
    )
  }

  return (
    <Flex row gap="$gap16" $md={{ width: '100%' }} alignItems={isMiniVersion ? 'center' : 'flex-start'}>
      <DoubleCurrencyLogo currencies={[currency0Amount?.currency, currency1Amount?.currency]} size={currencyLogoSize} />
      <Flex
        flexDirection={isMiniVersion ? 'column' : 'row'}
        gap={isMiniVersion ? '$gap0' : '$gap16'}
        $md={{ row: false, gap: isMiniVersion ? '$gap0' : '$gap4' }}
        alignItems="flex-start"
      >
        <Flex gap="$gap4" $md={{ row: true, gap: '$gap12' }}>
          {linkToPool ? (
            <Anchor href={getPoolDetailsURL(positionInfo.poolId, positionInfo.chainId)} textDecorationLine="none">
              <Text variant="subheading1" {...ClickableTamaguiStyle}>
                {currency0Amount?.currency.symbol} / {currency1Amount?.currency.symbol}
              </Text>
            </Anchor>
          ) : (
            <Text variant="subheading1">
              {currency0Amount?.currency.symbol} / {currency1Amount?.currency.symbol}
            </Text>
          )}
          <Flex row gap="$gap8" alignItems="center">
            {!hideStatusIndicator && <LiquidityPositionStatusIndicator status={status} />}
          </Flex>
        </Flex>

        <Flex row gap="$gap8" alignItems="center" mt={3} $md={{ mt: 0 }}>
          <Flex row gap={2} alignItems="center">
            <LiquidityPositionInfoBadges size="small" versionLabel={versionLabel} v4hook={v4hook} feeTier={feeTier} />
          </Flex>
          {isMigrateToV4ButtonVisible && migrateToV4Button()}
        </Flex>
      </Flex>
    </Flex>
  )
}
