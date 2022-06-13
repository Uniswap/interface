import { ChainId, Currency } from '@kyberswap/ks-sdk-core'
import { useWeb3React } from '@web3-react/core'
import { NETWORK_LABEL } from 'constants/networks'
import mixpanel from 'mixpanel-browser'
import { isMobile } from 'react-device-detect'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { Aggregator } from 'utils/aggregator'
import { useCallback, useEffect, useMemo } from 'react'
import { usePrevious } from 'react-use'
import { useSelector } from 'react-redux'
import { useETHPrice } from 'state/application/hooks'
import { AppState } from 'state'
import { formatUnits, isAddress } from 'ethers/lib/utils'
import { useLocation } from 'react-router-dom'
import { nativeNameFromETH } from 'utils'
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
  PRO_CHART_CLICKED,
  BASIC_CHART_CLICKED,
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
  DISCOVER_SWAP_DISCOVER_MORE_CLICKED,
  DISCOVER_SWAP_SEE_HERE_CLICKED,
  DISCOVER_SWAP_BUY_NOW_CLICKED,
  DISCOVER_SWAP_MORE_INFO_CLICKED,
  DISCOVER_SWAP_BUY_NOW_POPUP_CLICKED,
  ELASTIC_CREATE_POOL_INITIATED,
  ELASTIC_CREATE_POOL_COMPLETED,
  ELASTIC_ADD_LIQUIDITY_INITIATED,
  ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED,
  ELASTIC_ADD_LIQUIDITY_COMPLETED,
  ELASTIC_REMOVE_LIQUIDITY_INITIATED,
  ELASTIC_REMOVE_LIQUIDITY_COMPLETED,
  ELASTIC_INCREASE_LIQUIDITY_INITIATED,
  ELASTIC_INCREASE_LIQUIDITY_COMPLETED,
  ELASTIC_COLLECT_FEES_INITIATED,
  ELASTIC_COLLECT_FEES_COMPLETED,
  ELASTIC_DEPOSIT_LIQUIDITY_COMPLETED,
  ELASTIC_WITHDRAW_LIQUIDITY_COMPLETED,
  ELASTIC_STAKE_LIQUIDITY_COMPLETED,
  ELASTIC_UNSTAKE_LIQUIDITY_COMPLETED,
  ELASTIC_INDIVIDUAL_REWARD_HARVESTED,
  ELASTIC_ALLS_REWARD_HARVESTED,
  ELASTIC_ALL_REWARD_CLAIMED,
  FAUCET_MENU_CLICKED,
  FAUCET_REQUEST_INITIATED,
  FAUCET_REQUEST_COMPLETED,
  DISCOVER_CLICK_SUBSCRIBE_TRENDING_SOON,
  DISCOVER_CLICK_UNSUBSCRIBE_TRENDING_SOON,
  DISCOVER_SUBSCRIBE_TRENDING_SOON_SUCCESS,
  DISCOVER_UNSUBSCRIBE_TRENDING_SOON_SUCCESS,
}

