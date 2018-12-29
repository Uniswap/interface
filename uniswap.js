// # @title Uniswap Exchange Interface V1
// # @notice Source code found at https://github.com/uniswap
// # @notice Use at your own risk

// contract Factory():
//     def getExchange(token_addr: address) -> address: constant

// contract Exchange():
//     def getEthToTokenOutputPrice(tokens_bought: uint256) -> uint256(wei): constant
//     def ethToTokenTransferInput(min_tokens: uint256, deadline: timestamp, recipient: address) -> uint256: modifying
//     def ethToTokenTransferOutput(tokens_bought: uint256, deadline: timestamp, recipient: address) -> uint256(wei): modifying

// TokenPurchase: event({buyer: indexed(address), eth_sold: indexed(uint256(wei)), tokens_bought: indexed(uint256)})
// EthPurchase: event({buyer: indexed(address), tokens_sold: indexed(uint256), eth_bought: indexed(uint256(wei))})
// AddLiquidity: event({provider: indexed(address), eth_amount: indexed(uint256(wei)), token_amount: indexed(uint256)})
// RemoveLiquidity: event({provider: indexed(address), eth_amount: indexed(uint256(wei)), token_amount: indexed(uint256)})
// Transfer: event({_from: indexed(address), _to: indexed(address), _value: uint256})
// Approval: event({_owner: indexed(address), _spender: indexed(address), _value: uint256})

// name: public(bytes32)                             # Uniswap V1
// symbol: public(bytes32)                           # UNI-V1
// decimals: public(uint256)                         # 18
// totalSupply: public(uint256)                      # total number of UNI in existence
// balances: uint256[address]                        # UNI balance of an address
// allowances: (uint256[address])[address]           # UNI allowance of one address on another
// token: address(ERC20)                             # address of the ERC20 token traded on this contract
// factory: Factory                                  # interface for the factory that created this contract

// # @dev This function acts as a contract constructor which is not currently supported in contracts deployed
// #      using create_with_code_of(). It is called once by the factory during contract creation.
// @public
// def setup(token_addr: address):
//     assert (self.factory == ZERO_ADDRESS and self.token == ZERO_ADDRESS) and token_addr != ZERO_ADDRESS
//     self.factory = msg.sender
//     self.token = token_addr
//     self.name = 0x556e697377617020563100000000000000000000000000000000000000000000
//     self.symbol = 0x554e492d56310000000000000000000000000000000000000000000000000000
//     self.decimals = 18





function Exchange(ethReserve, tokenReserve) {
    this.name = "Maker";
    this.symbol = "MKR";
    this.decimals = 18;
    this.token = "";
    this.totalSupply = 0;
    this.ethReserve = 0;
    this.tokenReserve = 0;
    this.addLiquidity(ethReserve, 0, tokenReserve)
}


// # @notice Deposit ETH and Tokens (self.token) at current ratio to mint UNI tokens.
// # @dev min_amount has a djfferent meaning when total UNI supply is 0.
// # @param min_liquidity Minimum number of UNI sender will mint if total UNI supply is greater than 0.
// # @param min_amount Maximum number of tokens deposited. Deposits max amount if total UNI supply is 0.
// # @param deadline Time after which this transaction can no longer be executed.
// # @return The amount of UNI minted.
// @public
// @payable
// def addLiquidity(min_liquidity: uint256, max_tokens: uint256, deadline: timestamp) -> uint256:
//     assert deadline > block.timestamp and (max_tokens > 0 and msg.value > 0)
//     total_liquidity: uint256 = self.totalSupply
//     if total_liquidity > 0:
//         assert min_liquidity > 0
//         eth_reserve: uint256(wei) = self.balance - msg.value
//         token_reserve: uint256 = self.token.balanceOf(self)
//         token_amount: uint256 = msg.value * token_reserve / eth_reserve + 1
//         liquidity_minted: uint256 = msg.value * total_liquidity / eth_reserve
//         assert max_tokens >= token_amount and liquidity_minted >= min_liquidity
//         self.balances[msg.sender] += liquidity_minted
//         self.totalSupply = total_liquidity + liquidity_minted
//         assert self.token.transferFrom(msg.sender, self, token_amount)
//         log.AddLiquidity(msg.sender, msg.value, token_amount)
//         log.Transfer(ZERO_ADDRESS, msg.sender, liquidity_minted)
//         return liquidity_minted
//     else:
//         assert (self.factory != ZERO_ADDRESS and self.token != ZERO_ADDRESS) and msg.value >= 1000000000
//         assert self.factory.getExchange(self.token) == self
//         token_amount: uint256 = max_tokens
//         initial_liquidity: uint256 = as_unitless_number(self.balance)
//         self.totalSupply = initial_liquidity
//         self.balances[msg.sender] = initial_liquidity
//         assert self.token.transferFrom(msg.sender, self, token_amount)
//         log.AddLiquidity(msg.sender, msg.value, token_amount)
//         log.Transfer(ZERO_ADDRESS, msg.sender, initial_liquidity)
//         return initial_liquidity

