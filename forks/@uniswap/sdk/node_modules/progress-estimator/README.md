# progress-estimator

Logs a progress bar and estimation for how long a Promise will take to complete. This library tracks previous durations in order to provide more accurate estimates over time.

![Demo](https://user-images.githubusercontent.com/29597/48986949-474e2400-f0cf-11e8-86d7-d201f8ad8eca.gif)

## Usage example

```js
const createLogger = require('progress-estimator');

// All configuration keys are optional, but it's recommended to specify a storage location.
// Learn more about configuration options below.
const logger = createLogger({
  storagePath: join(__dirname, '.progress-estimator'),
});

async function run() {
  await logger(promiseOne, "This is a promise");
  await logger(
    promiseTwo,
    "This is another promise. I think it will take about 1 second",
    {
      estimate: 1000
    }
  );
}
```
## API

### `createLogger(optionalConfiguration)`

This method is the default package export. It creates and configures a logger function (documented below). The following configuration options are supported. (They apply only to the logger instance that's returned.)

| name | type | Description |
| --- | --- | --- |
| `logFunction` | Function | Custom logging function. Defaults to [`log-update`](https://npmjs.com/package/log-update). Must define `.done()` and `.clear()` methods. |
| `spinner` | object | Which spinner from the [`cli-spinners`](https://npmjs.com/package/cli-spinners) package to use. Defaults to `dots`. |
| `storagePath` | string | Where to record durations between runs. Defaults to [`os.tmpdir()`](https://nodejs.org/api/os.html). |
| `theme` | object | Custom [`chalk`](https://npmjs.com/package/chalk) theme. Look to the [default theme](https://github.com/bvaughn/progress-estimator/blob/master/src/theme.js) for a list of required keys. |

### `logger(promise, labelString, options)`

This method logs a progress bar and estimated duration for a promise. It requires at least two parameters– a `Promise` and a label (e.g. "Running tests"). The label is SHA1 hashed in order to uniquely identify the promise.

An optional third parameter can be provided as well with the following keys:
| name | type | Description |
| --- | --- | --- |
| `estimate` | Number | Estimated duration of promise. (This value is used initially, until a history of actual durations have been recorded.) |
| `id` | String | Uniquely identifies the promise. This value is needed if the label string is not guaranteed to be unique. |