export default function useMixpanel(trade?: Aggregator | undefined, currencies?: { [field in Field]?: Currency }) {
  const { chainId, account } = useWeb3React()
  const { saveGas } = useSwapState()
  const network = chainId && NETWORK_LABEL[chainId as ChainId]
  const inputCurrency = currencies && currencies[Field.INPUT]
  const outputCurrency = currencies && currencies[Field.OUTPUT]
  const inputSymbol = inputCurrency && inputCurrency.isNative ? nativeNameFromETH(chainId) : inputCurrency?.symbol
  const outputSymbol = outputCurrency && outputCurrency.isNative ? nativeNameFromETH(chainId) : outputCurrency?.symbol
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
          mixpanel.register_once({ wallet_address: account, platform: isMobile ? 'Mobile' : 'Web', network })
          mixpanel.track('Wallet Connected')
          break
        case MIXPANEL_TYPE.SWAP_INITIATED: {
          mixpanel.track('Swap Initiated', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            estimated_gas: trade?.gasUsd.toFixed(4),
            max_return_or_low_gas: saveGas ? 'Lowest Gas' : 'Maximum Return',
            trade_qty: trade?.inputAmount.toExact(),
          })

          break
        }
        case MIXPANEL_TYPE.SWAP_COMPLETED: {
          const { arbitrary, actual_gas, amountUSD, txHash } = payload
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
            tx_hash: txHash,
            max_return_or_low_gas: arbitrary.saveGas ? 'Lowest Gas' : 'Maximum Return',
            trade_qty: arbitrary.inputAmount,
            trade_amount_usd: amountUSD,
          })
          break
        }
        case MIXPANEL_TYPE.ADVANCED_MODE_ON: {
          mixpanel.track('Advanced Mode Switched On', {
            input_token: inputSymbol,
            output_token: outputSymbol,
          })
          break
        }
        case MIXPANEL_TYPE.SLIPPAGE_CHANGED: {
          const { new_slippage } = payload
          mixpanel.track('Slippage Changed', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            new_slippage,
          })
          break
        }
        case MIXPANEL_TYPE.LIVE_CHART_ON_OFF: {
          const { live_chart_on_or_off } = payload
          mixpanel.track('Live Chart Turned On/Off (Desktop)', {
            live_chart_on_or_off: live_chart_on_or_off ? 'On' : 'Off',
          })
          break
        }
        case MIXPANEL_TYPE.TRADING_ROUTE_ON_OFF: {
          const { trading_route_on_or_off } = payload
          mixpanel.track('Trading Route Turned On/Off (Desktop)', {
            trading_route_on_or_off: trading_route_on_or_off ? 'On' : 'Off',
          })
          break
        }
        case MIXPANEL_TYPE.LIVE_CHART_ON_MOBILE: {
          mixpanel.track('Live Chart Turned On (Mobile)')
          break
        }
        case MIXPANEL_TYPE.PRO_CHART_CLICKED: {
          mixpanel.track('Swap - Pro Live Chart - Pro button clicked on Swap Page')
          break
        }
        case MIXPANEL_TYPE.BASIC_CHART_CLICKED: {
          mixpanel.track('Swap - Pro Live Chart - Basic button clicked on Swap Page')
          break
        }
        case MIXPANEL_TYPE.TRADING_ROUTE_ON_MOBILE: {
          mixpanel.track('Trading Route Turned On (Mobile)')
          break
        }
        case MIXPANEL_TYPE.TOKEN_INFO_CHECKED: {
          mixpanel.track('Token information viewed in Info tab (Swap Page)', {
            input_token: inputSymbol,
            output_token: outputSymbol,
          })
          break
        }
        case MIXPANEL_TYPE.TOKEN_SWAP_LINK_SHARED: {
          mixpanel.track('Token Swap Link Shared', {
            input_token: inputSymbol,
            output_token: outputSymbol,
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
          mixpanel.track('Create New Pool Initiated')
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
          })
          break
        }
        case MIXPANEL_TYPE.ADD_LIQUIDITY_INITIATED: {
          const { token_1, token_2, amp } = payload
          mixpanel.track('Add Liquidity Initiated', {
            token_1,
            token_2,
            amp,
          })
          break
        }
        case MIXPANEL_TYPE.ADD_LIQUIDITY_COMPLETED: {
          mixpanel.track('Add Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.REMOVE_LIQUIDITY_COMPLETED: {
          mixpanel.track('Remove Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.REMOVE_LIQUIDITY_INITIATED: {
          const { token_1, token_2, amp } = payload
          mixpanel.track('Remove Liquidity Initiated', {
            token_1,
            token_2,
            amp,
          })

          break
        }
        case MIXPANEL_TYPE.MIGRATE_LIQUIDITY_INITIATED: {
          mixpanel.track('Migrate Liquidity Initiated')
          break
        }
        case MIXPANEL_TYPE.CLAIM_REWARDS_INITIATED: {
          mixpanel.track('Claim Rewards Initiated')
          break
        }
        case MIXPANEL_TYPE.IMPORT_POOL_INITIATED: {
          mixpanel.track('Import Pool Initiated')

          break
        }
        case MIXPANEL_TYPE.MYPOOLS_STAKED_VIEWED: {
          mixpanel.track(`My Pools - 'Staked Pools' Tab Viewed`, {})

          break
        }
        case MIXPANEL_TYPE.MYPOOLS_POOLS_VIEWED: {
          mixpanel.track(`My Pools - 'Pools' Tab Viewed`)

          break
        }
        case MIXPANEL_TYPE.FARMS_ACTIVE_VIEWED: {
          mixpanel.track(`Farms - 'Active' Tab Viewed`)

          break
        }
        case MIXPANEL_TYPE.FARMS_ENDING_VIEWED: {
          mixpanel.track(`Farms - 'Ending' Tab Viewed`)

          break
        }
        case MIXPANEL_TYPE.FARMS_UPCOMING_VIEWED: {
          mixpanel.track(`Farms - 'Upcoming' Tab Viewed`)

          break
        }
        case MIXPANEL_TYPE.FARMS_MYVESTING_VIEWED: {
          mixpanel.track(`Farms - 'My Vesting' Tab Viewed`)

          break
        }
        case MIXPANEL_TYPE.INDIVIDUAL_REWARD_HARVESTED: {
          const { reward_tokens_and_amounts } = payload
          mixpanel.track('Individual Reward Harvested', { reward_tokens_and_qty: reward_tokens_and_amounts })

          break
        }
        case MIXPANEL_TYPE.ALL_REWARDS_HARVESTED: {
          const { reward_tokens_and_amounts } = payload

          mixpanel.track('All Rewards Harvested', { reward_tokens_and_qty: reward_tokens_and_amounts })

          break
        }
        case MIXPANEL_TYPE.SINGLE_REWARD_CLAIMED: {
          const { reward_token, reward_amount } = payload

          mixpanel.track('Single Reward Claimed', { reward_token, reward_qty: reward_amount })

          break
        }
        case MIXPANEL_TYPE.ALL_REWARDS_CLAIMED: {
          const { reward_tokens_and_amounts } = payload

          mixpanel.track('All Rewards Claimed', { reward_tokens_and_qty: reward_tokens_and_amounts })
          break
        }
        case MIXPANEL_TYPE.ABOUT_SWAP_CLICKED: {
          mixpanel.track('About - Swap Clicked')
          break
        }
        case MIXPANEL_TYPE.ABOUT_START_EARNING_CLICKED: {
          mixpanel.track('About - Start Earning Clicked')
          break
        }
        case MIXPANEL_TYPE.ABOUT_VIEW_FARMS_CLICKED: {
          mixpanel.track('About - View Farms Clicked')
          break
        }
        case MIXPANEL_TYPE.ABOUT_CREATE_NEW_POOL_CLICKED: {
          mixpanel.track('About - Create New Pool Clicked')
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
          mixpanel.track('Discover - Trending Soon Tab Clicked')
          break
        }
        case MIXPANEL_TYPE.DISCOVER_TRENDING_CLICKED: {
          mixpanel.track('Discover - Trending Tab Clicked')
          break
        }
        case MIXPANEL_TYPE.DISCOVER_CLICK_SUBSCRIBE_TRENDING_SOON: {
          mixpanel.track(`Discover - 'Subscribe' clicked on Trending Soon`)
          break
        }
        case MIXPANEL_TYPE.DISCOVER_CLICK_UNSUBSCRIBE_TRENDING_SOON: {
          mixpanel.track(`Discover - 'Unsubscribe' clicked on Trending Soon`)
          break
        }
        case MIXPANEL_TYPE.DISCOVER_SUBSCRIBE_TRENDING_SOON_SUCCESS: {
          mixpanel.track(`Discover - 'Subscribed' Trending Soon successfully`)
          break
        }
        case MIXPANEL_TYPE.DISCOVER_UNSUBSCRIBE_TRENDING_SOON_SUCCESS: {
          mixpanel.track(`Discover - 'Unsubscribed' Trending Soon successfully`)
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
        case MIXPANEL_TYPE.DISCOVER_SWAP_DISCOVER_MORE_CLICKED: {
          mixpanel.track('Discover - "Discover more" clicked from Swap Page')
          break
        }
        case MIXPANEL_TYPE.DISCOVER_SWAP_SEE_HERE_CLICKED: {
          const { trending_token } = payload
          mixpanel.track('Discover - "See here" clicked from Swap page', { trending_token })
          break
        }
        case MIXPANEL_TYPE.DISCOVER_SWAP_BUY_NOW_CLICKED: {
          const { trending_token } = payload
          mixpanel.track('Discover - "Buy Now" clicked on Swap Page', { trending_token })
          break
        }
        case MIXPANEL_TYPE.DISCOVER_SWAP_MORE_INFO_CLICKED: {
          const { trending_token } = payload
          mixpanel.track('Discover - "More info" clicked on Swap Page', { trending_token })
          break
        }
        case MIXPANEL_TYPE.DISCOVER_SWAP_BUY_NOW_POPUP_CLICKED: {
          const { trending_token } = payload
          mixpanel.track('Discover - "Buy Now" clicked in pop-up after \'More Info\' on Swap page', {
            trending_token,
          })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_CREATE_POOL_INITIATED: {
          mixpanel.track('Elastic Pools - Create New Pool Initiated', {})
          break
        }
        case MIXPANEL_TYPE.ELASTIC_CREATE_POOL_COMPLETED: {
          mixpanel.track('Elastic Pools - Create New Pool Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_INITIATED: {
          mixpanel.track('Elastic Pools - Add Liquidity Initiated', {})
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED: {
          mixpanel.track('Elastic Pools - Add Liquidity Initiated in Token Pair List', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Pools - Add Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_REMOVE_LIQUIDITY_INITIATED: {
          mixpanel.track('Elastic Pools - My Pools - Remove Liquidity Initiated', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_REMOVE_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Pools - My Pools - Remove Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_INITIATED: {
          mixpanel.track('Elastic Pools - My Pools - Increase Liquidity Initiated', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Pools - My Pools - Increase Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_COLLECT_FEES_INITIATED: {
          mixpanel.track('Elastic Pools - My Pools - Collect Fees Initiated', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_COLLECT_FEES_COMPLETED: {
          mixpanel.track('Elastic Pools - My Pools - Collect Fees Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_DEPOSIT_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Farms - Deposit Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_WITHDRAW_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Farms - Withdraw Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_STAKE_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Farms - Stake Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_UNSTAKE_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Farms - Unstake Liquidity Completed', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_INDIVIDUAL_REWARD_HARVESTED: {
          mixpanel.track('Elastics Farms - Individual Reward Harvested', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ALLS_REWARD_HARVESTED: {
          mixpanel.track('Elastic Farms - All Rewards Harvested', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ALL_REWARD_CLAIMED: {
          mixpanel.track('Elastic Farms - Reward Claimed', payload)
          break
        }
        case MIXPANEL_TYPE.FAUCET_MENU_CLICKED: {
          mixpanel.track('Faucet feature - Faucet button clicked on Menu')
          break
        }
        case MIXPANEL_TYPE.FAUCET_REQUEST_INITIATED: {
          mixpanel.track('Faucet feature - Request faucet Initiated')
          break
        }
        case MIXPANEL_TYPE.FAUCET_REQUEST_COMPLETED: {
          mixpanel.track('Faucet feature - Request faucet Completed')
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
  const pathName = useMemo(() => {
    if (location.pathname.split('/')[1] !== 'proamm') return location.pathname.split('/')[1]
    return 'proamm/' + location.pathname.split('/')[2]
  }, [location])

  useEffect(() => {
    if (account && isAddress(account)) {
      mixpanel.init(process.env.REACT_APP_MIXPANEL_PROJECT_TOKEN || '', {
        debug: process.env.REACT_APP_MAINNET_ENV === 'staging',
      })
      mixpanel.identify(account)

      const getQueryParam = (url: string, param: string) => {
        param = param.replace(/[[]/, '[').replace(/[]]/, ']')
        var regexS = '[?&]' + param + '=([^&#]*)',
          regex = new RegExp(regexS),
          results: any = regex.exec(url)
        if (results === null || (results && typeof results[1] !== 'string' && results[1].length)) {
          return ''
        } else {
          return decodeURIComponent(results[1]).replace(/\W/gi, ' ')
        }
      }
      var campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' '),
        kw = '',
        params: { [key: string]: any } = {},
        first_params: { [key: string]: any } = {}
      var index
      for (index = 0; index < campaign_keywords.length; ++index) {
        kw = getQueryParam(document.URL, campaign_keywords[index])
        if (kw.length) {
          params[campaign_keywords[index] + ' [last touch]'] = kw
        }
      }
      for (index = 0; index < campaign_keywords.length; ++index) {
        kw = getQueryParam(document.URL, campaign_keywords[index])
        if (kw.length) {
          first_params[campaign_keywords[index] + ' [first touch]'] = kw
        }
      }
      mixpanel.people.set(params)
      mixpanel.people.set_once(first_params)
      mixpanel.register_once(params)

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
    if (pathName) {
      let pageName = ''
      switch (pathName) {
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
        case 'proamm/swap':
          pageName = 'Promm Swap'
          break
        case 'proamm/pool':
          pageName = 'Promm Pool'
          break
        case 'proamm/remove':
          pageName = 'Promm Remove Liquidity'
          break
        case 'proamm/add':
          pageName = 'Promm Add Liquidity'
          break
        case 'proamm/increase':
          pageName = 'Promm Increase Liquidity'
          break
        default:
          break
      }
      pageName && mixpanelHandler(MIXPANEL_TYPE.PAGE_VIEWED, { page: pageName })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathName, account, chainId])
}
