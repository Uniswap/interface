/// <reference lib="webworker" />

import { toURL } from 'service-worker/utils'
import { PrecacheController, PrecacheEntry } from 'workbox-precaching'

/** A PrecacheController that throws if precaching the assets fails. */
export class BailingPrecacheController extends PrecacheController {
  constructor(private assets: (string | PrecacheEntry)[]) {
    super()
    this.precache(assets)
  }

  async install(event: ExtendableEvent) {
    const result = await super.install(event)

    if (!this.assets.every((asset) => Boolean(this.getCacheKeyForURL(toURL(asset))))) {
      throw new Error('Aborting ServiceWorker installation: failed to precache assets')
    }
    return result
  }
}
