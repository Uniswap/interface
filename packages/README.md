# Shared Packages

Packages in this folder are shared packages that can be used across applications.

Shared code packages covering UI, shared functionality, and shared utilities. For non-product specific code, split into separate yet widely scoped packages rather than small packages.

## `uniswap`

Shared code across all of our apps. Where any cross functional features should be built by default.

## `ui`

Shared component library across all applications. Should not import any other packages or applications beyond utilities. Should only contain core UI elements that are part of or basic combinations of our core design building blocks.

## `wallet`

Shared code for wallet functionality and larger UI components.

## `api`

Shared utilities for data fetching across all applications.

## `utilities`

Shared utility functionality used across all applications. Should not import any other packages or applications.
