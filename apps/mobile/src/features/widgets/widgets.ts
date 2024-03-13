import { NativeModules } from 'react-native'
import { getItem, reloadAllTimelines, setItem } from 'react-native-widgetkit'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { getBuildVariant } from 'src/utils/version'
import { isAndroid } from 'uniswap/src/utils/platform'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { currencyIdToContractInput } from 'wallet/src/features/dataApi/utils'
import { Account, AccountType } from 'wallet/src/features/wallet/accounts/types'
import { CurrencyId } from 'wallet/src/utils/currencyId'

const APP_GROUP = 'group.com.uniswap.widgets'
const KEY_WIDGET_EVENTS = getBuildVariant() + '.widgets.configuration.events'
const KEY_WIDGET_CACHE = getBuildVariant() + '.widgets.configuration.cache'
const KEY_WIDGETS_FAVORITE = getBuildVariant() + '.widgets.favorites'
const KEY_WIDGETS_ACCOUNTS = getBuildVariant() + '.widgets.accounts'
const KEY_WIDGETS_I18N = getBuildVariant() + '.widgets.i18n'

const { RNWidgets } = NativeModules

export const enum WidgetType {
  TokenPrice = 'token-price',
}

type WidgetEventsData = {
  events: WidgetEvent[]
}

export type WidgetEvent = {
  kind: string
  family: string
  change: 'added' | 'removed'
}

type WidgetCacheData = {
  configuration: WidgetConfiguration[]
}

export type WidgetConfiguration = {
  kind: string
  family: string
}

export type WidgetI18nSettings = {
  locale: string
  currency: string
}

export const setUserDefaults = async (data: object, key: string): Promise<void> => {
  const dataJSON = JSON.stringify(data)
  await setItem(key, dataJSON, APP_GROUP)
  reloadAllTimelines()
}

export const setFavoritesUserDefaults = (currencyIds: CurrencyId[]): void => {
  const favorites: Array<{ address: Maybe<string>; chain: string }> = []
  currencyIds.forEach((currencyId: CurrencyId) => {
    const contractInput = currencyIdToContractInput(currencyId)
    favorites.push({ address: contractInput.address, chain: contractInput.chain })
  })
  const data = {
    favorites,
  }
  setUserDefaults(data, KEY_WIDGETS_FAVORITE).catch(() => undefined)
}

export const setAccountAddressesUserDefaults = (accounts: Account[]): void => {
  const userDefaultAccounts: Array<{ address: string; name: Maybe<string>; isSigner: boolean }> =
    accounts.map((account: Account) => {
      return {
        address: account.address,
        name: account.name,
        isSigner: account.type === AccountType.SignerMnemonic,
      }
    })
  const data = {
    accounts: userDefaultAccounts,
  }
  setUserDefaults(data, KEY_WIDGETS_ACCOUNTS).catch(() => undefined)
}

export const setI18NUserDefaults = (i18nSettings: WidgetI18nSettings): void => {
  setUserDefaults(i18nSettings, KEY_WIDGETS_I18N).catch(() => undefined)
}

// handles edge case where there is a widget left in the cache,
// but no configured widgets, and no widgets to call getTimeline() in order to update the cache
// and send out the last removed event
async function handleLastRemovalEvents(): Promise<void> {
  const areWidgetsInstalled = await hasWidgetsInstalled()
  if (!areWidgetsInstalled) {
    const widgetCacheJSONString = await getItem(KEY_WIDGET_CACHE, APP_GROUP)
    if (!widgetCacheJSONString) {
      return
    }
    const widgetCache: WidgetCacheData = JSON.parse(widgetCacheJSONString)
    widgetCache.configuration.forEach((widget) => {
      sendMobileAnalyticsEvent(MobileEventName.WidgetConfigurationUpdated, {
        kind: widget.kind,
        family: widget.family,
        change: 'removed',
      })
    })
    await setUserDefaults({ configuration: [] }, KEY_WIDGET_CACHE)
  }
}

export async function processWidgetEvents(): Promise<void> {
  reloadAllTimelines()
  await handleLastRemovalEvents()
  const widgetEventsJSONString = await getItem(KEY_WIDGET_EVENTS, APP_GROUP)

  if (!widgetEventsJSONString) {
    return
  }
  const widgetEvents: WidgetEventsData = JSON.parse(widgetEventsJSONString)
  widgetEvents.events.forEach((widget) => {
    sendMobileAnalyticsEvent(MobileEventName.WidgetConfigurationUpdated, widget)
  })

  if (widgetEvents.events.length > 0) {
    analytics.flushEvents()
    await setUserDefaults({ events: [] }, KEY_WIDGET_EVENTS)
  }
}

async function hasWidgetsInstalled(): Promise<boolean> {
  if (isAndroid) {
    return false
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await RNWidgets.hasWidgetsInstalled()
}
