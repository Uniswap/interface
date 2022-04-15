import { ChainId, Currency } from '@dynamic-amm/sdk'
import { useWeb3React } from '@web3-react/core'
import { NETWORK_LABEL } from 'constants/networks'
import mixpanel from 'mixpanel-browser'
import { isMobile } from 'react-device-detect'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { Aggregator } from 'utils/aggregator'
import { useCallback, useEffect } from 'react'
import { usePrevious } from 'react-use'
import { useSelector } from 'react-redux'
import { useETHPrice } from 'state/application/hooks'
import { AppState } from 'state'
import { formatUnits, isAddress } from 'ethers/lib/utils'
import { useLocation } from 'react-router-dom'
export enum MIXPANEL_TYPE {
  PAGE_VIEWED,
  WALLET_CONNECTED,
  SWAP_INITIATED,
  SWAP_COMPLETED,
  ADVANCED_MODE_ON,
  SLIPPAGE_CHANGED,
  LIVE_CHART_ON_OFF,
  TRADING_ROUTE_ON_OFF,
  LIVE_CHART_ON_MOBILE,
  TRADING_ROUTE_ON_MOBILE,
  TOKEN_INFO_CHECKED,
  TOKEN_SWAP_LINK_SHARED,
  CHAIN_SWITCHED,
  CREATE_POOL_INITITATED,
  CREATE_POOL_COMPLETED,
  CREATE_POOL_LINK_SHARED,
  ADD_LIQUIDITY_INITIATED,
  ADD_LIQUIDITY_COMPLETED,
  REMOVE_LIQUIDITY_COMPLETED,
  REMOVE_LIQUIDITY_INITIATED,
  MIGRATE_LIQUIDITY_INITIATED,
  CLAIM_REWARDS_INITIATED,
  IMPORT_POOL_INITIATED,
  MYPOOLS_STAKED_VIEWED,
  MYPOOLS_POOLS_VIEWED,
  FARMS_ACTIVE_VIEWED,
  FARMS_ENDING_VIEWED,
  FARMS_UPCOMING_VIEWED,
  FARMS_MYVESTING_VIEWED,
  INDIVIDUAL_REWARD_HARVESTED,
  ALL_REWARDS_HARVESTED,
  SINGLE_REWARD_CLAIMED,
  ALL_REWARDS_CLAIMED,
  ABOUT_SWAP_CLICKED,
  ABOUT_START_EARNING_CLICKED,
  ABOUT_VIEW_FARMS_CLICKED,
  ABOUT_CREATE_NEW_POOL_CLICKED,
  CREATE_REFERRAL_CLICKED,
  DISCOVER_TRENDING_SOON_CLICKED,
  DISCOVER_TRENDING_CLICKED,
  DISCOVER_SWAP_INITIATED,
}

export const nativeNameFromETH = (chainId: any) => {
  if (!chainId) return 'ETH'
  return [137, 80001].includes(chainId)
    ? 'MATIC'
    : [97, 56].includes(chainId)
    ? 'BNB'
    : [43113, 43114].includes(chainId)
    ? 'AVAX'
    : [250].includes(chainId)
    ? 'FTM'
    : [25, 338].includes(chainId)
    ? 'CRO'
    : chainId === ChainId.BTTC
    ? 'BTT'
    : chainId === ChainId.VELAS
    ? 'VLX'
    : 'ETH'
}

