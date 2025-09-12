import { useTranslation } from 'react-i18next'
import { saveDappChain } from 'src/app/features/dapp/actions'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { useDappLastChainId } from 'src/app/features/dapp/hooks'
import { Flex, Popover, Text, TouchableArea } from 'ui/src'
import { CheckCircleFilled, RotatableChevron } from 'ui/src/components/icons'
import { usePreventOverflowBelowFold } from 'ui/src/hooks/usePreventOverflowBelowFold'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { ExtensionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

const BUTTON_OFFSET = 20

interface SwitchNetworksModalProps {
  onPress: () => void
}

export function SwitchNetworksModal({ onPress }: SwitchNetworksModalProps): JSX.Element {
  const { t } = useTranslation()
  const { dappUrl } = useDappContext()
  const activeChain = useDappLastChainId(dappUrl)
  const { chains: enabledChains } = useEnabledChains()

  const onNetworkClicked = async (chainId: UniverseChainId): Promise<void> => {
    await saveDappChain(dappUrl, chainId)
    sendAnalyticsEvent(ExtensionEventName.SidebarSwitchChain, {
      previousChainId: activeChain,
      newChainId: chainId,
    })
  }

  const handlePress = (): void => {
    onPress()
  }

  const { ref, maxHeight } = usePreventOverflowBelowFold()

  return (
    <Flex
      ref={ref}
      alignContent="center"
      // TODO:  update background color to blurry scrim when available
      backgroundColor="$surface1"
      borderRadius="$rounded24"
      pt="$spacing8"
      width={220}
      maxHeight={maxHeight - BUTTON_OFFSET}
    >
      <Flex px="$spacing8">
        <Flex row alignItems="center" py="$spacing4" width="100%">
          <TouchableArea onPress={handlePress}>
            <RotatableChevron
              color="$neutral3"
              direction="left"
              flexShrink={1}
              height={iconSizes.icon16}
              width={iconSizes.icon16}
            />
          </TouchableArea>
          <Flex centered fill py="$spacing8">
            <Text color="$neutral1" variant="body3">
              {t('extension.connection.network')}
            </Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex shrink $platform-web={{ overflow: 'auto' }}>
        {enabledChains.map((chain: UniverseChainId) => {
          return (
            <Popover.Close asChild key={chain}>
              {/* TODO(WALL-5883): Use new component */}
              <TouchableArea
                borderRadius="$rounded12"
                hoverStyle={{ backgroundColor: '$surface2' }}
                justifyContent="space-between"
                p="$spacing8"
                onPress={async (): Promise<void> => onNetworkClicked(chain)}
              >
                <Flex grow row alignItems="center" justifyContent="space-between">
                  <Flex grow row alignItems="center" gap="$spacing8">
                    <NetworkLogo chainId={chain} size={iconSizes.icon20} />
                    <Text color="$neutral1" variant="subheading2">
                      {getChainLabel(chain)}
                    </Text>
                  </Flex>
                  {activeChain === chain ? (
                    <Flex row>
                      <CheckCircleFilled color="$accent3" size="$icon.20" />
                    </Flex>
                  ) : null}
                </Flex>
              </TouchableArea>
            </Popover.Close>
          )
        })}
      </Flex>
    </Flex>
  )
}
