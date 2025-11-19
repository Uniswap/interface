import { Dropdown, InternalMenuItem } from 'components/Dropdowns/Dropdown'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { useFilteredChainIds } from 'components/NetworkFilter/useFilteredChains'
import { ExploreTab } from 'pages/Explore/constants'
import type { Dispatch, SetStateAction } from 'react'
import { memo, useCallback, useState } from 'react'
import { Check } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { EllipsisTamaguiStyle } from 'theme/components/styles'
import type { FlexProps, TextProps } from 'ui/src'
import { ElementAfterText, Flex, ScrollView, styled, Text, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import Badge from 'uniswap/src/components/badge/Badge'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { NewTag } from 'uniswap/src/components/pill/NewTag'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useNewChainIds } from 'uniswap/src/features/chains/hooks/useNewChainIds'
import { useIsSupportedChainIdCallback } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import type { UniverseChainInfo } from 'uniswap/src/features/chains/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { InterfacePageName, ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const NetworkLabel = styled(Flex, {
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$gap8',
})

// dropdown sizes per design
enum DropdownSizeVariants {
  Large = 'large',
  Medium = 'medium',
  Small = 'small',
  XSmall = 'xsmall',
}

type DropdownSize = DropdownSizeVariants | 'large' | 'medium' | 'small' | 'xsmall'

const StyledDropdown = {
  maxHeight: 350,
  minWidth: 256,
  px: 0,
  py: 0,
} satisfies FlexProps

const ButtonStyles: Record<DropdownSizeVariants, FlexProps> = {
  [DropdownSizeVariants.Large]: {
    height: 48,
    pl: '$spacing16',
    pr: '$spacing12',
  },
  [DropdownSizeVariants.Medium]: {
    height: 40,
    pl: '$spacing12',
  },
  [DropdownSizeVariants.Small]: {
    height: 32,
    borderRadius: '$rounded12',
    pl: '$spacing12',
    gap: '$gap6',
  },
  [DropdownSizeVariants.XSmall]: {
    height: 28,
    borderRadius: '$rounded12',
    pl: '$spacing6',
    pr: '$spacing6',
    gap: '$gap4',
  },
}

const NetworkLogoSizes: Record<DropdownSizeVariants, number> = {
  [DropdownSizeVariants.Large]: iconSizes.icon24,
  [DropdownSizeVariants.Medium]: iconSizes.icon20,
  [DropdownSizeVariants.Small]: iconSizes.icon16,
  [DropdownSizeVariants.XSmall]: iconSizes.icon16,
}

const NetworkLabelTextVariants: Record<DropdownSizeVariants, TextProps['variant']> = {
  [DropdownSizeVariants.Large]: 'buttonLabel2',
  [DropdownSizeVariants.Medium]: 'buttonLabel3',
  [DropdownSizeVariants.Small]: 'buttonLabel4',
  [DropdownSizeVariants.XSmall]: 'buttonLabel4',
}

