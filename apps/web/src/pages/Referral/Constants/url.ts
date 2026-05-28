/* eslint-disable import/no-unused-modules */
const REFERRAL_REWARDS_API_URL =
  process.env.REACT_APP_REFERRAL_REWARDS_API_URL ?? 'https://ringlabs-admin-platform-production.up.railway.app'
//http://192.168.71.78:3001'
// const REFERRAL_REWARDS_API_URL = 'http://192.168.71.78:3001'

//
// {"id":"hart1","address":"0xf8248fd490ff7507e771fe97e5bf1903f7492543","referralCode":null,"referralLevel":1,"inviterId":"muffin","invitedAt":"2026-02-03T19:34:51.003Z","createdAt":"2026-02-03T19:34:51.008Z","txPoints":"0","referralPoints":"0","totalPoints":"0","_count":{"invitees":1},"inviter":{"referralCode":"MUFFIN"},"userTransactionPoint":[{"txHash":"0xseed_tx_hart1","createdAt":"2026-02-03T19:35:26.037Z"}],"invitedTransactionPoint":[{"txHash":"0xseed_tx_hart2","createdAt":"2026-02-03T19:35:27.433Z"}],"rewards":0}
export const POINTS_TOTAL_API_URL = `${REFERRAL_REWARDS_API_URL}/api/client/user/info`

export const REFERRAL_API_APPLY_URL = `${REFERRAL_REWARDS_API_URL}/api/client/user/bind-referral`

export const REFERRAL_API_Activity_URL = `${REFERRAL_REWARDS_API_URL}/api/activities/current`

export const SELF_REBATES_API_URL = `${REFERRAL_REWARDS_API_URL}/api/client/referral/self-rebates`

export const INVITE_REBATES_API_URL = `${REFERRAL_REWARDS_API_URL}/api/client/referral/invite-rebates`

export const INVITEES_API_URL = `${REFERRAL_REWARDS_API_URL}/api/client/referral/invitees`

export const USER_REFERRAL_ACTIVITIES_API_URL = `${REFERRAL_REWARDS_API_URL}/api/client/referral/activities`

export const USER_REFERRAL_ACTIVITY_CLAIM_API_URL = `${REFERRAL_REWARDS_API_URL}/api/client/referral/proof`

export const REFERRAL_WHITELIST_POOL_API_URL = `${REFERRAL_REWARDS_API_URL}/api/client/activity/whitelist-pools`
