import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Flex, HeightAnimator, SpaceTokens, Text, TouchableArea } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { iconSizes, spacing } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { EarnEntryPoint } from 'uniswap/src/features/earn/analytics'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useWalletNavigation } from 'wallet/src/contexts/WalletNavigationContext'
import { selectHasSeenUnfundedEarnCardReveal } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasSeenUnfundedEarnCardReveal } from 'wallet/src/features/behaviorHistory/slice'
import { DiscoveryVaultRow } from 'wallet/src/features/earn/DiscoveryVaultRow'
import { EARNING_CARD_FRAME_PROPS } from 'wallet/src/features/earn/earnCardStyles'

const UNFUNDED_CARD_LOGO_COUNT = 3
// Logo stack height: icon24 logos plus the 2px surface border on each side.
const UNFUNDED_HEADER_MIN_HEIGHT = iconSizes.icon24 + 2 * spacing.spacing2

// One-time reveal: the card grows into place first, then each logo drops into the stack.
const REVEAL_CARD_DELAY_MS = 400
const REVEAL_LOGO_START_MS = 900
const REVEAL_LOGO_STAGGER_MS = 200
const REVEAL_COMPLETE_MS = REVEAL_LOGO_START_MS + UNFUNDED_CARD_LOGO_COUNT * REVEAL_LOGO_STAGGER_MS + 300

export function UnfundedEarnCard({
  vaults,
  isRevealReady = true,
  mb,
  mt,
  mx,
}: {
  vaults: EarnVaultInfo[]
  /** Holds the one-time reveal (mobile: screen focused, welcome-card area settled) so it can't play offscreen. */
  isRevealReady?: boolean
  mb?: SpaceTokens
  mt?: SpaceTokens
  mx?: SpaceTokens
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const { navigateToEarnVault } = useWalletNavigation()
  const dispatch = useDispatch()
  const [isExpanded, setIsExpanded] = useState(false)

  const hasSeenReveal = useSelector(selectHasSeenUnfundedEarnCardReveal)
  // Decided once at mount so the persisted flag flipping mid-animation doesn't cut the reveal short.
  const [shouldPlayReveal] = useState(!hasSeenReveal)
  const [isCardRevealed, setIsCardRevealed] = useState(!shouldPlayReveal)
  const [revealedLogoCount, setRevealedLogoCount] = useState(shouldPlayReveal ? 0 : UNFUNDED_CARD_LOGO_COUNT)

  // Latched: once started, losing readiness (e.g. tab blur) doesn't cancel or replay the animation.
  const [isRevealStarted, setIsRevealStarted] = useState(false)
  useEffect(() => {
    if (shouldPlayReveal && isRevealReady) {
      setIsRevealStarted(true)
    }
  }, [shouldPlayReveal, isRevealReady])

  useEffect(() => {
    if (!isRevealStarted) {
      return undefined
    }
    const timeouts: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setIsCardRevealed(true), REVEAL_CARD_DELAY_MS),
      // HomeScreenEarningSection suppresses its loading skeleton until this flag is set,
      // and also sets it for funded wallets that will never play the reveal.
      setTimeout(() => dispatch(setHasSeenUnfundedEarnCardReveal()), REVEAL_COMPLETE_MS),
    ]
    for (let logoCount = 1; logoCount <= UNFUNDED_CARD_LOGO_COUNT; logoCount++) {
      timeouts.push(
        setTimeout(() => setRevealedLogoCount(logoCount), REVEAL_LOGO_START_MS + logoCount * REVEAL_LOGO_STAGGER_MS),
      )
    }
    return () => timeouts.forEach(clearTimeout)
  }, [isRevealStarted, dispatch])

  const onSelectVault = useCallback(
    ({ vault }: { vault: EarnVaultInfo }) => {
      navigateToEarnVault({ analyticsEntryPoint: EarnEntryPoint.PortfolioEarnSection, vault })
    },
    [navigateToEarnVault],
  )

  const maxApyPercent = useMemo(() => Math.max(...vaults.map((vault) => vault.apyPercent)), [vaults])
  const formattedApy = t('explore.earn.apy', { apy: formatPercent(maxApyPercent) })

  const toggleExpanded = (): void => setIsExpanded((prev) => !prev)

  const card = (
    <Flex
      {...EARNING_CARD_FRAME_PROPS}
      mt={shouldPlayReveal ? undefined : mt}
      mb={shouldPlayReveal ? '$none' : (mb ?? EARNING_CARD_FRAME_PROPS.mb)}
      mx={shouldPlayReveal ? undefined : mx}
      testID={TestID.HomeEarnUnfundedCard}
    >
      <TouchableArea testID={TestID.HomeEarnUnfundedToggle} onPress={toggleExpanded}>
        {/* Both header states share the collapsed logo stack's height so the title doesn't shift on toggle. */}
        {isExpanded ? (
          <Flex
            row
            alignItems="center"
            justifyContent="space-between"
            gap="$spacing8"
            minHeight={UNFUNDED_HEADER_MIN_HEIGHT}
          >
            <Text variant="subheading2" color="$neutral1">
              {t('explore.earn.title')}
            </Text>
            <ChevronsIn color="$neutral2" size={iconSizes.icon20} />
          </Flex>
        ) : (
          <Flex row alignItems="center" gap="$spacing8" minHeight={UNFUNDED_HEADER_MIN_HEIGHT}>
            <Text variant="subheading2" color="$neutral1">
              <Trans
                i18nKey="home.earn.upToApy"
                values={{ apy: formattedApy }}
                components={{ highlight: <Text tag="span" variant="subheading2" color="$accent1" /> }}
              />
            </Text>
            <Flex fill row alignItems="center" justifyContent="flex-end" gap="$spacing8">
              <VaultTokenLogoStack vaults={vaults} revealedCount={revealedLogoCount} />
              <ChevronsOut color="$neutral2" size={iconSizes.icon20} />
            </Flex>
          </Flex>
        )}
      </TouchableArea>

      {isExpanded && (
        <Flex gap="$spacing12" pt="$spacing8">
          {vaults.map((vault) => (
            <DiscoveryVaultRow key={vault.id} vault={vault} onSelect={onSelectVault} />
          ))}
        </Flex>
      )}
    </Flex>
  )

  if (!shouldPlayReveal) {
    return card
  }

  return (
    <Flex mt={mt} mb={mb ?? EARNING_CARD_FRAME_PROPS.mb} mx={mx}>
      <HeightAnimator open={isCardRevealed} animation="300ms">
        {card}
      </HeightAnimator>
    </Flex>
  )
}

