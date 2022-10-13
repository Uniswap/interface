# toFormat

Adds a `toFormat` instance method to [big.js](https://github.com/MikeMcl/big.js/) or [decimal.js](https://github.com/MikeMcl/decimal.js/).

## Install

Node.js

```bash
$ npm install toformat
```

Browser

```html
<script src='path/to/big.js'></script>
<script src='path/to/toFormat.js'></script>
```

## Use

### Node.js

```js
Big = require('big')
Big = require('toformat')(Big)

x = new Big(9876.54321)
x.toFormat(2)                       // '9,876.54'

// Three different ways of setting a formatting property
Big.format.decimalSeparator = ','
x.format.groupSeparator: ' '
x.toFormat(1, { groupSize: 2 })    // '98 76,5'
```

### Browser

```js
toFormat(Big)
x = new Big(9876.54321)
x.toFormat(2)                      // '9,876.54'
```

### Further examples:

```js
// The format object added to the Decimal constructor by this library.
Decimal.format = {
  decimalSeparator: '.',
  groupSeparator: ',',
  groupSize: 3,
  secondaryGroupSize: 0,
  fractionGroupSeparator: '',
  fractionGroupSize : 0
}

x.toFormat()                        // 123,456,789.987654321
x.toFormat(2, 1)                    // 123,456,789.98

// Add a format object to a Decimal instance.
x.format = {
  decimalSeparator: ',',
  groupSeparator: '',
}

x.toFormat()                       // 123456789,987654321

format = {
  decimalSeparator: '.',
  groupSeparator: ' ',
  groupSize: 3,
  fractionGroupSeparator: ' ',
  fractionGroupSize : 5
}

// Pass a format object to the method call.
x.toFormat(format)                 // 123 456 789.98765 4321
x.toFormat(4, format)              // 123 456 789.9877
x.toFormat(2, 1, format)           // 123 456 789.98
```

## Test

```bash
$ npm test
```

## Licence

[MIT](LICENCE)
