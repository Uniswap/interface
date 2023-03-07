import { ChainId, Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { formatUnits, isAddress } from 'ethers/lib/utils'
import mixpanel from 'mixpanel-browser'
import { useCallback, useEffect, useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { usePrevious } from 'react-use'

import {
  GET_MINT_VALUES_AFTER_CREATE_POOL_SUCCESS,
  GET_POOL_VALUES_AFTER_BURNS_SUCCESS,
  GET_POOL_VALUES_AFTER_MINTS_SUCCESS,
} from 'apollo/queries'
import {
  PROMM_GET_MINT_VALUES_AFTER_CREATE_POOL_SUCCESS,
  PROMM_GET_POOL_VALUES_AFTER_BURNS_SUCCESS,
  PROMM_GET_POOL_VALUES_AFTER_MINTS_SUCCESS,
} from 'apollo/queries/promm'
import { ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { AppDispatch, AppState } from 'state'
import { useETHPrice, useKyberSwapConfig } from 'state/application/hooks'
import { RANGE } from 'state/mint/proamm/type'
import { Field } from 'state/swap/actions'
import { useSwapState } from 'state/swap/hooks'
import { modifyTransaction } from 'state/transactions/actions'
import { TRANSACTION_TYPE, TransactionDetails, TransactionExtraInfo2Token } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'

export enum MIXPANEL_TYPE {
  PAGE_VIEWED,
  WALLET_CONNECTED,
  SWAP_INITIATED,
  SWAP_CONFIRMED,
  SWAP_COMPLETED,
  ADVANCED_MODE_ON,
  ADD_RECIPIENT_CLICKED,
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
  ABOUT_STAKE_KNC_CLICKED,
  ANALYTICS_MENU_CLICKED,
  BLOG_MENU_CLICKED,
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
  ELASTIC_MYPOOLS_ELASTIC_POOLS_CLICKED,
  ELASTIC_POOLS_ELASTIC_POOLS_CLICKED,
  ELASTIC_ADD_LIQUIDITY_INITIATED,
  ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED,
  ELASTIC_ADD_LIQUIDITY_COMPLETED,
  ELASTIC_ADD_LIQUIDITY_ADD_NEW_POSITION,
  ELASTIC_ADD_LIQUIDITY_CLICK_TO_REMOVE_POSITION,
  ELASTIC_ADD_LIQUIDITY_SELECT_RANGE_FOR_POOL,
  ELASTIC_ADD_LIQUIDITY_CLICK_SWAP,
  ELASTIC_ADD_LIQUIDITY_CLICK_PRICE_CHART,
  ELASTIC_ADD_LIQUIDITY_CLICK_POOL_ANALYTIC,
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
  DISCOVER_SUBSCRIBE_TRENDING_SOON_SUCCESS,
  DISCOVER_UNSUBSCRIBE_TRENDING_SOON_SUCCESS,
  CAMPAIGN_ENTER_NOW_CLICKED,
  CAMPAIGN_SHARE_TRADING_CONTEST_CLICKED,
  CAMPAIGN_CLAIM_REWARDS_CLICKED,
  CAMPAIGN_WALLET_CONNECTED,
  TRANSAK_BUY_CRYPTO_CLICKED,
  TRANSAK_DOWNLOAD_WALLET_CLICKED,
  TRANSAK_SWAP_NOW_CLICKED,
  SWAP_BUY_CRYPTO_CLICKED,

  // for tutorial swap
  TUTORIAL_CLICK_START,
  TUTORIAL_CLICK_DONE,
  TUTORIAL_CLICK_DENY,
  TUTORIAL_VIEW_VIDEO_SWAP,

  // type and swap
  TAS_TYPING_KEYWORD,
  TAS_SELECT_PAIR,
  TAS_LIKE_PAIR,
  TAS_DISLIKE_PAIR,
  TAS_PRESS_CTRL_K,

  BANNER_CLICK,
  CLOSE_BANNER_CLICK,

  FARM_UNDER_EARN_TAB_CLICK,

  // bridge
  BRIDGE_CLICK_REVIEW_TRANSFER,
  BRIDGE_CLICK_TRANSFER,
  BRIDGE_TRANSACTION_SUBMIT,
  BRIDGE_CLICK_HISTORY_TRANSFER_TAB,

  //Kyber DAO
  KYBER_DAO_STAKE_CLICK,
  KYBER_DAO_UNSTAKE_CLICK,
  KYBER_DAO_DELEGATE_CLICK,
  KYBER_DAO_VOTE_CLICK,
  KYBER_DAO_CLAIM_CLICK,
  KYBER_DAO_FEATURE_REQUEST_CLICK,

  // notification
  NOTIFICATION_CLICK_MENU,
  NOTIFICATION_SELECT_TOPIC,
  NOTIFICATION_DESELECT_TOPIC,

  ANNOUNCEMENT_CLICK_BELL_ICON_OPEN_POPUP,
  ANNOUNCEMENT_CLICK_TAB_INBOX,
  ANNOUNCEMENT_CLICK_TAB_ANNOUNCEMENT,
  ANNOUNCEMENT_CLICK_ANNOUNCEMENT_MESSAGE,
  ANNOUNCEMENT_CLICK_INBOX_MESSAGE,
  ANNOUNCEMENT_CLICK_CLOSE_POPUP,
  ANNOUNCEMENT_CLICK_CTA_POPUP,
  ANNOUNCEMENT_CLICK_CLEAR_ALL_INBOXES,

  // limit order
  LO_CLICK_PLACE_ORDER,
  LO_PLACE_ORDER_SUCCESS,
  LO_ENTER_DETAIL,
  LO_CLICK_CANCEL_ORDER,
  LO_CANCEL_ORDER_SUBMITTED,
  LO_CLICK_REVIEW_PLACE_ORDER,
  LO_CLICK_EDIT_ORDER,

  // Wallet UI
  WUI_WALLET_CLICK,
  WUI_PINNED_WALLET,
  WUI_UNPINNED_WALLET,
  WUI_BUTTON_CLICK,
  WUI_IMPORT_TOKEN_CLICK,
  WUI_TRANSACTION_CLICK,
  WUI_IMPORT_TOKEN_BUTTON_CLICK,
}

export const NEED_CHECK_SUBGRAPH_TRANSACTION_TYPES: readonly TRANSACTION_TYPE[] = [
  TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY,
  TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
  TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY,
  TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
  TRANSACTION_TYPE.CLASSIC_CREATE_POOL,
  TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
] as const

export default function useMixpanel(currencies?: { [field in Field]?: Currency }) {
  const { chainId, account, isEVM, networkInfo } = useActiveWeb3React()
  const { saveGas } = useSwapState()
  const network = networkInfo.name
  const inputCurrency = currencies && currencies[Field.INPUT]
  const outputCurrency = currencies && currencies[Field.OUTPUT]
  const inputSymbol = inputCurrency && inputCurrency.isNative ? networkInfo.nativeToken.name : inputCurrency?.symbol
  const outputSymbol = outputCurrency && outputCurrency.isNative ? networkInfo.nativeToken.name : outputCurrency?.symbol
  const ethPrice = useETHPrice()
  const dispatch = useDispatch<AppDispatch>()
  const selectedCampaign = useSelector((state: AppState) => state.campaigns.selectedCampaign)
  const [allowedSlippage] = useUserSlippageTolerance()
  const { elasticClient, classicClient } = useKyberSwapConfig()

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
          mixpanel.register({ wallet_address: account, platform: isMobile ? 'Mobile' : 'Web', network })
          mixpanel.track('Wallet Connected')
          break
        case MIXPANEL_TYPE.SWAP_INITIATED: {
          const { gasUsd, inputAmount, priceImpact } = (payload || {}) as {
            gasUsd: number | string | undefined
            inputAmount: CurrencyAmount<Currency> | undefined
            priceImpact: number | undefined
          }

          mixpanel.track('Swap Initiated', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            estimated_gas: gasUsd ? Number(gasUsd).toFixed(4) : undefined,
            max_return_or_low_gas: saveGas ? 'Lowest Gas' : 'Maximum Return',
            trade_qty: inputAmount?.toExact(),
            slippage_setting: allowedSlippage ? allowedSlippage / 100 : 0,
            price_impact: priceImpact && priceImpact > 0.01 ? priceImpact.toFixed(2) : '<0.01',
          })

          break
        }
        case MIXPANEL_TYPE.SWAP_CONFIRMED: {
          const { gasUsd, inputAmount, priceImpact } = (payload || {}) as {
            gasUsd: number | undefined
            inputAmount: CurrencyAmount<Currency> | undefined
            priceImpact: number | undefined
          }

          mixpanel.track('Swap Confirmed', {
            input_token: inputSymbol,
            output_token: outputSymbol,
            estimated_gas: gasUsd?.toFixed(4),
            max_return_or_low_gas: saveGas ? 'Lowest Gas' : 'Maximum Return',
            trade_qty: inputAmount?.toExact(),
            slippage_setting: allowedSlippage ? allowedSlippage / 100 : 0,
            price_impact: priceImpact && priceImpact > 0.01 ? priceImpact.toFixed(2) : '<0.01',
          })

          break
        }
        case MIXPANEL_TYPE.SWAP_COMPLETED: {
          const { arbitrary, actual_gas, gas_price, tx_hash } = payload
          const formattedGas = gas_price ? formatUnits(gas_price, networkInfo.nativeToken.decimal) : '0'
          mixpanel.track('Swap Completed', {
            input_token: arbitrary.inputSymbol,
            output_token: arbitrary.outputSymbol,
            actual_gas:
              ethPrice &&
              ethPrice.currentPrice &&
              (actual_gas.toNumber() * parseFloat(formattedGas) * parseFloat(ethPrice.currentPrice)).toFixed(4),
            tx_hash: tx_hash,
            max_return_or_low_gas: arbitrary.saveGas ? 'Lowest Gas' : 'Maximum Return',
            trade_qty: arbitrary.inputAmount,
            slippage_setting: arbitrary.slippageSetting,
            price_impact: arbitrary.priceImpact,
            gas_price: formattedGas,
            eth_price: ethPrice?.currentPrice,
            actual_gas_native: actual_gas?.toNumber(),
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
        case MIXPANEL_TYPE.ADD_RECIPIENT_CLICKED: {
          mixpanel.track('Add Recipient Clicked', {
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
          mixpanel.track('Add Liquidity Completed', { ...payload, tx_hash: payload.tx_hash })
          break
        }
        case MIXPANEL_TYPE.REMOVE_LIQUIDITY_COMPLETED: {
          mixpanel.track('Remove Liquidity Completed', { ...payload, tx_hash: payload.tx_hash })
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
        case MIXPANEL_TYPE.ABOUT_STAKE_KNC_CLICKED: {
          mixpanel.track('About - Stake KNC Clicked')
          break
        }
        case MIXPANEL_TYPE.ANALYTICS_MENU_CLICKED: {
          mixpanel.track('Analytics Page Clicked')
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
          mixpanel.track('Elastic Pools - Create New Pool Initiated')
          break
        }
        case MIXPANEL_TYPE.ELASTIC_CREATE_POOL_COMPLETED: {
          mixpanel.track('Elastic Pools - Create New Pool Completed', {
            ...payload,
            tx_hash: payload.tx_hash,
          })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_MYPOOLS_ELASTIC_POOLS_CLICKED: {
          mixpanel.track('Elastic Pools - My pools - Click on Elastic Pool')
          break
        }
        case MIXPANEL_TYPE.ELASTIC_POOLS_ELASTIC_POOLS_CLICKED: {
          mixpanel.track('Elastic Pools - Click on Elastic Pool')
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_INITIATED: {
          mixpanel.track('Elastic Pools - Add Liquidity Initiated')
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED: {
          mixpanel.track('Elastic Pools - Add Liquidity Initiated in Token Pair List', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Pools - Add Liquidity Completed', {
            ...payload,
            tx_hash: payload.tx_hash,
          })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_REMOVE_LIQUIDITY_INITIATED: {
          mixpanel.track('Elastic Pools - My Pools - Remove Liquidity Initiated', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_REMOVE_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Pools - My Pools - Remove Liquidity Completed', {
            ...payload,
            tx_hash: payload.tx_hash,
          })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_INITIATED: {
          mixpanel.track('Elastic Pools - My Pools - Increase Liquidity Initiated', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_INCREASE_LIQUIDITY_COMPLETED: {
          mixpanel.track('Elastic Pools - My Pools - Increase Liquidity Completed', {
            ...payload,
            tx_hash: payload.tx_hash,
          })
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
          mixpanel.track('Elastic Farms - Individual Reward Harvested', payload)
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
        case MIXPANEL_TYPE.CAMPAIGN_ENTER_NOW_CLICKED: {
          mixpanel.track('Campaign - Enter Trading Contest "Enter Now"', payload)
          break
        }
        case MIXPANEL_TYPE.CAMPAIGN_SHARE_TRADING_CONTEST_CLICKED: {
          mixpanel.track('Campaign - Share Trading Contest share button', payload)
          break
        }
        case MIXPANEL_TYPE.CAMPAIGN_CLAIM_REWARDS_CLICKED: {
          mixpanel.track('Campaign - Claim Rewards Trading Contest "Claim Rewards"')
          break
        }
        case MIXPANEL_TYPE.CAMPAIGN_WALLET_CONNECTED: {
          setTimeout(() => {
            mixpanel?.track('Campaign - Wallet Connected', { campaign_name: selectedCampaign?.name })
          }, 500)
          break
        }
        case MIXPANEL_TYPE.TRANSAK_DOWNLOAD_WALLET_CLICKED: {
          mixpanel.track('Buy Crypto - Download a wallet "Download Wallet”')
          break
        }
        case MIXPANEL_TYPE.TRANSAK_BUY_CRYPTO_CLICKED: {
          mixpanel.track('Buy Crypto - To purchase crypto on Transak "Buy Now”')
          break
        }
        case MIXPANEL_TYPE.TRANSAK_SWAP_NOW_CLICKED: {
          mixpanel.track('Buy Crypto - Swap token on KyberSwap "Swap" button')
          break
        }
        case MIXPANEL_TYPE.SWAP_BUY_CRYPTO_CLICKED: {
          mixpanel.track('Buy Crypto - Click on Buy Crypto on KyberSwap')
          break
        }
        case MIXPANEL_TYPE.TUTORIAL_CLICK_START: {
          mixpanel.track('On-Screen Guide - User click on "View" in Setting to view guide')
          break
        }
        case MIXPANEL_TYPE.TUTORIAL_CLICK_DENY: {
          mixpanel.track('On-Screen Guide - User click on "Dismiss" button', { step: payload })
          break
        }
        case MIXPANEL_TYPE.TUTORIAL_CLICK_DONE: {
          mixpanel.track('On-Screen Guide - User click on "Done" button at Step 8')
          break
        }
        case MIXPANEL_TYPE.TUTORIAL_VIEW_VIDEO_SWAP: {
          mixpanel.track('On-Screen Guide - User click on Step 3 Embedded video')
          break
        }

        // type and swap
        case MIXPANEL_TYPE.TAS_TYPING_KEYWORD: {
          mixpanel.track('Type and Swap - Typed on the text box', { text: payload })
          break
        }
        case MIXPANEL_TYPE.TAS_SELECT_PAIR: {
          mixpanel.track('Type and Swap - Selected an option', { option: payload })
          break
        }
        case MIXPANEL_TYPE.TAS_LIKE_PAIR: {
          mixpanel.track('Type and Swap - Favorite a token pair', payload)
          break
        }
        case MIXPANEL_TYPE.TAS_DISLIKE_PAIR: {
          mixpanel.track('Type and Swap -  Un-favorite a token pair', payload)
          break
        }
        case MIXPANEL_TYPE.TAS_PRESS_CTRL_K: {
          mixpanel.track('Type and Swap - User click Ctrl + K (or Cmd + K) or Clicked on the text box', {
            navigation: payload,
          })
          break
        }

        case MIXPANEL_TYPE.BANNER_CLICK: {
          mixpanel.track('User click on "Banner" at swap page')
          break
        }
        case MIXPANEL_TYPE.CLOSE_BANNER_CLICK: {
          mixpanel.track('User click close "Banner" at swap page')
          break
        }
        case MIXPANEL_TYPE.FARM_UNDER_EARN_TAB_CLICK: {
          mixpanel.track('Farms Page Viewed - under Earn tab')
          break
        }

        case MIXPANEL_TYPE.BRIDGE_CLICK_HISTORY_TRANSFER_TAB: {
          mixpanel.track('Bridge - Transfer History Tab Click')
          break
        }
        case MIXPANEL_TYPE.BRIDGE_CLICK_REVIEW_TRANSFER: {
          mixpanel.track('Bridge - Review Transfer Click', payload)
          break
        }
        case MIXPANEL_TYPE.BRIDGE_CLICK_TRANSFER: {
          mixpanel.track('Bridge - Transfer Click', payload)
          break
        }
        case MIXPANEL_TYPE.BRIDGE_TRANSACTION_SUBMIT: {
          const { tx_hash, from_token, to_token, bridge_fee, from_network, to_network, trade_qty } = payload
          mixpanel.track('Bridge -  Transaction Submitted', {
            tx_hash,
            from_token,
            to_token,
            bridge_fee,
            from_network,
            to_network,
            trade_qty,
          })
          break
        }
        case MIXPANEL_TYPE.NOTIFICATION_CLICK_MENU: {
          mixpanel.track('Notification Clicked')
          break
        }
        case MIXPANEL_TYPE.NOTIFICATION_SELECT_TOPIC: {
          mixpanel.track('Notification Features selected and save', payload)
          break
        }
        case MIXPANEL_TYPE.NOTIFICATION_DESELECT_TOPIC: {
          mixpanel.track('Notification Features unselected and save', payload)
          break
        }
        case MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_BELL_ICON_OPEN_POPUP: {
          mixpanel.track('Notifications - Open Notification Pop Up')
          break
        }
        case MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_TAB_INBOX: {
          mixpanel.track('Notifications - Click on My Inbox', payload)
          break
        }
        case MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_TAB_ANNOUNCEMENT: {
          mixpanel.track('Notifications - Click on General', payload)
          break
        }
        case MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_INBOX_MESSAGE: {
          mixpanel.track('Notifications - Click on inbox messages', payload)
          break
        }
        case MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_ANNOUNCEMENT_MESSAGE: {
          mixpanel.track('Notifications - Click on announcement messages', payload)
          break
        }
        case MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CLOSE_POPUP: {
          mixpanel.track('Notifications - Click to close pop up', payload)
          break
        }
        case MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CTA_POPUP: {
          mixpanel.track('Notifications - Click on Announcement Pop Up CTA', payload)
          break
        }
        case MIXPANEL_TYPE.ANNOUNCEMENT_CLICK_CLEAR_ALL_INBOXES: {
          mixpanel.track('Notifications - Clear All Messages', payload)
          break
        }

        case MIXPANEL_TYPE.KYBER_DAO_STAKE_CLICK: {
          mixpanel.track('KyberDAO - Stake Click', payload)
          break
        }
        case MIXPANEL_TYPE.KYBER_DAO_UNSTAKE_CLICK: {
          mixpanel.track('KyberDAO - Unstake Click', payload)
          break
        }
        case MIXPANEL_TYPE.KYBER_DAO_DELEGATE_CLICK: {
          mixpanel.track('KyberDAO - Delegate Click', payload)
          break
        }
        case MIXPANEL_TYPE.KYBER_DAO_VOTE_CLICK: {
          mixpanel.track('KyberDAO - Vote Click', payload)
          break
        }
        case MIXPANEL_TYPE.KYBER_DAO_CLAIM_CLICK: {
          mixpanel.track('KyberDAO - Claim Reward Click', payload)
          break
        }
        case MIXPANEL_TYPE.KYBER_DAO_FEATURE_REQUEST_CLICK: {
          mixpanel.track('KyberDAO - Feature Request Click', payload)
          break
        }
        case MIXPANEL_TYPE.LO_CLICK_PLACE_ORDER: {
          mixpanel.track('Limit Order -  Place Order Click', payload)
          break
        }
        case MIXPANEL_TYPE.LO_PLACE_ORDER_SUCCESS: {
          mixpanel.track('Limit Order -  Place Order Submit Success', payload)
          break
        }
        case MIXPANEL_TYPE.LO_ENTER_DETAIL: {
          mixpanel.track('Limit Order - Enter Detail', { action: payload })
          break
        }
        case MIXPANEL_TYPE.LO_CLICK_CANCEL_ORDER: {
          mixpanel.track('Limit Order -  Cancel Order Click', payload)
          break
        }

        case MIXPANEL_TYPE.LO_CANCEL_ORDER_SUBMITTED: {
          mixpanel.track('Limit Order -  Cancel Order Submit Success', payload)
          break
        }
        case MIXPANEL_TYPE.LO_CLICK_REVIEW_PLACE_ORDER: {
          mixpanel.track('Limit Order -  Review Order Click', payload)
          break
        }
        case MIXPANEL_TYPE.LO_CLICK_EDIT_ORDER: {
          mixpanel.track('Limit Order -  Update Order Click', payload)
          break
        }
        case MIXPANEL_TYPE.WUI_WALLET_CLICK: {
          mixpanel.track('Wallet UI - Wallet Click')
          break
        }
        case MIXPANEL_TYPE.WUI_PINNED_WALLET: {
          mixpanel.track('Wallet UI - Pinned Wallet')
          break
        }
        case MIXPANEL_TYPE.WUI_UNPINNED_WALLET: {
          mixpanel.track('Wallet UI - Unpinned Wallet')
          break
        }
        case MIXPANEL_TYPE.WUI_BUTTON_CLICK: {
          mixpanel.track('Wallet UI - Button click', payload)
          break
        }
        case MIXPANEL_TYPE.WUI_IMPORT_TOKEN_CLICK: {
          mixpanel.track('Wallet UI - Import Token click')
          break
        }
        case MIXPANEL_TYPE.WUI_TRANSACTION_CLICK: {
          mixpanel.track('Wallet UI - Transaction click')
          break
        }
        case MIXPANEL_TYPE.WUI_IMPORT_TOKEN_BUTTON_CLICK: {
          mixpanel.track('Wallet UI - Import Token - Import button click', payload)
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_ADD_NEW_POSITION: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          mixpanel.track('Elastic - Add Liquidity page - Add new position', { token_1, token_2 })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_CLICK_TO_REMOVE_POSITION: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          mixpanel.track('Elastic - Add Liquidity page - Click to remove position', { token_1, token_2 })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_SELECT_RANGE_FOR_POOL: {
          const { token_1, token_2, range } = payload as {
            token_1: string
            token_2: string
            range: RANGE
          }
          mixpanel.track('Elastic - Add Liquidity page - Select range for pool', {
            token_1,
            token_2,
            range: range.toLowerCase().replace('_', ' '),
          })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_CLICK_SWAP: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          mixpanel.track('Elastic - Add Liquidity page - Click Swap', { token_1, token_2 })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_CLICK_PRICE_CHART: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          mixpanel.track('Elastic - Add Liquidity page - Click Price chart', { token_1, token_2 })
          break
        }
        case MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_CLICK_POOL_ANALYTIC: {
          const { token_1, token_2 } = payload as {
            token_1: string
            token_2: string
          }
          mixpanel.track('Elastic - Add Liquidity page - Click Pool analytic', { token_1, token_2 })
          break
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currencies, network, saveGas, account, mixpanel.hasOwnProperty('get_distinct_id'), ethPrice?.currentPrice],
  )
  const subgraphMixpanelHandler = useCallback(
    async (transaction: TransactionDetails) => {
      if (!isEVM) return

      const hash = transaction.hash
      const arbitrary = transaction.extraInfo?.arbitrary
      switch (transaction.type) {
        case TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY: {
          const { poolAddress, token_1, token_2, add_liquidity_method, amp } = arbitrary || {}
          const res = await classicClient.query({
            query: GET_POOL_VALUES_AFTER_MINTS_SUCCESS,
            variables: {
              poolAddress: poolAddress.toLowerCase(),
            },
            fetchPolicy: 'network-only',
          })
          if (transaction.confirmedTime && new Date().getTime() - transaction.confirmedTime < 3600000) {
            if (
              !res.data?.pool?.mints ||
              res.data.pool.mints.every((mint: { id: string }) => !mint.id.startsWith(transaction.hash))
            )
              break
          }
          const { reserve0, reserve1, reserveUSD } = res.data.pool
          const mint = res.data.pool.mints.find((mint: { id: string }) => mint.id.startsWith(transaction.hash))
          mixpanelHandler(MIXPANEL_TYPE.ADD_LIQUIDITY_COMPLETED, {
            token_1_pool_qty: reserve0,
            token_2_pool_qty: reserve1,
            liquidity_USD: reserveUSD,
            token_1,
            token_2,
            token_1_qty: mint?.amount0,
            token_2_qty: mint?.amount1,
            tx_liquidity_USD: mint?.amountUSD,
            add_liquidity_method,
            amp,
            tx_hash: hash,
          })
          dispatch(modifyTransaction({ chainId, hash, needCheckSubgraph: false }))
          break
        }
        case TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY: {
          const {
            contract: poolAddress = '',
            tokenSymbolIn: token_1,
            tokenSymbolOut: token_2,
          } = (transaction.extraInfo || {}) as TransactionExtraInfo2Token
          const res = await elasticClient.query({
            query: PROMM_GET_POOL_VALUES_AFTER_MINTS_SUCCESS,
            variables: {
              poolAddress: poolAddress.toLowerCase(),
            },
            fetchPolicy: 'network-only',
          })
          if (transaction.confirmedTime && new Date().getTime() - transaction.confirmedTime < 3_600_000) {
            if (
              !res.data?.pool?.mints ||
              res.data.pool.mints.every((mint: { id: string }) => !mint.id.startsWith(transaction.hash))
            )
              break
          }
          const { totalValueLockedToken0, totalValueLockedToken1, totalValueLockedUSD, feeTier, mints } = res.data.pool
          const mint = mints.find((mint: { id: string }) => mint.id.startsWith(transaction.hash))
          mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_COMPLETED, {
            token_1_pool_qty: totalValueLockedToken0,
            token_2_pool_qty: totalValueLockedToken1,
            liquidity_USD: totalValueLockedUSD,
            token_1,
            token_2,
            token_1_qty: mint?.amount0,
            token_2_qty: mint?.amount1,
            tx_liquidity_USD: mint?.amountUSD,
            fee_tier: feeTier / ELASTIC_BASE_FEE_UNIT,
            tx_hash: hash,
          })
          dispatch(modifyTransaction({ chainId, hash, needCheckSubgraph: false }))
          break
        }
        case TRANSACTION_TYPE.CLASSIC_REMOVE_LIQUIDITY: {
          const { poolAddress, token_1, token_2, amp, remove_liquidity_method } = arbitrary || {}
          const res = await classicClient.query({
            query: GET_POOL_VALUES_AFTER_BURNS_SUCCESS,
            variables: {
              poolAddress: poolAddress.toLowerCase(),
            },
            fetchPolicy: 'network-only',
          })

          if (transaction.confirmedTime && new Date().getTime() - transaction.confirmedTime < 3600000) {
            if (
              !res.data?.pool?.burns ||
              res.data.pool.burns.every((burn: { id: string }) => !burn.id.startsWith(transaction.hash))
            )
              break
          }
          const { reserve0, reserve1, reserveUSD } = res.data.pool
          const burn = res.data.pool.burns.find((burn: { id: string }) => burn.id.startsWith(transaction.hash))
          mixpanelHandler(MIXPANEL_TYPE.REMOVE_LIQUIDITY_COMPLETED, {
            token_1_pool_qty: reserve0,
            token_2_pool_qty: reserve1,
            liquidity_USD: reserveUSD,
            token_1,
            token_2,
            token_1_qty: burn?.amount0,
            token_2_qty: burn?.amount1,
            tx_liquidity_USD: burn?.amountUSD,
            remove_liquidity_method: remove_liquidity_method,
            amp,
            tx_hash: hash,
          })
          dispatch(modifyTransaction({ chainId, hash, needCheckSubgraph: false }))
          break
        }
        case TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY: {
          const {
            contract: poolAddress = '',
            tokenSymbolIn,
            tokenSymbolOut,
          } = (transaction.extraInfo || {}) as TransactionExtraInfo2Token
          const res = await elasticClient.query({
            query: PROMM_GET_POOL_VALUES_AFTER_BURNS_SUCCESS,
            variables: {
              poolAddress: poolAddress.toLowerCase(),
            },
            fetchPolicy: 'network-only',
          })
          if (transaction.confirmedTime && new Date().getTime() - transaction.confirmedTime < 3600000) {
            if (
              !res.data?.pool?.burns ||
              res.data.pool.burns.every((burn: { id: string }) => !burn.id.startsWith(transaction.hash))
            )
              break
          }
          const { totalValueLockedToken0, totalValueLockedToken1, totalValueLockedUSD, feeTier } = res.data.pool
          const burn = res.data.pool.burns.find((burn: { id: string }) => burn.id.startsWith(transaction.hash))
          mixpanelHandler(MIXPANEL_TYPE.ELASTIC_REMOVE_LIQUIDITY_COMPLETED, {
            token_1_pool_qty: totalValueLockedToken0,
            token_2_pool_qty: totalValueLockedToken1,
            liquidity_USD: totalValueLockedUSD,
            token_1: tokenSymbolIn,
            token_2: tokenSymbolOut,
            token_1_qty: burn?.amount0,
            token_2_qty: burn?.amount1,
            tx_liquidity_USD: burn?.amountUSD,
            fee_tier: feeTier / ELASTIC_BASE_FEE_UNIT,
            tx_hash: hash,
          })
          dispatch(modifyTransaction({ chainId, hash, needCheckSubgraph: false }))
          break
        }
        case TRANSACTION_TYPE.CLASSIC_CREATE_POOL: {
          const { amp, token_1, token_2 } = arbitrary || {}
          const res = await classicClient.query({
            query: GET_MINT_VALUES_AFTER_CREATE_POOL_SUCCESS,
            variables: {
              transactionHash: hash,
            },
            fetchPolicy: 'network-only',
          })
          if (transaction.confirmedTime && new Date().getTime() - transaction.confirmedTime < 3600000) {
            if (!res.data?.transaction?.mints || res.data.transaction.mints.length === 0) break
          }
          const { amount0, amount1, amountUSD } = res.data.transaction.mints[0]
          mixpanelHandler(MIXPANEL_TYPE.CREATE_POOL_COMPLETED, {
            token_1,
            token_2,
            amp,
            tx_hash: hash,
            token_1_qty: amount0,
            token_2_qty: amount1,
            tx_liquidity_USD: amountUSD,
          })
          break
        }
        case TRANSACTION_TYPE.ELASTIC_CREATE_POOL: {
          const res = await elasticClient.query({
            query: PROMM_GET_MINT_VALUES_AFTER_CREATE_POOL_SUCCESS,
            variables: {
              transactionHash: hash,
            },
            fetchPolicy: 'network-only',
          })
          if (transaction.confirmedTime && new Date().getTime() - transaction.confirmedTime < 3600000) {
            if (!res.data?.transaction?.mints || res.data.transaction.mints.length === 0) break
          }
          const { amount0, amount1, amountUSD } = res.data.transaction.mints[0]
          const { tokenSymbolIn, tokenSymbolOut } = (transaction.extraInfo ?? {}) as TransactionExtraInfo2Token
          mixpanelHandler(MIXPANEL_TYPE.ELASTIC_CREATE_POOL_COMPLETED, {
            token_1: tokenSymbolIn,
            token_2: tokenSymbolOut,
            tx_hash: hash,
            token_1_qty: amount0,
            token_2_qty: amount1,
            tx_liquidity_USD: amountUSD,
          })
          break
        }
        default:
          break
      }
    },
    [chainId, dispatch, mixpanelHandler, isEVM, classicClient, elasticClient],
  )
  return { mixpanelHandler, subgraphMixpanelHandler }
}

export const useGlobalMixpanelEvents = () => {
  const { account, chainId } = useActiveWeb3React()
  const { mixpanelHandler } = useMixpanel()
  const oldNetwork = usePrevious(chainId)
  const location = useLocation()
  const pathName = useMemo(() => {
    if (location.pathname.split('/')[1] !== 'elastic') return location.pathname.split('/')[1]
    return 'elastic/' + location.pathname.split('/')[2]
  }, [location])

  useEffect(() => {
    if (account && isAddress(account)) {
      mixpanel.identify(account)

      const getQueryParam = (url: string, param: string) => {
        // eslint-disable-next-line
        param = param.replace(/\[\[\]/, '[').replace(/[]]/, ']')
        const regexS = '[?&]' + param + '=([^&#]*)',
          regex = new RegExp(regexS),
          results: any = regex.exec(url)
        if (results === null || (results && typeof results[1] !== 'string' && results[1].length)) {
          return ''
        } else {
          return decodeURIComponent(results[1]).replace(/\W/gi, ' ')
        }
      }
      let kw = ''
      const campaign_keywords = 'utm_source utm_medium utm_campaign utm_content utm_term'.split(' '),
        params: { [key: string]: any } = {},
        first_params: { [key: string]: any } = {}
      let index
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

      mixpanelHandler(MIXPANEL_TYPE.WALLET_CONNECTED)
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
        new_network: chainId && NETWORKS_INFO[chainId].name,
        old_network: oldNetwork && NETWORKS_INFO[oldNetwork as ChainId].name,
      })
      mixpanel.register({ network: chainId && NETWORKS_INFO[chainId].name })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId])

  useEffect(() => {
    if (pathName) {
      const map: { [key: string]: string } = {
        swap: 'Swap',
        find: 'Pool Finder',
        pools: 'Pools',
        farms: 'Farms',
        myPools: 'My Pools',
        migration: 'Migration',
        create: 'Create Pool',
        add: 'Add Liquidity',
        remove: 'Remove Liquidity',
        about: 'About',
        referral: 'Referral',
        discover: 'Discover',
        campaigns: 'Campaign',
        'elastic/remove': 'Elastic - Remove Liquidity',
        'elastic/add': 'Elastic - Add Liquidity',
        'elastic/increase': 'Elastic - Increase Liquidity',
        'buy-crypto': 'Buy Crypto',
        bridge: 'Bridge',
        '/kyberdao/stake-knc': 'KyberDAO Stake',
        '/kyberdao/vote': 'KyberDAO Vote',
        limit: 'Limit Order',
      }
      const pageName = map[pathName] || map[location.pathname]
      pageName && mixpanelHandler(MIXPANEL_TYPE.PAGE_VIEWED, { page: pageName })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathName, account, chainId, location.pathname])
}
