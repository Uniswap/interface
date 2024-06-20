/**
 * CacheMode enum that controls the way that the RouteCachingProvider works.
 * - *Livemode*:   This mode will set materialized routes into cache and fetch routes from cache.
 *                 If the route exists in cache, it will be quoted and returned, otherwise it will materialized.
 * - *Darkmode*:   This mode indicates that the cache will not be used, it will not be inserted nor fetched.
 *                 Routes will always be materialized.
 * - *Tapcompare*: In this mode we will insert and fetch routes to/from cache, and we will also materialize the route.
 *                 Ultimately the materialized route will be returned, but we will log some metrics comparing both.
 *
 * @enum {string}
 */
export enum CacheMode {
  Livemode = 'livemode',
  Darkmode = 'darkmode',
  Tapcompare = 'tapcompare',
}