function VaultTokenLogoStack({
  vaults,
  revealedCount,
}: {
  vaults: readonly EarnVaultInfo[]
  revealedCount?: number
}): JSX.Element {
  const stackedVaults = vaults.slice(0, UNFUNDED_CARD_LOGO_COUNT)
  const visibleCount = revealedCount ?? stackedVaults.length
  return (
    <Flex row alignItems="center">
      {stackedVaults.map((vault, index) => (
        <Flex
          key={vault.id}
          ml={index === 0 ? 0 : -8}
          borderWidth="$spacing2"
          borderColor="$surface1"
          borderRadius="$roundedFull"
          zIndex={stackedVaults.length - index}
          animation="300ms"
          animateOnly={['opacity', 'transform']}
          opacity={index < visibleCount ? 1 : 0}
          y={index < visibleCount ? 0 : -8}
        >
          <VaultTokenLogo currencyId={vault.displayCurrencyId} />
        </Flex>
      ))}
    </Flex>
  )
}

function VaultTokenLogo({ currencyId }: { currencyId: string }): JSX.Element {
  const currencyInfo = useCurrencyInfo(currencyId)
  const currency = currencyInfo?.currency
  return (
    <TokenLogo
      hideNetworkLogo
      url={currencyInfo?.logoUrl}
      size={iconSizes.icon24}
      chainId={currency?.chainId}
      symbol={currency?.symbol}
      name={currency?.name}
    />
  )
}
