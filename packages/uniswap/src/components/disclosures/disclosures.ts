// Legal disclosure copy. Authored by the Uniswap Labs legal team; do not edit wording without their sign-off.
//
// Each entry in DISCLOSURES is one paragraph. A paragraph is an array of nodes:
// - a plain string renders as inline text
// - a `{ text, href }` object renders as an inline clickable link

export type DisclosureLink = { text: string; href: string }
export type DisclosureNode = string | DisclosureLink
export type DisclosureParagraph = readonly DisclosureNode[]

const UNSUPPORTED_TOKEN_POLICY_URL =
  'https://support.uniswap.org/hc/en-us/articles/18783694078989-Unsupported-Token-Policy'
const TRADE_OPTIONS_URL =
  'https://support.uniswap.org/hc/en-us/articles/27362707722637-How-to-change-default-trade-options'
const SLIPPAGE_URL =
  'https://support.uniswap.org/hc/en-us/articles/8643879653261-How-to-change-slippage-on-the-Uniswap-Web-app'
const SWAP_DEADLINES_URL =
  'https://support.uniswap.org/hc/en-us/articles/45320061462797-How-to-change-swap-deadlines-on-the-Uniswap-interface'
const UNIROUTE_REPO_URL = 'https://github.com/Uniswap/uniroute-public/tree/main'
const APP_URL = 'https://app.uniswap.org'

