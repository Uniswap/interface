import { atom, useAtom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useEvent } from 'utilities/src/react/hooks'

export enum MenuStateVariant {
  MAIN = 'main',
  SWITCH = 'switch',
  CONNECT_PLATFORM = 'connect_platform',
  SETTINGS = 'settings',
  LANGUAGE_SETTINGS = 'language_settings',
  PORTFOLIO_BALANCE_SETTINGS = 'portfolio_balance_settings',
  LOCAL_CURRENCY_SETTINGS = 'local_currency_settings',
  LIMITS = 'limits',
  POOLS = 'pools',
  PASSKEYS = 'passkeys',
  OTHER_WALLETS = 'other_wallets',
}

type MenuState =
  | {
      variant: MenuStateVariant.CONNECT_PLATFORM
      platform: Platform
    }
  | {
      variant: Exclude<MenuStateVariant, MenuStateVariant.CONNECT_PLATFORM>
    }

const miniPortfolioMenuStateAtom = atom<MenuState>({ variant: MenuStateVariant.MAIN })

export function useMenuState() {
  const [menuState, setMenu] = useAtom(miniPortfolioMenuStateAtom)
  const setMenuState = useEvent((state: MenuState) => setMenu(state))

  return { menuState, setMenuState }
}

export function useSetMenu() {
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)
  return useEvent((state: MenuState) => setMenu(state))
}

export function useSetMenuCallback(variant: Exclude<MenuStateVariant, MenuStateVariant.CONNECT_PLATFORM>) {
  const setMenu = useUpdateAtom(miniPortfolioMenuStateAtom)
  return useEvent(() => setMenu({ variant }))
}
