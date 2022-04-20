/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

import 'workbox-precaching' // defines __WB_MANIFEST

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import * as navigationPreload from 'workbox-navigation-preload'
import { registerRoute } from 'workbox-routing'
import { precacheAndRoute } from 'workbox-precaching'
import { PrecacheEntry } from 'workbox-precaching/_types'

import { matchDocument, handleDocument, filterManifest } from 'utils/serviceWorker'

declare const self: ServiceWorkerGlobalScope

navigationPreload.enable()
clientsClaim()

const manifest = self.__WB_MANIFEST.filter(filterManifest)
precacheAndRoute(manifest)

registerRoute(matchDocument, handleDocument)