Exchange.prototype.addLiquidity = function (value = 1, min_liquidity = 1, max_tokens = 10 ** 9, deadline = true) {
    if (!((max_tokens > 0 && value > 0))) return;

    if (this.totalSupply > 0) {
        if (!(min_liquidity > 0)) return;

        const token_amount = value * this.tokenReserve / this.ethReserve + 1;
        const liquidity_minted = value * this.totalSupply / this.ethReserve;
        if (!(max_tokens >= token_amount && liquidity_minted >= min_liquidity)) return;

        this.totalSupply += liquidity_minted
        this.ethReserve += value;
        this.tokenReserve += token_amount;
        return liquidity_minted
    } else {
        this.totalSupply = value;
        this.ethReserve = value;
        this.tokenReserve = max_tokens;
        return value
    }
}

// # @dev Burn UNI tokens to withdraw ETH and Tokens at current ratio.
// # @param amount Amount of UNI burned.
// # @param min_eth Minimum ETH withdrawn.
// # @param min_tokens Minimum Tokens withdrawn.
// # @param deadline Time after which this transaction can no longer be executed.
// # @return The amount of ETH and Tokens withdrawn.
// @public
// def removeLiquidity(amount: uint256, min_eth: uint256(wei), min_tokens: uint256, deadline: timestamp) -> (uint256(wei), uint256):
//     assert (amount > 0 and deadline > block.timestamp) and (min_eth > 0 and min_tokens > 0)
//     total_liquidity: uint256 = self.totalSupply
//     assert total_liquidity > 0
//     token_reserve: uint256 = self.token.balanceOf(self)
//     eth_amount: uint256(wei) = amount * self.balance / total_liquidity
//     token_amount: uint256 = amount * token_reserve / total_liquidity
//     assert eth_amount >= min_eth and token_amount >= min_tokens
//     self.balances[msg.sender] -= amount
//     self.totalSupply = total_liquidity - amount
//     send(msg.sender, eth_amount)
//     assert self.token.transfer(msg.sender, token_amount)
//     log.RemoveLiquidity(msg.sender, eth_amount, token_amount)
//     log.Transfer(msg.sender, ZERO_ADDRESS, amount)
//     return eth_amount, token_amount

Exchange.prototype.removeLiquidity = function (amount = 1, min_eth = 1, min_tokens = 1, deadline = true) {
    if (!((amount > 0 && deadline) && (min_eth > 0 && min_tokens > 0))) return;
    if (!(this.totalSupply > 0)) return;
    const eth_amount = amount * this.ethReserve / this.totalSupply
    const token_amount = amount * this.tokenReserve / this.totalSupply
    if (!(eth_amount >= min_eth && token_amount >= min_tokens)) return;
    this.totalSupply -= amount;
    this.ethReserve -= eth_amount;
    this.tokenReserve -= token_amount;

    return eth_amount, token_amount
}

// # @dev Pricing functon for converting between ETH and Tokens.
// # @param input_amount Amount of ETH or Tokens being sold.
// # @param input_reserve Amount of ETH or Tokens (input type) in exchange reserves.
// # @param output_reserve Amount of ETH or Tokens (output type) in exchange reserves.
// # @return Amount of ETH or Tokens bought.
// @private
// @constant
// def getInputPrice(input_amount: uint256, input_reserve: uint256, output_reserve: uint256) -> uint256:
//     assert input_reserve > 0 and output_reserve > 0
//     input_amount_with_fee: uint256 = input_amount * 997
//     numerator: uint256 = input_amount_with_fee * output_reserve
//     denominator: uint256 = (input_reserve * 1000) + input_amount_with_fee
//     return numerator / denominator