export default function useMixpanel(trade?: Aggregator | undefined, currencies?: { [field in Field]?: Currency }) {
  const { chainId, account } = useWeb3React()
  const { saveGas } = useSwapState()
  const network = chainId && NETWORK_LABEL[chainId as ChainId]
  const inputCurrency = currencies && currencies[Field.INPUT]
  const outputCurrency = currencies && currencies[Field.OUTPUT]
  const inputSymbol =
    inputCurrency && inputCurrency === Currency.ETHER ? nativeNameFromETH(chainId) : inputCurrency?.symbol
  const outputSymbol =
    outputCurrency && outputCurrency === Currency.ETHER ? nativeNameFromETH(chainId) : outputCurrency?.symbol
  const gasPrice = useSelector((state: AppState) => state.application.gasPrice)
  const ethPrice = useETHPrice()
  const mixpanelHandler = useCallback(
    (type: MIXPANEL_TYPE, payload?: any) => {
      if (!account) {
        return
      }
      switch (type) {
        case MIXPANEL_TYPE.PAGE_VIEWED: {
          const { page } = payload
          page && mixpanel.track(page + ' Page Viewed')
          break
        }
        case MIXPANEL_TYPE.WALLET_CONNECTED:
          mixpanel.register({ wallet_address: account, platform: isMobile ? 'Mobile' : 'Web' })
          mixpanel.track('Wallet Connected')
          break
        case MIXPANEL_TYPE.SWAP_INITIATED: {
          mixpanel.track('Swap Initiated', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            estimated_gas: trade?.gasUsd.toFixed(4),
            max_return_or_low_gas: saveGas ? 'Lowest Gas' : 'Maximum Return',
            network,
            trade_amount: trade?.inputAmount.toExact(),
          })
          break
        }
        case MIXPANEL_TYPE.SWAP_COMPLETED: {
          const { arbitrary, actual_gas } = payload
          mixpanel.track('Swap Completed', {
            input_token: arbitrary.inputSymbol,
            output_token: arbitrary.outputSymbol,
            actual_gas:
              gasPrice &&
              ethPrice &&
              ethPrice.currentPrice &&
              (
                actual_gas.toNumber() *
                parseFloat(formatUnits(gasPrice?.standard, 18)) *
                parseFloat(ethPrice.currentPrice)
              ).toFixed(4),
            max_return_or_low_gas: arbitrary.saveGas ? 'Lowest Gas' : 'Maximum Return',
            network,
            trade_amount: arbitrary.inputAmount,
          })
          break
        }
        case MIXPANEL_TYPE.ADVANCED_MODE_ON: {
          mixpanel.track('Advanced Mode Switched On', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            network,
          })
          break
        }
        case MIXPANEL_TYPE.SLIPPAGE_CHANGED: {
          const { new_slippage } = payload
          mixpanel.track('Slippage Changed', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            new_slippage,
            network,
          })
          break
        }
        case MIXPANEL_TYPE.LIVE_CHART_ON_OFF: {
          const { live_chart_on_or_off } = payload
          mixpanel.track('Live Chart Turned On/Off (Desktop)', {
            network,
            live_chart_on_or_off: live_chart_on_or_off ? 'On' : 'Off',
          })
          break
        }
        case MIXPANEL_TYPE.TRADING_ROUTE_ON_OFF: {
          const { trading_route_on_or_off } = payload
          mixpanel.track('Trading Route Turned On/Off (Desktop)', {
            network,
            trading_route_on_or_off: trading_route_on_or_off ? 'On' : 'Off',
          })
          break
        }
        case MIXPANEL_TYPE.LIVE_CHART_ON_MOBILE: {
          mixpanel.track('Live Chart Turned On (Mobile)', {
            network,
          })
          break
        }
        case MIXPANEL_TYPE.TRADING_ROUTE_ON_MOBILE: {
          mixpanel.track('Trading Route Turned On (Mobile)', {
            network,
          })
          break
        }
        case MIXPANEL_TYPE.TOKEN_INFO_CHECKED: {
          mixpanel.track('Token information viewed in Info tab (Swap Page)', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            network,
          })
          break
        }
        case MIXPANEL_TYPE.TOKEN_SWAP_LINK_SHARED: {
          mixpanel.track('Token Swap Link Shared', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            network,
          })
          break
        }
        case MIXPANEL_TYPE.CHAIN_SWITCHED: {
          const { old_network, new_network } = payload
          mixpanel.track('Chain Switched', {
            old_network,
            new_network,
          })
          break
        }
        case MIXPANEL_TYPE.CREATE_POOL_INITITATED: {
          mixpanel.track('Create New Pool Initiated', {
            network,
          })
          break
        }
        case MIXPANEL_TYPE.CREATE_POOL_COMPLETED: {
          const { token_1, token_2, amp } = payload
          mixpanel.track('Create New Pool Completed', {
            token_1,
            token_2,
            amp,
          })
          break
        }
        case MIXPANEL_TYPE.CREATE_POOL_LINK_SHARED: {
          const { token_1, token_2 } = payload
          mixpanel.track('Create New Pool Link Shared', {
            token_1,
            token_2,
            network,
          })
          break
        }
        case MIXPANEL_TYPE.ADD_LIQUIDITY_INITIATED: {
          const { token_1, token_2 } = payload
          mixpanel.track('Add Liquidity Initiated', {
            token_1,
            token_2,
            network,
          })
          break
        }
        case MIXPANEL_TYPE.ADD_LIQUIDITY_COMPLETED: {
          const { token_1, token_2, add_liquidity_method } = payload
          mixpanel.track('Add Liquidity Completed', {
            token_1,
            token_2,
            add_liquidity_method,
            network,
          })
          break
        }
        case MIXPANEL_TYPE.REMOVE_LIQUIDITY_COMPLETED: {
          const { token_1, token_2, remove_liquidity_method } = payload

          mixpanel.track('Remove Liquidity Completed', {
            token_1,
            token_2,
            remove_liquidity_method,
            network,
          })

          break
        }
        case MIXPANEL_TYPE.REMOVE_LIQUIDITY_INITIATED: {
          const { token_1, token_2 } = payload

          mixpanel.track('Remove Liquidity Initiated', {
            token_1,
            token_2,
            network,
          })

          break
        }
        case MIXPANEL_TYPE.MIGRATE_LIQUIDITY_INITIATED: {
          mixpanel.track('Migrate Liquidity Initiated', {
            network,
          })

          break
        }
        case MIXPANEL_TYPE.CLAIM_REWARDS_INITIATED: {
          mixpanel.track('Claim Rewards Initiated', { network })

          break
        }
        case MIXPANEL_TYPE.IMPORT_POOL_INITIATED: {
          mixpanel.track('Import Pool Initiated', { network })

          break
        }
        case MIXPANEL_TYPE.MYPOOLS_STAKED_VIEWED: {
          mixpanel.track(`My Pools - 'Staked Pools' Tab Viewed`, {
            network,
          })

          break
        }
        case MIXPANEL_TYPE.MYPOOLS_POOLS_VIEWED: {
          mixpanel.track(`My Pools - 'Pools' Tab Viewed`, { network })

          break
        }
        case MIXPANEL_TYPE.FARMS_ACTIVE_VIEWED: {
          mixpanel.track(`Farms - 'Active' Tab Viewed`, { network })

          break
        }
        case MIXPANEL_TYPE.FARMS_ENDING_VIEWED: {
          mixpanel.track(`Farms - 'Ending' Tab Viewed`, { network })

          break
        }
        case MIXPANEL_TYPE.FARMS_UPCOMING_VIEWED: {
          mixpanel.track(`Farms - 'Upcoming' Tab Viewed`, { network })

          break
        }
        case MIXPANEL_TYPE.FARMS_MYVESTING_VIEWED: {
          mixpanel.track(`Farms - 'My Vesting' Tab Viewed`, { network })

          break
        }
        case MIXPANEL_TYPE.INDIVIDUAL_REWARD_HARVESTED: {
          const { reward_tokens_and_amounts } = payload
          mixpanel.track('Individual Reward Harvested', { network, reward_tokens_and_amounts })

          break
        }
        case MIXPANEL_TYPE.ALL_REWARDS_HARVESTED: {
          const { reward_tokens_and_amounts } = payload

          mixpanel.track('All Rewards Harvested', { network, reward_tokens_and_amounts })

          break
        }
        case MIXPANEL_TYPE.SINGLE_REWARD_CLAIMED: {
          const { reward_token, reward_amount } = payload

          mixpanel.track('Single Reward Claimed', { network, reward_token, reward_amount })

          break
        }
        case MIXPANEL_TYPE.ALL_REWARDS_CLAIMED: {
          const { reward_tokens_and_amounts } = payload

          mixpanel.track('All Rewards Claimed', { network, reward_tokens_and_amounts })
          break
        }
        case MIXPANEL_TYPE.ABOUT_SWAP_CLICKED: {
          mixpanel.track('About - Swap Clicked', { network })
          break
        }
        case MIXPANEL_TYPE.ABOUT_START_EARNING_CLICKED: {
          mixpanel.track('About - Start Earning Clicked', { network })
          break
        }
        case MIXPANEL_TYPE.ABOUT_VIEW_FARMS_CLICKED: {
          mixpanel.track('About - View Farms Clicked', { network })
          break
        }
        case MIXPANEL_TYPE.ABOUT_CREATE_NEW_POOL_CLICKED: {
          mixpanel.track('About - Create New Pool Clicked', { network })
          break
        }
        case MIXPANEL_TYPE.CREATE_REFERRAL_CLICKED: {
          const { referral_commission, input_token, output_token } = payload
          mixpanel.track('Create Referral Link Clicked', {
            referral_commission,
            input_token,
            output_token,
            chain: network,
          })
          break
        }
        case MIXPANEL_TYPE.DISCOVER_TRENDING_SOON_CLICKED: {
          mixpanel.track('Discover - Trending Soon Tab Clicked', { network })
          break
        }
        case MIXPANEL_TYPE.DISCOVER_TRENDING_CLICKED: {
          mixpanel.track('Discover - Trending Tab Clicked', { network })

          break
        }
        case MIXPANEL_TYPE.DISCOVER_SWAP_INITIATED: {
          const { token_name, trending_or_trending_soon, token_on_chain, token_contract_address } = payload
          mixpanel.track('Discover - Swap Initiated', {
            token_name,
            trending_or_trending_soon,
            token_on_chain,
            token_contract_address,
          })

          break
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currencies, network, saveGas, account, trade, mixpanel.hasOwnProperty('get_distinct_id')],
  )
  return { mixpanelHandler }
}

