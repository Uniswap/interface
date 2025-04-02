import { atom } from 'jotai'

export enum MenuState {
  DEFAULT = 'default',
  SETTINGS = 'settings',
  LANGUAGE_SETTINGS = 'language_settings',
  LOCAL_CURRENCY_SETTINGS = 'local_currency_settings',
  LIMITS = 'limits',
  POOLS = 'pools',
  PASSKEYS = 'passkeys',
}

export const miniPortfolioMenuStateAtom = atom(MenuState.DEFAULT)