Exchange.prototype.getInputPrice = function (input_amount = 1, input_reserve = null, output_reserve = null) {
    if (!input_reserve) input_reserve = this.ethReserve;
    if (!output_reserve) output_reserve = this.tokenReserve;
    if (!(input_reserve > 0 && output_reserve > 0)) return;
    const input_amount_with_fee = input_amount * 997
    const numerator = input_amount_with_fee * output_reserve
    const denominator = (input_reserve * 1000) + input_amount_with_fee
    console.log(numerator / denominator)
    return numerator / denominator
}

// # @dev Pricing functon for converting between ETH and Tokens.
// # @param output_amount Amount of ETH or Tokens being bought.
// # @param input_reserve Amount of ETH or Tokens (input type) in exchange reserves.
// # @param output_reserve Amount of ETH or Tokens (output type) in exchange reserves.
// # @return Amount of ETH or Tokens sold.
// @private
// @constant
// def getOutputPrice(output_amount: uint256, input_reserve: uint256, output_reserve: uint256) -> uint256:
//     assert input_reserve > 0 and output_reserve > 0
//     numerator: uint256 = input_reserve * output_amount * 1000
//     denominator: uint256 = (output_reserve - output_amount) * 997
//     return numerator / denominator + 1

Exchange.prototype.getOutputPrice = function (output_amount = 1, input_reserve = null, output_reserve = null) {
    if (!(input_reserve > 0 && output_reserve > 0)) return;
    const numerator = input_reserve * output_amount * 1000
    const denominator = (output_reserve - output_amount) * 997
    return numerator / denominator + 1
}

// @private
// def ethToTokenInput(eth_sold: uint256(wei), min_tokens: uint256, deadline: timestamp, buyer: address, recipient: address) -> uint256:
//     assert deadline >= block.timestamp and (eth_sold > 0 and min_tokens > 0)
//     token_reserve: uint256 = self.token.balanceOf(self)
//     tokens_bought: uint256 = self.getInputPrice(as_unitless_number(eth_sold), as_unitless_number(self.balance - eth_sold), token_reserve)
//     assert tokens_bought >= min_tokens
//     assert self.token.transfer(recipient, tokens_bought)
//     log.TokenPurchase(buyer, eth_sold, tokens_bought)
//     return tokens_bought
Exchange.prototype.ethToTokenInput = function (eth_sold = 1, min_tokens = 1, deadline = true, buyer = true, recipient = true) {
    if (!((eth_sold > 0 && min_tokens > 0))) return
    // const this.tokenReserve = this.token.balanceOf(this)
    const tokens_bought = this.getInputPrice((eth_sold), this.ethReserve, this.tokenReserve)
    if (!(tokens_bought >= min_tokens)) return

    this.ethReserve += eth_sold;
    this.tokenReserve -= tokens_bought;
    // if (!(self.token.transfer(recipient, tokens_bought))) return
    // log.TokenPurchase(buyer, eth_sold, tokens_bought)
    return tokens_bought
}

// # @notice Convert ETH to Tokens.
// # @dev User specifies exact input (msg.value).
// # @dev User cannot specify minimum output or deadline.
// @public
// @payable
// def __default__():
//     self.ethToTokenInput(msg.value, 1, block.timestamp, msg.sender, msg.sender)

// # @notice Convert ETH to Tokens.
// # @dev User specifies exact input (msg.value) and minimum output.
// # @param min_tokens Minimum Tokens bought.
// # @param deadline Time after which this transaction can no longer be executed.
// # @return Amount of Tokens bought.
// @public
// @payable
// def ethToTokenSwapInput(min_tokens: uint256, deadline: timestamp) -> uint256:
//     return self.ethToTokenInput(msg.value, min_tokens, deadline, msg.sender, msg.sender)

