# Account Management Types

This directory contains the core types for our unified account management architecture. These types provide consistent APIs across web, mobile, and shared packages while enabling platform-specific implementations.

## Core Concepts

Our architecture recognizes four fundamental concepts that exist across all package contexts:

- **Platform**: The blockchain architecture (EVM, SVM) relevant to the data being processed
- **Account**: A platform-specific address paired with metadata about its originating wallet
- **Wallet**: An entity capable of exposing accounts and executing signing operations
- **Connection**: The relationship between our application and a wallet, composed of:
  - **Connector**: The capability and configuration for establishing wallet communication
  - **Session**: The active connection state when communication is established

## Type Relationships

The core types work together in a hierarchical relationship:

```text
┌─────────────────────────────────────────────────────────────┐
│                        AccountsStore                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ wallets: Record<Id, Wallet>                             │ │
│ │ accounts: Record<Address, Account>                      │ │
│ │ getActiveConnector(platform): Connector                 │ │
│ └─────────────────┬───────────────────────────────────────┘ │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                         Connector                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ id: string                                              │ │
│ │ access: AccessPattern                                   │ │
│ │ status: ConnectorStatus                                 │ │
│ │ session?: Session                                       │ │
│ └─────────────────┬───────────────────────────────────────┘ │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                          Session                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ walletId: string                                        │ │
│ │ currentAccountIndex: number                             │ │
│ │ chainScope: ChainScope                                  │ │
│ └─────────────────┬───────────────────────────────────────┘ │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                          Wallet                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ id: string                                              │ │
│ │ signingCapability: SigningCapability                    │ │
│ │ addresses: AddressGroup[]                               │ │
│ │                                                         │ │
│ └─────────────────┬───────────────────────────────────────┘ │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                        Account<P>                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ platform: P                                             │ │
│ │ address: PlatformSpecificAddress<P>                     │ │
│ │ walletId: string                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                        Enumerations                          │
│ ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────┐ │
│ │ AccessPattern   │ │ ConnectorStatus │ │ SigningCapability│ │
│ │ • Native        │ │ • Connected     │ │ • None           │ │
│ │ • Injected      │ │ • Connecting    │ │ • Interactive    │ │
│ │ • SDK           │ │ • Disconnected  │ │ • Immediate      │ │
│ └─────────────────┘ └─────────────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```
