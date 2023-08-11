import { ColorTokens, getTokenValue, Icons, validToken, XStack, YStack } from 'ui/src'
import { Flex } from 'ui/src/components/layout/Flex'
import { Text } from 'ui/src/components/text/Text'
import { opacify } from 'ui/src/theme/color/utils'
import { theme } from 'ui/src/theme/restyle/theme'
import { usePortfolioUSDBalance } from 'wallet/src/features/portfolio/hooks'

type WalletBalanceProps = {
  address: Address
}

const disabledHoverStyle = { cursor: 'not-allowed' }
const enabledHoverStyle = { cursor: 'pointer' }

// TODO(spore): replace with proper themed colors
const CTA_COLORS = {
  PINK: '#FD82FF',
  GREEN: '#00D395',
  YELLOW: '#E8A803',
}

const CTA_COLORS_SOFT = {
  PINK: opacify(20, CTA_COLORS.PINK),
  GREEN: opacify(15, CTA_COLORS.GREEN),
  YELLOW: opacify(15, CTA_COLORS.YELLOW),
}

// TODO(EXT-210): fix up passing of Icon to reuse color prop and constant icon size etc
const TempFakeButton = ({
  label,
  backgroundColor,
  color,
  Icon,
  url,
}: {
  label: string
  backgroundColor: ColorTokens
  color: ColorTokens
  Icon: JSX.Element
  url?: string
}): JSX.Element => {
  return (
    <Flex
      alignItems="flex-start"
      backgroundColor={backgroundColor}
      borderRadius="$rounded16"
      flex={1}
      flexBasis={1}
      gap="$spacing12"
      hoverStyle={url ? enabledHoverStyle : disabledHoverStyle}
      justifyContent="space-between"
      padding="$spacing12">
      {Icon}
      <Text color={color} fontWeight="600" variant="bodyLarge">
        {label}
      </Text>
    </Flex>
  )
}

export function PortfolioBalance({ address }: WalletBalanceProps): JSX.Element {
  const { portfolioBalanceUSD, portfolioChange, loading, error } = usePortfolioUSDBalance(address)

  // TODO (EXT-297): encapsulate to share better
  const change = portfolioChange ?? 0

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const arrowColor = isPositiveChange ? theme.colors.statusSuccess : theme.colors.statusCritical

  const formattedChange = change !== undefined ? `${Math.abs(change).toFixed(2)}%` : '-'
  return (
    <Flex>
      {loading ? (
        <Text color="$neutral3" fontWeight="600" variant="headlineLarge">
          $-,---.--
        </Text>
      ) : error ? (
        <Text color="$statusCritical" variant="bodyLarge">
          Error: {JSON.stringify(error)}
        </Text>
      ) : (
        <YStack gap="$spacing12">
          <YStack>
            <Text variant="headlineLarge">${portfolioBalanceUSD?.toFixed(2)}</Text>
            <XStack alignItems="center">
              <Icons.ArrowChange
                color={arrowColor}
                rotation={isPositiveChange ? 180 : 0}
                size={getTokenValue('$icon.20')}
              />
              <Text color="$neutral2" variant="bodyLarge">
                {/* TODO(EXT-298): add absolute change here too, share from mobile */}
                {formattedChange}
              </Text>
            </XStack>
          </YStack>
          <Flex flexDirection="row" gap="$spacing8">
            {/* TODO(EXT-210): fix up passing of Icon to reuse color prop and constant icon size etc
             */}
            <TempFakeButton
              Icon={<Icons.CoinConvert color={CTA_COLORS.PINK} size={getTokenValue('$icon.24')} />}
              backgroundColor={validToken(CTA_COLORS_SOFT.PINK)}
              color={validToken(CTA_COLORS.PINK)}
              label="Swap"
            />
            <TempFakeButton
              Icon={
                <Icons.SendRoundedAirplane
                  color={CTA_COLORS.GREEN}
                  size={getTokenValue('$icon.24')}
                />
              }
              backgroundColor={validToken(CTA_COLORS_SOFT.GREEN)}
              color={validToken(CTA_COLORS.GREEN)}
              label="Send"
            />
            <TempFakeButton
              Icon={
                <Icons.ReceiveDots color={CTA_COLORS.YELLOW} size={getTokenValue('$icon.24')} />
              }
              backgroundColor={validToken(CTA_COLORS_SOFT.YELLOW)}
              color={validToken(CTA_COLORS.YELLOW)}
              label="Receive"
            />
          </Flex>
        </YStack>
      )}
    </Flex>
  )
}