// # @notice Convert ETH to Tokens and transfers Tokens to recipient.
// # @dev User specifies exact input (msg.value) and minimum output
// # @param min_tokens Minimum Tokens bought.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param recipient The address that receives output Tokens.
// # @return Amount of Tokens bought.
// @public
// @payable
// def ethToTokenTransferInput(min_tokens: uint256, deadline: timestamp, recipient: address) -> uint256:
//     assert recipient != self and recipient != ZERO_ADDRESS
//     return self.ethToTokenInput(msg.value, min_tokens, deadline, msg.sender, recipient)

// @private
// def ethToTokenOutput(tokens_bought: uint256, max_eth: uint256(wei), deadline: timestamp, buyer: address, recipient: address) -> uint256(wei):
//     assert deadline >= block.timestamp and (tokens_bought > 0 and max_eth > 0)
//     token_reserve: uint256 = self.token.balanceOf(self)
//     eth_sold: uint256 = self.getOutputPrice(tokens_bought, as_unitless_number(self.balance - max_eth), token_reserve)
//     # Throws if eth_sold > max_eth
//     eth_refund: uint256(wei) = max_eth - as_wei_value(eth_sold, 'wei')
//     if eth_refund > 0:
//         send(buyer, eth_refund)
//     assert self.token.transfer(recipient, tokens_bought)
//     log.TokenPurchase(buyer, as_wei_value(eth_sold, 'wei'), tokens_bought)
//     return as_wei_value(eth_sold, 'wei')

Exchange.prototype.ethToTokenOutput = function (tokens_bought = 1, max_eth = 1, deadline = true, buyer = true, recipient = true) {
    if (!(deadline && (tokens_bought > 0 && max_eth > 0))) return;
    const eth_sold = this.getOutputPrice(tokens_bought, (this.tokenReserve - max_eth), this.tokenReserve)
    // # Throws if eth_sold > max_eth
    this.ethReserve += eth_sold;
    this.tokenReserve -= tokens_bought;

    return eth_sold
}


// # @notice Convert ETH to Tokens.
// # @dev User specifies maximum input (msg.value) and exact output.
// # @param tokens_bought Amount of tokens bought.
// # @param deadline Time after which this transaction can no longer be executed.
// # @return Amount of ETH sold.
// @public
// @payable
// def ethToTokenSwapOutput(tokens_bought: uint256, deadline: timestamp) -> uint256(wei):
//     return self.ethToTokenOutput(tokens_bought, msg.value, deadline, msg.sender, msg.sender)

// # @notice Convert ETH to Tokens and transfers Tokens to recipient.
// # @dev User specifies maximum input (msg.value) and exact output.
// # @param tokens_bought Amount of tokens bought.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param recipient The address that receives output Tokens.
// # @return Amount of ETH sold.
// @public
// @payable
// def ethToTokenTransferOutput(tokens_bought: uint256, deadline: timestamp, recipient: address) -> uint256(wei):
//     assert recipient != self and recipient != ZERO_ADDRESS
//     return self.ethToTokenOutput(tokens_bought, msg.value, deadline, msg.sender, recipient)

// @private
// def tokenToEthInput(tokens_sold: uint256, min_eth: uint256(wei), deadline: timestamp, buyer: address, recipient: address) -> uint256(wei):
//     assert deadline >= block.timestamp and (tokens_sold > 0 and min_eth > 0)
//     token_reserve: uint256 = self.token.balanceOf(self)
//     eth_bought: uint256 = self.getInputPrice(tokens_sold, token_reserve, as_unitless_number(self.balance))
//     wei_bought: uint256(wei) = as_wei_value(eth_bought, 'wei')
//     assert wei_bought >= min_eth
//     send(recipient, wei_bought)
//     assert self.token.transferFrom(buyer, self, tokens_sold)
//     log.EthPurchase(buyer, tokens_sold, wei_bought)
//     return wei_bought


// # @notice Convert Tokens to ETH.
// # @dev User specifies exact input and minimum output.
// # @param tokens_sold Amount of Tokens sold.
// # @param min_eth Minimum ETH purchased.
// # @param deadline Time after which this transaction can no longer be executed.
// # @return Amount of ETH bought.
// @public
// def tokenToEthSwapInput(tokens_sold: uint256, min_eth: uint256(wei), deadline: timestamp) -> uint256(wei):
//     return self.tokenToEthInput(tokens_sold, min_eth, deadline, msg.sender, msg.sender)