export const useGlobalMixpanelEvents = () => {
  const { account, chainId } = useWeb3React()
  const { mixpanelHandler } = useMixpanel()
  const oldNetwork = usePrevious(chainId)
  const location = useLocation()

  useEffect(() => {
    if (account && isAddress(account)) {
      mixpanel.init(process.env.REACT_APP_MIXPANEL_PROJECT_TOKEN || '', {
        debug: process.env.REACT_APP_MAINNET_ENV === 'staging',
      })
      mixpanel.identify(account)
      mixpanel.people.set({})
      mixpanelHandler(MIXPANEL_TYPE.WALLET_CONNECTED, { account })
    }
    return () => {
      if (mixpanel.hasOwnProperty('persistence')) {
        mixpanel.reset()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account])

  useEffect(() => {
    if (oldNetwork) {
      mixpanelHandler(MIXPANEL_TYPE.CHAIN_SWITCHED, {
        new_network: chainId && NETWORK_LABEL[chainId as ChainId],
        old_network: oldNetwork && NETWORK_LABEL[oldNetwork as ChainId],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  useEffect(() => {
    if (location && location.pathname) {
      let pageName = ''
      const pathname = location.pathname.split('/')[1]
      switch (pathname) {
        case 'swap':
          pageName = 'Swap'
          break
        case 'find':
          pageName = 'Pool Finder'
          break
        case 'pools':
          pageName = 'Pools'
          break
        case 'farms':
          pageName = 'Farms'
          break
        case 'myPools':
          pageName = 'My Pools'
          break
        case 'migration':
          pageName = 'Migration'
          break
        case 'create':
          pageName = 'Create Pool'
          break
        case 'add':
          pageName = 'Add Liquidity'
          break
        case 'remove':
          pageName = 'Remove Liquidity'
          break
        case 'about':
          pageName = 'About'
          break
        case 'referral':
          pageName = 'Referral'
          break
        case 'discover':
          pageName = 'Discover'
          break
        default:
          break
      }
      pageName && mixpanelHandler(MIXPANEL_TYPE.PAGE_VIEWED, { page: pageName })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, location.pathname, account])
}
