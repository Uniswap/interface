# @universe/chains

Shared interfaces for Ethers.js and viem

## Background

Ethers.js + viem = chains

This project provides a shared interface for interacting with the Ethereum
blockchain. We provide it to make migration from Ethers.js -\> viem easier,
test differences between both dependencies during that transition, and mock
implementations in consumer-based tests. When migration is completed, only this
package in the monorepo will depend on Ethers.js and viem directly.

## Grouping

Related functionality in groups:

- RPC
- Transactions
- Utilities

## Design decisions

### Initilazation

The chains package owns the interfaces (eg. Utilities). Any consumer
initializes what it nees by importing pre-defined factories like
`createUtilities`. This makes it easier for consumers and reduces the need for
boilerplate at the cost of a fatter SDK without tree-shaking.

### `getViemEnabled`

We want the consumer to own the feature flipping. We don't want chains to
depend on the `gating` package. All feature flips should be evaluated at call
time, which is why we initialize w/ callbacks.

### Testing

Many tests in this package test the "library", either Ethers.js or viem.
Normally this wouldn't be something we're interested in but in the context of a
migration we want to document and be certain of all differences.
