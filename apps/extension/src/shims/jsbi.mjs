// Shim for `jsbi` — re-exports every static method/property as a named export.
//
// Why this exists: jsbi's ESM build (`jsbi.mjs`) only does `export default JSBI`. JSBI
// is a class whose arithmetic API lives on static methods (JSBI.BigInt, JSBI.add, ...).
// Class static members are non-enumerable own properties, so Rollup/Vite's ESM interop
// wrapper (`__toESM`) only surfaces `default` — consumers that wrote `import JSBI from 'jsbi'`
// and then did `JSBI.BigInt(0)` ended up calling `undefined(0)` in the bundled output,
// crashing the background service worker at module-evaluation time.
//
// Named re-exports force Rollup to keep each method reachable in the module namespace,
// so the bundled code `i.BigInt(0)` resolves correctly.
// Import the real jsbi via a relative path so the alias defined in wxt.config.ts
// (which points `jsbi` at this shim) doesn't cause infinite self-reference.
import JSBI from '../../../../node_modules/jsbi/dist/jsbi.mjs'

export default JSBI

// All static members of the JSBI class. Keep this in sync with jsbi's public surface
// if the library is ever upgraded.
export const BigInt = JSBI.BigInt
export const toNumber = JSBI.toNumber
export const unaryMinus = JSBI.unaryMinus
export const bitwiseNot = JSBI.bitwiseNot
export const exponentiate = JSBI.exponentiate
export const multiply = JSBI.multiply
export const divide = JSBI.divide
export const remainder = JSBI.remainder
export const add = JSBI.add
export const subtract = JSBI.subtract
export const leftShift = JSBI.leftShift
export const signedRightShift = JSBI.signedRightShift
export const unsignedRightShift = JSBI.unsignedRightShift
export const lessThan = JSBI.lessThan
export const lessThanOrEqual = JSBI.lessThanOrEqual
export const greaterThan = JSBI.greaterThan
export const greaterThanOrEqual = JSBI.greaterThanOrEqual
export const equal = JSBI.equal
export const notEqual = JSBI.notEqual
export const bitwiseAnd = JSBI.bitwiseAnd
export const bitwiseXor = JSBI.bitwiseXor
export const bitwiseOr = JSBI.bitwiseOr
export const asIntN = JSBI.asIntN
export const asUintN = JSBI.asUintN
export const ADD = JSBI.ADD
export const LT = JSBI.LT
export const LE = JSBI.LE
export const GT = JSBI.GT
export const GE = JSBI.GE
export const EQ = JSBI.EQ
export const NE = JSBI.NE