export const DISCLOSURES: readonly DisclosureParagraph[] = [
  [
    'Uniswap Labs creates and operates (a) a website-hosted user interface located at ',
    { text: 'app.uniswap.org', href: APP_URL },
    ' (the “Interface”), (b) a mobile wallet application (the “Uniswap Wallet”), and (c) an API and other products and services (collectively, the “Products”) that enable users to prepare and submit transactions on public blockchains using their own self-custodial wallets. Uniswap Labs maintains internal procedures to safeguard the security of the Products, including promptly investigating suspected incidents and preventing authorized access by use of employee credentialing and other security measures.  Uniswap Labs contributes to the development of the Uniswap Protocol (v4, v3, v2) and UniswapX, each an autonomous, open-source set of smart contracts deployed on public blockchains, but does not own, control, or operate the Uniswap Protocol (v4, v3, v2) or UniswapX. Uniswap Labs is not a broker-dealer and is not registered with or regulated by the U.S. Securities and Exchange Commission in connection with its creation, offering, or operation of the Products.  Certain assets may not be available on the Products, and certain assets may not be available in certain jurisdictions.  For more information, see ',
    { text: 'Unsupported Token Policy', href: UNSUPPORTED_TOKEN_POLICY_URL },
    '.',
  ],
  [
    'The Products are integrated with the following trading venues or distributed ledger trading systems: UniswapX; Uniswap Protocol (v4, v3, v2); Tempo; and Jupiter (collectively, the “Integrations”).  Uniswap Labs maintains internal policies and procedures regarding Integrations, which include controls to evaluate, onboard, and audit Integrations and proposed integrations.  Pursuant to those policies and procedures, Integrations are evaluated based on objective criteria, including liquidity, security, transparency, verifiability, neutrality, auditability, and latency.  Integrations may change from time to time.  Before any new liquidity source is integrated into the Products, it must be evaluated against these criteria.  All integrated liquidity sources – including the Uniswap Protocol (v4, v3, v2) and UniswapX – are reassessed periodically to determine whether they should remain included or be removed. Reassessment will also be triggered in the event of a material change to the liquidity source’s risk profile. A liquidity source may be removed from the routing calculation immediately if a security concern arises, without waiting for the next periodic reassessment.',
  ],
  [
    'For additional information on the liquidity sources accessible via the Products and the criteria used to evaluate them, see ',
    { text: 'How to change default trade options', href: TRADE_OPTIONS_URL },
    '.',
  ],
  [
    "When preparing a user's transaction, the Products' routing software analyzes the potential paths for a transaction on the Integrations and provides the user with information about the transaction path estimated to result in the largest number of digital assets received at that time based on simulated execution results.  In order to do so, the Products, by default, will consider available liquidity sources across the Integrations.  A user retains full discretion to adjust the default configuration and toggle which liquidity sources the Products’ routing software will consider.   By changing the liquidity sources the Products consider, a user may see additional routes for their trade.",
  ],
  [
    'The following parameters are hard-coded into the Products’ routing software (the “Auto Router”): (i) estimation of gas costs via simulation (which may deprioritize high-network fee routes);  (ii) estimation of slippage via simulation (which will revert a transaction that does not meet the user’s maximum specified slippage amount or better); (iii) pool liquidity, as measured by the total value locked across liquidity sources (which will deprioritize or exclude pools falling below a specified threshold); (iv) the maximum number of times a user’s swap can be “split” to allow the router to evaluate whether splitting the user’s swap among multiple liquidity sources may result in a better price; (v) the maximum number of “hops,” meaning potential sequences of digital asset conversions that end in the user receiving its desired output token; and (vi) the maximum number of potential routing paths that the Auto Router algorithm will evaluate in generating a proposed route. These routing-software parameters are not user-configurable transaction-level default parameters. The Products’ routing software applies these routing parameters in a uniform manner and the code can be viewed ',
    { text: 'here', href: UNIROUTE_REPO_URL },
    '.',
  ],
  [
    'The following transaction-level default parameters are currently in effect on the Products: slippage tolerance; swap deadline; eligible pools and trading venues or distributed ledger trading systems; and priority fees.  The default parameters may change from time to time.  The default parameters are set with reference to objective criteria and generally configured to reduce risk to users.',
  ],
  [
    'Slippage is the difference between the expected price of a swap at the time it is submitted and the actual execution price when the swap is executed onchain. Slippage can arise from ordinary price movement, changes in available liquidity, network latency and congestion, or the market impact of the user’s swap. Slippage is an inherent risk of trading.  If slippage tolerance is set too high, a user may not receive the expected value from a trade and/or the value of the trade may be captured by other parties. Conversely, if slippage tolerance is set too low, a user may not be able to execute a trade. Using a uniformly applied algorithm, the Products present an auto-calculated maximum slippage tolerance, which generally falls within a range of approximately 0.5% to 5.5%, depending on factors such as the selected network and the size of the swap.',
  ],
  [
    'The Swap Deadline is the time a swap is permitted to remain pending onchain before reverting. The Products apply a default transaction deadline of 30 minutes, meaning that a swap will revert if it has not executed by 30 minutes following submission. This is intended to provide users additional protection from unintended significant price movements.',
  ],
  [
    'The Auto Router is a transaction path algorithm used by the Products to analyze potential paths for a digital asset transaction across eligible Integrations and provides the user with information about the transaction path estimated to result in the largest number of digital assets received at that time based on simulated execution under the disclosed objective routing parameters.',
  ],
  [
    'Gas Fees are paid to blockchain validators for each transaction, and are required by every applicable blockchain network. Users are required by each network to pay gas fees on every transaction.',
  ],
  [
    'Max Base Fee is the highest base fee per unit of gas that a user is willing to pay. The base fee is set by the network, per block.',
  ],
  [
    'Priority Fees, where applicable, is an optional fee that users can pay to validators, to have their transactions processed faster.',
  ],
  ['Gas Limit is the maximum unit of gas that the user’s transaction is allowed to consume.'],
  [
    'Using an objective, uniformly applied algorithm, the Products present an auto-calculated Gas Fee and Priority Fee for each transaction. These algorithmic calculations are designed to balance transaction speed and fees paid.',
  ],
  [
    'The transaction-level default parameters are fully customizable by users of the Products.  By changing these parameters, a user may see additional routes for their trade.  For more information about how to change the default parameters, see ',
    { text: 'How to change slippage on the Uniswap Web app', href: SLIPPAGE_URL },
    ', ',
    { text: 'How to change swap deadlines on the Uniswap interface', href: SWAP_DEADLINES_URL },
    ' and ',
    { text: 'How to change default trade options', href: TRADE_OPTIONS_URL },
    '.  Uniswap Labs maintains internal policies and procedures regarding the default parameters and periodically reassesses the default parameters to ensure compliance with those policies and procedures.  Uniswap Labs is not aware of any material conflict of interest between Uniswap Labs and users of the Products that arises as a result of the default parameters.  Uniswap Labs does not receive compensation from any liquidity source for routing analysis inclusion.  Business development activities, including ecosystem support for third-party integrations, market maker support (such as loans or incentive programs), API access, and co-marketing, are separate from and do not influence routing analysis.',
  ],
]
