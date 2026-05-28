# @universe/cryptography

Cryptography primitives, utilities, and helpers.

## Why?

A lot of care goes into choosing what cryptography libraries and algorithms we
use, how things are implemented and used, and what interfaces are exposed to
clients. For example, not all Random Number Generators and hash functions are
safe for use in cryptographic systems.

This package provides a central place where those decisions can be made and
controlled. The goal is all clients that use cryptography, depend on
`@universe/cryptography` for an implementation, and that what's contained in
this library has been approved by the Security team.

In addition, packages shouldn't care about their environment and what's
available. (eg. `webcrypto`, `nodecrypto`) This package aims to provide
infrastructure for interfaces that other packages depend on.

### `Uint8Array<ArrayBuffer>` over `Uint8Array`

Helpers that return byte arrays should be typed as `Uint8Array<ArrayBuffer>`.
Allocations made via `new Uint8Array(n)` and `crypto.getRandomValues()` are
backed by a fresh `ArrayBuffer`. The narrow type lets consumers pass the bytes
to APIs that reject `SharedArrayBuffer` (e.g. `structuredClone`).
