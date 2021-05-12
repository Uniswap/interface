import React from 'react'
import styled from 'styled-components'
import { RoutablePlatform, Trade } from 'dxswap-sdk'
import { useLastTruthy } from '../../hooks/useLast'
import { AdvancedSwapDetails } from './AdvancedSwapDetails'
import { SwapPlatformSelector } from './SwapPlatformSelector'
import { AutoColumn } from '../Column'
import { Settings } from 'react-feather'
import { Box, Flex } from 'rebass'
import { useMainnetGasPrices, useToggleSettingsMenu } from '../../state/application/hooks'
import { GreenGasPriceOption, OrangeGasPriceOption, PurpleGasPriceOption } from '../GasBadges'
import { formatUnits } from 'ethers/lib/utils'
import { MainnetGasPrice } from '../../state/application/actions'
import { RowFixed } from '../Row'
import { useMultihopManager, useUserPreferredGasPrice } from '../../state/user/hooks'
import { transparentize } from 'polished'

const HideableAutoColumn = styled(AutoColumn)<{ show: boolean }>`
  transform: ${({ show }) => (show ? 'translateY(8px)' : 'translateY(-100%)')};
  transition: transform 300ms ease;
  z-index: -1;
`

const AdvancedDetailsFooter = styled.div<{
  clickable?: boolean
  fullWidth?: boolean
  padding: string
  height?: string
}>`
  width: ${props => (props.fullWidth ? '100%' : 'auto')};
  max-width: 412px;
  height: ${props => (props.height ? props.height : 'auto')};
  padding: ${props => props.padding};
  color: ${({ theme }) => theme.purple3};
  background-color: ${props => transparentize(0.45, props.theme.bg1)};
  border: solid 1px #292643;
  border-radius: 12px;
  backdrop-filter: blur(16px);
  cursor: ${props => (props.clickable ? 'pointer' : 'auto')};
  box-shadow: 0px 6px 14px rgba(0, 0, 0, 0.1);
`

export const MultihopSwitch = styled.div<{ active: boolean }>`
  padding: 0 4px;
  height: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  line-height: 11px;
  letter-spacing: 0em;
  color: ${props => (props.active ? props.theme.green1 : props.theme.red1)};
  background-color: ${props => transparentize(0.92, props.active ? props.theme.green1 : props.theme.red1)};
  border: solid 1px ${props => (props.active ? props.theme.green1 : props.theme.red1)};
  transition: border 0.3s ease, background-color 0.3s ease, color 0.3s ease;
  cursor: pointer;
`

interface AdvancedSwapDetailsDropdownProps {
  trade?: Trade
  allPlatformTrades?: (Trade | undefined)[] | undefined
  onSelectedPlatformChange: (newPlatform: RoutablePlatform) => void
}

export default function AdvancedSwapDetailsDropdown({
  trade,
  allPlatformTrades,
  onSelectedPlatformChange,
  ...rest
}: AdvancedSwapDetailsDropdownProps) {
  const [userPreferredMainnetGasPrice, setUserPreferredMainnetGasPrice] = useUserPreferredGasPrice()
  const [multihopEnabled, toggleMultihop] = useMultihopManager()
  const toggleSettingsMenu = useToggleSettingsMenu()
  const mainnetGasPrices = useMainnetGasPrices()
  const lastTrade = useLastTruthy(trade)

  const getGasPriceClickHandler = (priceVariant: MainnetGasPrice) => () => {
    setUserPreferredMainnetGasPrice(priceVariant)
  }

  return (
    <HideableAutoColumn gap="8px" show={!!trade}>
      <AdvancedDetailsFooter fullWidth padding="12px">
        <SwapPlatformSelector
          selectedTrade={trade}
          allPlatformTrades={allPlatformTrades}
          onSelectedPlatformChange={onSelectedPlatformChange}
        />
        <AdvancedSwapDetails {...rest} trade={trade ?? lastTrade ?? undefined} />
      </AdvancedDetailsFooter>
      <Flex>
        <Box flex="1">
          <AdvancedDetailsFooter padding="8px" height="33px">
            <Flex justifyContent="space-between">
              <Box>
                {!!mainnetGasPrices ? (
                  <RowFixed>
                    <PurpleGasPriceOption
                      compact
                      onClick={getGasPriceClickHandler(MainnetGasPrice.INSTANT)}
                      active={userPreferredMainnetGasPrice === MainnetGasPrice.INSTANT}
                    >
                      INSTANT{' '}
                      {Number.parseFloat(formatUnits(mainnetGasPrices[MainnetGasPrice.INSTANT], 'gwei')).toFixed(0)}{' '}
                      gwei
                    </PurpleGasPriceOption>
                    <OrangeGasPriceOption
                      compact
                      onClick={getGasPriceClickHandler(MainnetGasPrice.FAST)}
                      active={userPreferredMainnetGasPrice === MainnetGasPrice.FAST}
                    >
                      FAST {Number.parseFloat(formatUnits(mainnetGasPrices[MainnetGasPrice.FAST], 'gwei')).toFixed(0)}{' '}
                      gwei
                    </OrangeGasPriceOption>
                    <GreenGasPriceOption
                      compact
                      onClick={getGasPriceClickHandler(MainnetGasPrice.NORMAL)}
                      active={userPreferredMainnetGasPrice === MainnetGasPrice.NORMAL}
                    >
                      NORMAL{' '}
                      {Number.parseFloat(formatUnits(mainnetGasPrices[MainnetGasPrice.NORMAL], 'gwei')).toFixed(0)} gwei
                    </GreenGasPriceOption>
                  </RowFixed>
                ) : (
                  <div />
                )}
              </Box>
              <Box>
                <MultihopSwitch onClick={toggleMultihop} active={multihopEnabled}>
                  MULTIHOP
                </MultihopSwitch>
              </Box>
            </Flex>
          </AdvancedDetailsFooter>
        </Box>
        <Box ml="8px">
          <AdvancedDetailsFooter padding="8px" clickable onClick={toggleSettingsMenu} height="33px">
            <Settings size="16px" />
          </AdvancedDetailsFooter>
        </Box>
      </Flex>
    </HideableAutoColumn>
  )
}
