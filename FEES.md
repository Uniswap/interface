# Vexchange Fees
Each market's fees are stored as a public variable on that specific market. This can be accessed by each node on the network, typically through a web3 call. These fees can change over time and as such we have a two number model. The fee and the fee_max.

* Fee refers to the current fee in the specific market.
* Fee_Max refers to the maximum fee the specific market can be set to.

The introduction of Fee_Max gives users certainty that the exchange can not ever raise the fee above a specified level. The Fee_Max variable can only be lowered over time and can never be raised.

### Swap Fee vs. Platform Fees
* The swap fee is taken off the input of each trade and is kept by the contract. This then means that the liquidity providers receive a share of this fee taken from the trading volumes.
* The platform fee is taken off the earnings of the liquidity providers and used to further develop the platform. Due to the nature of the EVM, the liquidity provider's fee will be slightly lower than what is specified in here, due to favourable rounding during profit calculation.

### Factory Implementation
* default_swap_fee: Sets the starting swap fee of each new market
* default_platform_fee: Sets the starting platform fee of each new market.
* default_max_swap_fee: Sets the maximum swap fee of each new market.
* default_max_platform_fee: Sets the maximum platform fee of each new market.

### Exchange Implementation
* swap_fee: Current swap fee of current market
* swap_fee_max: Maximum swap fee of current market
* platform_fee: Current platform fee of current market
* platform_fee_max: Maximum platform fee of current market

# Current fees

### Factory Settings (Will bet set after observing mainnet activity)
* Swap Fee Default: 2%
* Max Swap Fee Default: 100%
* Platform Fee Default: 75%
* Max Platform Fee Default: 100%

### VTHO Market
* Swap Fee: 1%
* Max Swap Fee: 100% (Not Set Yet)
* Platform Fee: 25%
* Max Platform Fee: 100% (Not Set Yet)

### PLA Market
* Swap Fee: 1%
* Max Swap Fee: 100% (Not Set Yet)
* Platform Fee: 25%
* Max Platform Fee: 100% (Not Set Yet)

### DBET Market
* Swap Fee: 1%
* Max Swap Fee: 100% (Not Set Yet)
* Platform Fee: 25%
* Max Platform Fee: 100% (Not Set Yet)

### SHA Market
* Swap Fee: 1%
* Max Swap Fee: 100% (Not Set Yet)
* Platform Fee: 25%
* Max Platform Fee: 100% (Not Set Yet)