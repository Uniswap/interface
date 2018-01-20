module.exports.factoryABI =
[
	{
		"constant": false,
		"inputs": [
			{
				"name": "token",
				"type": "address"
			}
		],
		"name": "createExchange",
		"outputs": [
			{
				"name": "exchange",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [],
		"name": "getExchangeCount",
		"outputs": [
			{
				"name": "exchangeCount",
				"type": "uint256"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "",
				"type": "uint256"
			}
		],
		"name": "tokenList",
		"outputs": [
			{
				"name": "",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "token",
				"type": "address"
			}
		],
		"name": "tokenToExchangeLookup",
		"outputs": [
			{
				"name": "exchange",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	},
	{
		"constant": true,
		"inputs": [
			{
				"name": "exchange",
				"type": "address"
			}
		],
		"name": "exchangeToTokenLookup",
		"outputs": [
			{
				"name": "token",
				"type": "address"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]