// # @notice Convert Tokens to ETH and transfers ETH to recipient.
// # @dev User specifies exact input and minimum output.
// # @param tokens_sold Amount of Tokens sold.
// # @param min_eth Minimum ETH purchased.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param recipient The address that receives output ETH.
// # @return Amount of ETH bought.
// @public
// def tokenToEthTransferInput(tokens_sold: uint256, min_eth: uint256(wei), deadline: timestamp, recipient: address) -> uint256(wei):
//     assert recipient != self and recipient != ZERO_ADDRESS
//     return self.tokenToEthInput(tokens_sold, min_eth, deadline, msg.sender, recipient)

// @private
// def tokenToEthOutput(eth_bought: uint256(wei), max_tokens: uint256, deadline: timestamp, buyer: address, recipient: address) -> uint256:
//     assert deadline >= block.timestamp and eth_bought > 0
//     token_reserve: uint256 = self.token.balanceOf(self)
//     tokens_sold: uint256 = self.getOutputPrice(as_unitless_number(eth_bought), token_reserve, as_unitless_number(self.balance))
//     # tokens sold is always > 0
//     assert max_tokens >= tokens_sold
//     send(recipient, eth_bought)
//     assert self.token.transferFrom(buyer, self, tokens_sold)
//     log.EthPurchase(buyer, tokens_sold, eth_bought)
//     return tokens_sold

// # @notice Convert Tokens to ETH.
// # @dev User specifies maximum input and exact output.
// # @param eth_bought Amount of ETH purchased.
// # @param max_tokens Maximum Tokens sold.
// # @param deadline Time after which this transaction can no longer be executed.
// # @return Amount of Tokens sold.
// @public
// def tokenToEthSwapOutput(eth_bought: uint256(wei), max_tokens: uint256, deadline: timestamp) -> uint256:
//     return self.tokenToEthOutput(eth_bought, max_tokens, deadline, msg.sender, msg.sender)

// # @notice Convert Tokens to ETH and transfers ETH to recipient.
// # @dev User specifies maximum input and exact output.
// # @param eth_bought Amount of ETH purchased.
// # @param max_tokens Maximum Tokens sold.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param recipient The address that receives output ETH.
// # @return Amount of Tokens sold.
// @public
// def tokenToEthTransferOutput(eth_bought: uint256(wei), max_tokens: uint256, deadline: timestamp, recipient: address) -> uint256:
//     assert recipient != self and recipient != ZERO_ADDRESS
//     return self.tokenToEthOutput(eth_bought, max_tokens, deadline, msg.sender, recipient)

// @private
// def tokenToTokenInput(tokens_sold: uint256, min_tokens_bought: uint256, min_eth_bought: uint256(wei), deadline: timestamp, buyer: address, recipient: address, exchange_addr: address) -> uint256:
//     assert (deadline >= block.timestamp and tokens_sold > 0) and (min_tokens_bought > 0 and min_eth_bought > 0)
//     assert exchange_addr != self and exchange_addr != ZERO_ADDRESS
//     token_reserve: uint256 = self.token.balanceOf(self)
//     eth_bought: uint256 = self.getInputPrice(tokens_sold, token_reserve, as_unitless_number(self.balance))
//     wei_bought: uint256(wei) = as_wei_value(eth_bought, 'wei')
//     assert wei_bought >= min_eth_bought
//     assert self.token.transferFrom(buyer, self, tokens_sold)
//     tokens_bought: uint256 = Exchange(exchange_addr).ethToTokenTransferInput(min_tokens_bought, deadline, recipient, value=wei_bought)
//     log.EthPurchase(buyer, tokens_sold, wei_bought)
//     return tokens_bought

// # @notice Convert Tokens (self.token) to Tokens (token_addr).
// # @dev User specifies exact input and minimum output.
// # @param tokens_sold Amount of Tokens sold.
// # @param min_tokens_bought Minimum Tokens (token_addr) purchased.
// # @param min_eth_bought Minimum ETH purchased as intermediary.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param token_addr The address of the token being purchased.
// # @return Amount of Tokens (token_addr) bought.
// @public
// def tokenToTokenSwapInput(tokens_sold: uint256, min_tokens_bought: uint256, min_eth_bought: uint256(wei), deadline: timestamp, token_addr: address) -> uint256:
//     exchange_addr: address = self.factory.getExchange(token_addr)
//     return self.tokenToTokenInput(tokens_sold, min_tokens_bought, min_eth_bought, deadline, msg.sender, msg.sender, exchange_addr)

