import { atom } from 'jotai'

export enum MenuState {
  DEFAULT = 'default',
  SETTINGS = 'settings',
  LANGUAGE_SETTINGS = 'language_settings',
  PORTFOLIO_BALANCE = 'portfolio_balance_settings',
  LOCAL_CURRENCY_SETTINGS = 'local_currency_settings',
  LIMITS = 'limits',
  POOLS = 'pools',
  PASSKEYS = 'passkeys',
  OTHER_WALLETS = 'other_wallets',
}

export const miniPortfolioMenuStateAtom = atom(MenuState.DEFAULT)
