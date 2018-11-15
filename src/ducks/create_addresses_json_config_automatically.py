import json

## Prerequisites
## Deploy a Uniswap "Factory" contract and add the address below. The bytecode and abi files are available at
## https://github.com/Uniswap/contracts-vyper/tree/master/abi and https://github.com/Uniswap/contracts-vyper/tree/master/bytecode

factoryAddress = "0x54ee54718e37fd2efd3521bf2ff2e1b55fe040a7"

## Deploy one or more ERC20 compliant token contracts and add the address[es] below.

tokenAddresses = {
	'TIM': '0xdcb18351f968887ddda9ba1cb5901badde74ee54',
	'BOB': '0xa063a807c40a0664a87cbd08c6c7664bb9471e3c'
}

## Deploy one separate Uniswap "Exchange" contract for each of the above ERC20 compliant token contracts and add the address[es] below.
## The bytecode and abi files are available at
## https://github.com/Uniswap/contracts-vyper/tree/master/abi and https://github.com/Uniswap/contracts-vyper/tree/master/bytecode

exchangeAddresses = {
	'TIM': '0x490b49b11301cac7277245695944f7e7749e5a7d',
	'BOB': '0x8cf42dc5497d295f988dba7b55c0f5fdb388b4c8'
}

## Add your network name below.
networkName = "MyTestNet"

# FUNCTIONS

def buildAddresses(addressType):
	addressJsData[addressType] = {}
	addresses = []
	address = []
	for (k, v) in eval(addressType).items():
		address.append(k)
		address.append(v)
		addresses.append(address)
		address = []
	addressJsData[addressType]['address'] = addresses

def pairExchangeAndTokenAddresses():
	fromToken = {}
	for (k1, v1) in tokenAddresses.items():
		for (k2, v2) in exchangeAddresses.items():
			if(k1 == k2):
				fromToken[v1] = v2
	addressJsData['exchangeAddresses']['fromToken'] = fromToken

# EXECUTION START #

addressJsData = {}
addressJsData['factoryAddress'] = factoryAddress

buildAddresses('exchangeAddresses')
buildAddresses('tokenAddresses')
pairExchangeAndTokenAddresses()

stringForAddressJsFile = ""
stringForAddressJsFile = stringForAddressJsFile + "const " + networkName.upper() + " = " + json.dumps(addressJsData,indent=4) + ";"
print(stringForAddressJsFile)

'''
# Example output
const MYTESTNET = {
    "factoryAddress": "0x54ee54718e37fd2efd3521bf2ff2e1b55fe040a7",
    "exchangeAddresses": {
        "address": [
            [
                "TIM",
                "0x490b49b11301cac7277245695944f7e7749e5a7d"
            ],
            [
                "BOB",
                "0x8cf42dc5497d295f988dba7b55c0f5fdb388b4c8"
            ]
        ],
        "fromToken": {
            "0xdcb18351f968887ddda9ba1cb5901badde74ee54": "0x490b49b11301cac7277245695944f7e7749e5a7d",
            "0xa063a807c40a0664a87cbd08c6c7664bb9471e3c": "0x8cf42dc5497d295f988dba7b55c0f5fdb388b4c8"
        }
    },
    "tokenAddresses": {
        "address": [
            [
                "TIM",
                "0xdcb18351f968887ddda9ba1cb5901badde74ee54"
            ],
            [
                "BOB",
                "0xa063a807c40a0664a87cbd08c6c7664bb9471e3c"
            ]
        ]
    }
}

'''