// # @notice Convert Tokens (self.token) to Tokens (token_addr) and transfers
// #         Tokens (token_addr) to recipient.
// # @dev User specifies exact input and minimum output.
// # @param tokens_sold Amount of Tokens sold.
// # @param min_tokens_bought Minimum Tokens (token_addr) purchased.
// # @param min_eth_bought Minimum ETH purchased as intermediary.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param recipient The address that receives output ETH.
// # @param token_addr The address of the token being purchased.
// # @return Amount of Tokens (token_addr) bought.
// @public
// def tokenToTokenTransferInput(tokens_sold: uint256, min_tokens_bought: uint256, min_eth_bought: uint256(wei), deadline: timestamp, recipient: address, token_addr: address) -> uint256:
//     exchange_addr: address = self.factory.getExchange(token_addr)
//     return self.tokenToTokenInput(tokens_sold, min_tokens_bought, min_eth_bought, deadline, msg.sender, recipient, exchange_addr)

// @private
// def tokenToTokenOutput(tokens_bought: uint256, max_tokens_sold: uint256, max_eth_sold: uint256(wei), deadline: timestamp, buyer: address, recipient: address, exchange_addr: address) -> uint256:
//     assert deadline >= block.timestamp and (tokens_bought > 0 and max_eth_sold > 0)
//     assert exchange_addr != self and exchange_addr != ZERO_ADDRESS
//     eth_bought: uint256(wei) = Exchange(exchange_addr).getEthToTokenOutputPrice(tokens_bought)
//     token_reserve: uint256 = self.token.balanceOf(self)
//     tokens_sold: uint256 = self.getOutputPrice(as_unitless_number(eth_bought), token_reserve, as_unitless_number(self.balance))
//     # tokens sold is always > 0
//     assert max_tokens_sold >= tokens_sold and max_eth_sold >= eth_bought
//     assert self.token.transferFrom(buyer, self, tokens_sold)
//     eth_sold: uint256(wei) = Exchange(exchange_addr).ethToTokenTransferOutput(tokens_bought, deadline, recipient, value=eth_bought)
//     log.EthPurchase(buyer, tokens_sold, eth_bought)
//     return tokens_sold

// # @notice Convert Tokens (self.token) to Tokens (token_addr).
// # @dev User specifies maximum input and exact output.
// # @param tokens_bought Amount of Tokens (token_addr) bought.
// # @param max_tokens_sold Maximum Tokens (self.token) sold.
// # @param max_eth_sold Maximum ETH purchased as intermediary.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param token_addr The address of the token being purchased.
// # @return Amount of Tokens (self.token) sold.
// @public
// def tokenToTokenSwapOutput(tokens_bought: uint256, max_tokens_sold: uint256, max_eth_sold: uint256(wei), deadline: timestamp, token_addr: address) -> uint256:
//     exchange_addr: address = self.factory.getExchange(token_addr)
//     return self.tokenToTokenOutput(tokens_bought, max_tokens_sold, max_eth_sold, deadline, msg.sender, msg.sender, exchange_addr)

// # @notice Convert Tokens (self.token) to Tokens (token_addr) and transfers
// #         Tokens (token_addr) to recipient.
// # @dev User specifies maximum input and exact output.
// # @param tokens_bought Amount of Tokens (token_addr) bought.
// # @param max_tokens_sold Maximum Tokens (self.token) sold.
// # @param max_eth_sold Maximum ETH purchased as intermediary.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param recipient The address that receives output ETH.
// # @param token_addr The address of the token being purchased.
// # @return Amount of Tokens (self.token) sold.
// @public
// def tokenToTokenTransferOutput(tokens_bought: uint256, max_tokens_sold: uint256, max_eth_sold: uint256(wei), deadline: timestamp, recipient: address, token_addr: address) -> uint256:
//     exchange_addr: address = self.factory.getExchange(token_addr)
//     return self.tokenToTokenOutput(tokens_bought, max_tokens_sold, max_eth_sold, deadline, msg.sender, recipient, exchange_addr)