export default function NetworkFilter({
  showMultichainOption = true,
  showDisplayName = false,
  position = 'left',
  onPress,
  currentChainId,
  size = DropdownSizeVariants.Medium,
  transition,
  networks,
}: {
  showMultichainOption?: boolean
  showDisplayName?: boolean
  size?: DropdownSize
  position?: 'left' | 'right'
  onPress: (chainId: UniverseChainId | undefined) => void
  currentChainId: UniverseChainId | undefined
  transition?: FlexProps['transition']
  networks?: UniverseChainId[]
}) {
  const { t } = useTranslation()
  const [isMenuOpen, toggleMenu] = useState(false)
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const filteredChainIds = useFilteredChainIds(networks)
  const chainInfo = currentChainId ? getChainInfo(currentChainId) : null
  const isAllNetworks = chainInfo === null

  const tableNetworkItemRenderer = useCallback(
    (chainId: UniverseChainId) => {
      if (!isSupportedChainCallback(chainId)) {
        return null
      }
      const chainInfo = getChainInfo(chainId)
      const supported = isBackendSupportedChainId(chainId)

      return (
        <TableNetworkItem
          key={chainId}
          chainInfo={chainInfo}
          toggleMenu={toggleMenu}
          unsupported={!supported}
          onPress={onPress}
          currentChainId={currentChainId}
        />
      )
    },
    [isSupportedChainCallback, onPress, currentChainId],
  )

  return (
    <Flex>
      <Trace modal={ModalName.NetworkSelector}>
        <Dropdown
          isOpen={isMenuOpen}
          toggleOpen={toggleMenu}
          menuLabel={
            <NetworkLabel>
              {(!currentChainId || !isSupportedChainCallback(currentChainId)) && showMultichainOption ? (
                <NetworkLogo size={NetworkLogoSizes[size]} chainId={null} transition={transition} />
              ) : (
                <ChainLogo
                  chainId={currentChainId ?? UniverseChainId.Mainnet}
                  size={NetworkLogoSizes[size]}
                  testId={TestID.TokensNetworkFilterSelected}
                  transition={transition}
                />
              )}
              {showDisplayName && (
                <Text variant={NetworkLabelTextVariants[size]} transition={transition}>
                  {isAllNetworks ? t('transaction.network.all') : chainInfo.label}
                </Text>
              )}
            </NetworkLabel>
          }
          buttonStyle={ButtonStyles[size]}
          dropdownStyle={StyledDropdown}
          adaptToSheet
          allowFlip
          alignRight={position === 'right'}
        >
          <ScrollView>
            {showMultichainOption && (
              <TableNetworkItem
                chainInfo={null}
                toggleMenu={toggleMenu}
                onPress={onPress}
                currentChainId={currentChainId}
              />
            )}
            {filteredChainIds.map(tableNetworkItemRenderer)}
          </ScrollView>
        </Dropdown>
      </Trace>
    </Flex>
  )
}

const TableNetworkItem = memo(function TableNetworkItem({
  chainInfo,
  toggleMenu,
  tab,
  unsupported,
  onPress,
  currentChainId,
}: {
  chainInfo: UniverseChainInfo | null
  toggleMenu: Dispatch<SetStateAction<boolean>>
  onPress: (chainId: UniverseChainId | undefined) => void
  tab?: ExploreTab
  unsupported?: boolean
  currentChainId?: UniverseChainId | undefined
}) {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const currentChainInfo = currentChainId ? getChainInfo(currentChainId) : undefined
  const newChains = useNewChainIds()

  const isAllNetworks = chainInfo === null
  const chainId = isAllNetworks ? undefined : chainInfo.id
  const isNew = chainId && newChains.includes(chainId)

  const chainName = chainId ? toGraphQLChain(chainId) : t('transaction.network.all')

  const isCurrentChain = isAllNetworks ? !currentChainInfo : currentChainInfo?.id === chainId

  const handlePress = () => {
    if (!unsupported) {
      onPress(chainId)
    }
    toggleMenu(false)
  }

  return (
    <Trace
      logPress
      page={InterfacePageName.ExplorePage}
      properties={{
        tab,
        chain: chainName.toString(),
        previousConnectedChain: currentChainInfo?.id
          ? toGraphQLChain(currentChainInfo.id)
          : t('transaction.network.all'),
      }}
    >
      <InternalMenuItem
        data-testid={`${TestID.TokensNetworkFilterOptionPrefix}${chainName.toLowerCase()}`}
        disabled={unsupported}
        onPress={handlePress}
      >
        <NetworkLabel>
          {isAllNetworks ? (
            <NetworkLogo chainId={null} />
          ) : (
            <ChainLogo chainId={chainId ?? UniverseChainId.Mainnet} size={20} />
          )}
          <ElementAfterText
            text={isAllNetworks ? t('transaction.network.all') : chainInfo.label}
            textProps={{ variant: 'body2', ...EllipsisTamaguiStyle }}
            element={isNew && !unsupported ? <NewTag /> : undefined}
          />
        </NetworkLabel>
        {/* separate from ElementAfterText as this is placed at the far right of the row, not next to the text */}
        {unsupported ? (
          <Badge fontSize={10}>{t('settings.setting.beta.tooltip')}</Badge>
        ) : isCurrentChain ? (
          <Check size={iconSizes.icon16} color={colors.accent1.val} />
        ) : null}
      </InternalMenuItem>
    </Trace>
  )
})
