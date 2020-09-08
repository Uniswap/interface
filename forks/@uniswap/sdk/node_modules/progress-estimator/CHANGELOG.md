# 0.2.2
* Updated README for npmjs.com. (No actual code changes.)

# 0.2.1
* Gracefully handle `null` or `undefined` options parameter passed to logger function.

# 0.2.0
* Configuration function returns a configured logger, enabling custom configurations for multiple logger use cases.
* Configuration supports optional custom logging function. Default implementation will continue to use the [`log-update`](https://www.npmjs.com/package/log-update) package.
* Log function replaces third parameter (previously the estimated duration) with an optional configuration object supporting multiple values (estimated duration and unique id).

# 0.1.3
* Moved `clearInterval` into `finally` block to ensure proper cleanup if a Promise throws.

# 0.1.2
* Moved percentage label (e.g. "35%") inside of progress bar to save horizontal space.
* Changed format of time from estimated duration (e.g. "3.2 sec estimated") to include elapsed time (e.g. "1.5s, estimated 3.2s"). This new label format was inspired by the Jest test runner.
* Added `estimateExceeded` key to `theme` for when elapsed duration exceeds the estimated duration.
* Added TypeScript type defs to published lib.

# 0.1.1
* Fixed conversion bug for hour units.

# 0.1.0
* Initial release.