// # @notice Convert Tokens (self.token) to Tokens (exchange_addr.token).
// # @dev Allows trades through contracts that were not deployed from the same factory.
// # @dev User specifies exact input and minimum output.
// # @param tokens_sold Amount of Tokens sold.
// # @param min_tokens_bought Minimum Tokens (token_addr) purchased.
// # @param min_eth_bought Minimum ETH purchased as intermediary.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param exchange_addr The address of the exchange for the token being purchased.
// # @return Amount of Tokens (exchange_addr.token) bought.
// @public
// def tokenToExchangeSwapInput(tokens_sold: uint256, min_tokens_bought: uint256, min_eth_bought: uint256(wei), deadline: timestamp, exchange_addr: address) -> uint256:
//     return self.tokenToTokenInput(tokens_sold, min_tokens_bought, min_eth_bought, deadline, msg.sender, msg.sender, exchange_addr)

// # @notice Convert Tokens (self.token) to Tokens (exchange_addr.token) and transfers
// #         Tokens (exchange_addr.token) to recipient.
// # @dev Allows trades through contracts that were not deployed from the same factory.
// # @dev User specifies exact input and minimum output.
// # @param tokens_sold Amount of Tokens sold.
// # @param min_tokens_bought Minimum Tokens (token_addr) purchased.
// # @param min_eth_bought Minimum ETH purchased as intermediary.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param recipient The address that receives output ETH.
// # @param exchange_addr The address of the exchange for the token being purchased.
// # @return Amount of Tokens (exchange_addr.token) bought.
// @public
// def tokenToExchangeTransferInput(tokens_sold: uint256, min_tokens_bought: uint256, min_eth_bought: uint256(wei), deadline: timestamp, recipient: address, exchange_addr: address) -> uint256:
//     assert recipient != self
//     return self.tokenToTokenInput(tokens_sold, min_tokens_bought, min_eth_bought, deadline, msg.sender, recipient, exchange_addr)

// # @notice Convert Tokens (self.token) to Tokens (exchange_addr.token).
// # @dev Allows trades through contracts that were not deployed from the same factory.
// # @dev User specifies maximum input and exact output.
// # @param tokens_bought Amount of Tokens (token_addr) bought.
// # @param max_tokens_sold Maximum Tokens (self.token) sold.
// # @param max_eth_sold Maximum ETH purchased as intermediary.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param exchange_addr The address of the exchange for the token being purchased.
// # @return Amount of Tokens (self.token) sold.
// @public
// def tokenToExchangeSwapOutput(tokens_bought: uint256, max_tokens_sold: uint256, max_eth_sold: uint256(wei), deadline: timestamp, exchange_addr: address) -> uint256:
//     return self.tokenToTokenOutput(tokens_bought, max_tokens_sold, max_eth_sold, deadline, msg.sender, msg.sender, exchange_addr)

// # @notice Convert Tokens (self.token) to Tokens (exchange_addr.token) and transfers
// #         Tokens (exchange_addr.token) to recipient.
// # @dev Allows trades through contracts that were not deployed from the same factory.
// # @dev User specifies maximum input and exact output.
// # @param tokens_bought Amount of Tokens (token_addr) bought.
// # @param max_tokens_sold Maximum Tokens (self.token) sold.
// # @param max_eth_sold Maximum ETH purchased as intermediary.
// # @param deadline Time after which this transaction can no longer be executed.
// # @param recipient The address that receives output ETH.
// # @param token_addr The address of the token being purchased.
// # @return Amount of Tokens (self.token) sold.
// @public
// def tokenToExchangeTransferOutput(tokens_bought: uint256, max_tokens_sold: uint256, max_eth_sold: uint256(wei), deadline: timestamp, recipient: address, exchange_addr: address) -> uint256:
//     assert recipient != self
//     return self.tokenToTokenOutput(tokens_bought, max_tokens_sold, max_eth_sold, deadline, msg.sender, recipient, exchange_addr)

