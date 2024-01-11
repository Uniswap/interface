import { useSyncExternalStore } from 'react'

import { EIP6963AnnounceProviderEvent, EIP6963Event, EIP6963ProviderDetail } from './types'
import { applyOverrideIcon, isCoinbaseProviderDetail, isEIP6963ProviderDetail } from './utils'

// TODO(WEB-3241) - Once Mutable<T> utility type is consolidated, use it here
type MutableInjectedProviderMap = Map<string, EIP6963ProviderDetail>
type InjectedProviderMap = ReadonlyMap<string, EIP6963ProviderDetail>

class EIP6963ProviderManager {
  public listeners = new Set<() => void>()
  private _map: MutableInjectedProviderMap = new Map()
  private _list: EIP6963ProviderDetail[] = []

  constructor() {
    window.addEventListener(EIP6963Event.ANNOUNCE_PROVIDER, this.onAnnounceProvider.bind(this) as EventListener)
    window.dispatchEvent(new Event(EIP6963Event.REQUEST_PROVIDER))
  }

  private onAnnounceProvider(event: EIP6963AnnounceProviderEvent) {
    if (!isEIP6963ProviderDetail(event.detail)) return

    const detail = applyOverrideIcon(event.detail)

    // TODO(WEB-3225): update coinbase to display via eip6963 once we move coinbase wallet-link behind the fold
    if (isCoinbaseProviderDetail(detail)) return

    // Ignore duplicate announcements if we've already stored a provider detail for the given rdns
    if (this._map.get(detail.info.rdns)) {
      if (this._map.get(detail.info.rdns)?.provider !== detail.provider) {
        console.warn(
          `Duplicate provider announcement with different provider for injected wallet with rdns: ${detail.info.rdns}`
        )
      }
      return
    }

    this._map.set(detail.info.rdns, detail)
    this._list = [...this._list, detail] // re-create array to trigger re-render from useInjectedProviderDetails
    this.listeners.forEach((listener) => listener())
  }

  public get map(): InjectedProviderMap {
    return this._map
  }

  public get list(): readonly EIP6963ProviderDetail[] {
    return this._list
  }
}

export const EIP6963_PROVIDER_MANAGER = new EIP6963ProviderManager()

function subscribeToProviderMap(listener: () => void): () => void {
  EIP6963_PROVIDER_MANAGER.listeners.add(listener)
  return () => EIP6963_PROVIDER_MANAGER.listeners.delete(listener)
}

function getProviderMapSnapshot(): readonly EIP6963ProviderDetail[] {
  return EIP6963_PROVIDER_MANAGER.list
}

/** Returns an up-to-date map of announced eip6963 providers */
export function useInjectedProviderDetails(): readonly EIP6963ProviderDetail[] {
  return useSyncExternalStore(subscribeToProviderMap, getProviderMapSnapshot)
}
