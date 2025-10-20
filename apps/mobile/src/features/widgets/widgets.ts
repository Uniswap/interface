import { NativeModules } from 'react-native'
import { getItem, reloadAllTimelines, setItem } from 'react-native-widgetkit'
import { getBuildVariant } from 'src/utils/version'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { currencyIdToContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { CurrencyId } from 'uniswap/src/types/currency'
import { WidgetEvent } from 'uniswap/src/types/widgets'
import { isAndroid } from 'utilities/src/platform'
// biome-ignore lint/style/noRestrictedImports: Required for analytics initialization
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { Account } from 'wallet/src/features/wallet/accounts/types'

const APP_GROUP = 'group.com.uniswap.widgets'
const KEY_WIDGET_EVENTS = getBuildVariant() + '.widgets.configuration.events'
const KEY_WIDGET_CACHE = getBuildVariant() + '.widgets.configuration.cache'
const KEY_WIDGETS_FAVORITE = getBuildVariant() + '.widgets.favorites'
const KEY_WIDGETS_ACCOUNTS = getBuildVariant() + '.widgets.accounts'
const KEY_WIDGETS_I18N = getBuildVariant() + '.widgets.i18n'

const { RNWidgets } = NativeModules

type WidgetEventsData = {
  events: WidgetEvent[]
}

type WidgetCacheData = {
  configuration: WidgetConfiguration[]
}

type WidgetConfiguration = {
  kind: string
  family: string
}

type WidgetI18nSettings = {
  locale: string
  currency: string
}

async function setUserDefaults(data: object, key: string): Promise<void> {
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
  const userDefaultAccounts: Array<{ address: string; name: Maybe<string>; isSigner: boolean }> = accounts.map(
    (account: Account) => {
      return {
        address: account.address,
        name: account.name,
        isSigner: account.type === AccountType.SignerMnemonic,
      }
    },
  )
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
      sendAnalyticsEvent(MobileEventName.WidgetConfigurationUpdated, {
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
    sendAnalyticsEvent(MobileEventName.WidgetConfigurationUpdated, widget)
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