// # @notice Public price function for ETH to Token trades with an exact input.
// # @param eth_sold Amount of ETH sold.
// # @return Amount of Tokens that can be bought with input ETH.
// @public
// @constant
// def getEthToTokenInputPrice(eth_sold: uint256(wei)) -> uint256:
//     assert eth_sold > 0
//     token_reserve: uint256 = self.token.balanceOf(self)
//     return self.getInputPrice(as_unitless_number(eth_sold), as_unitless_number(self.balance), token_reserve)

// # @notice Public price function for ETH to Token trades with an exact output.
// # @param tokens_bought Amount of Tokens bought.
// # @return Amount of ETH needed to buy output Tokens.
// @public
// @constant
// def getEthToTokenOutputPrice(tokens_bought: uint256) -> uint256(wei):
//     assert tokens_bought > 0
//     token_reserve: uint256 = self.token.balanceOf(self)
//     eth_sold: uint256 = self.getOutputPrice(tokens_bought, as_unitless_number(self.balance), token_reserve)
//     return as_wei_value(eth_sold, 'wei')

// # @notice Public price function for Token to ETH trades with an exact input.
// # @param tokens_sold Amount of Tokens sold.
// # @return Amount of ETH that can be bought with input Tokens.
// @public
// @constant
// def getTokenToEthInputPrice(tokens_sold: uint256) -> uint256(wei):
//     assert tokens_sold > 0
//     token_reserve: uint256 = self.token.balanceOf(self)
//     eth_bought: uint256 = self.getInputPrice(tokens_sold, token_reserve, as_unitless_number(self.balance))
//     return as_wei_value(eth_bought, 'wei')

// # @notice Public price function for Token to ETH trades with an exact output.
// # @param eth_bought Amount of output ETH.
// # @return Amount of Tokens needed to buy output ETH.
// @public
// @constant
// def getTokenToEthOutputPrice(eth_bought: uint256(wei)) -> uint256:
//     assert eth_bought > 0
//     token_reserve: uint256 = self.token.balanceOf(self)
//     return self.getOutputPrice(as_unitless_number(eth_bought), token_reserve, as_unitless_number(self.balance))

// # @return Address of Token that is sold on this exchange.
// @public
// @constant
// def tokenAddress() -> address:
//     return self.token

// # @return Address of factory that created this exchange.
// @public
// @constant
// def factoryAddress() -> address(Factory):
//     return self.factory

// # ERC20 compatibility for exchange liquidity modified from
// # https://github.com/ethereum/vyper/blob/master/examples/tokens/ERC20.vy
// @public
// @constant
// def balanceOf(_owner : address) -> uint256:
//     return self.balances[_owner]

// @public
// def transfer(_to : address, _value : uint256) -> bool:
//     self.balances[msg.sender] -= _value
//     self.balances[_to] += _value
//     log.Transfer(msg.sender, _to, _value)
//     return True

// @public
// def transferFrom(_from : address, _to : address, _value : uint256) -> bool:
//     self.balances[_from] -= _value
//     self.balances[_to] += _value
//     self.allowances[_from][msg.sender] -= _value
//     log.Transfer(_from, _to, _value)
//     return True

// @public
// def approve(_spender : address, _value : uint256) -> bool:
//     self.allowances[msg.sender][_spender] = _value
//     log.Approval(msg.sender, _spender, _value)
//     return True

// @public
// @constant
// def allowance(_owner : address, _spender : address) -> uint256:
//     return self.allowances[_owner][_spender]



Exchange.prototype.neutralPrice = function () {
    return this.tokenReserve / this.ethReserve;
}


let exchange = new Exchange(100, 10)

console.log(exchange)
const trade5 = exchange.addLiquidity(100)
console.log(exchange)
exchange.removeLiquidity(10)
exchange.getInputPrice(10)
exchange.removeLiquidity(10)
exchange.getInputPrice(10)
exchange.removeLiquidity(10)
exchange.getInputPrice(10)
console.log(exchange.getInputPrice(10))
exchange.removeLiquidity(10)
exchange.getInputPrice(10)
exchange.removeLiquidity(10)

exchange.ethToTokenOutput(10)
exchange.ethToTokenInput(10)
exchange.removeLiquidity(10)
exchange.removeLiquidity(10)

exchange.removeLiquidity(10)

exchange.getInputPrice(10)
console.log(exchange)
console.log(trade5)