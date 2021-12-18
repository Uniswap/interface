import { useWeb3React } from '@web3-react/core';
import Badge from 'components/Badge';
import Tooltip from 'components/Tooltip';
import moment from 'moment';
import React from 'react'
import { Info } from 'react-feather';
import Web3 from 'web3';

export const kibaAbi = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Approval",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "_maxTxAmount",
				"type": "uint256"
			}
		],
		"name": "MaxTxAmountUpdated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "from",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "to",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "value",
				"type": "uint256"
			}
		],
		"name": "Transfer",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "approve",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "notbot",
				"type": "address"
			}
		],
		"name": "delBot",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "manualsend",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "manualswap",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "openTrading",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "removeStrictTxLimit",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address[]",
				"name": "bots_",
				"type": "address[]"
			}
		],
		"name": "setBots",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bool",
				"name": "onoff",
				"type": "bool"
			}
		],
		"name": "setCooldownEnabled",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "maxTransactionAmount",
				"type": "uint256"
			}
		],
		"name": "setMaxTx",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transfer",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "sender",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "transferFrom",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "fee",
				"type": "uint256"
			}
		],
		"name": "updateMaxTx",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "spender",
				"type": "address"
			}
		],
		"name": "allowance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "balanceOf",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "decimals",
		"outputs": [
			{
				"internalType": "uint8",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "name",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "originalPurchase",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "symbol",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "totalSupply",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	}
];

export const ShowSellTaxComponent = () => {
	const [showTool, setShowTool] = React.useState(false)
	const { account, library } = useWeb3React()
	const [originalPurchaseDate, setOriginalPurchaseDate] = React.useState<any>()
	const [salesTax, setSalesTax] = React.useState('10');

	React.useEffect(() => {
		try {
			if (!account) {
				setSalesTax("-");
				return;
			}
			if (account) {
				const provider = window.ethereum ? window.ethereum : library?.provider
				const w3 = new Web3(provider as any).eth;
				const routerContr = new w3.Contract(kibaAbi as any, '0x4B2C54b80B77580dc02A0f6734d3BAD733F50900');
				const ten9 = 10 ** 9;
				const amountsOut = routerContr.methods.originalPurchase(account)
				amountsOut.call().then((response: any) => {
					setOriginalPurchaseDate(response);
				});
				// pseudo code
			}
		} catch (err) {
			console.error(err);
		}
	}, [account]);

	const [timeHolding, setTimeHolding] = React.useState('')

	const toolMessage = React.useMemo(() => {
		let message = '';
		let currentTax = 0;
		if (originalPurchaseDate) {
			const datePurchased = new Date(+originalPurchaseDate * 1000)
			const now = (new Date().valueOf() * 1000)

			message += `\r\n\r\n`;

			const holdingTime = (moment(new Date()).diff(moment(datePurchased), 'hours'));
			setTimeHolding(holdingTime.toString())
			if (holdingTime < 24) {
				message += `You need to wait ${24 - holdingTime} hour(s) until your sales tax reduces\r\n\r\n<br/>`;
				currentTax = 25;
			} else if (holdingTime > 24) {
				currentTax = 8;
			}

			message += `Original Purchase Timestamp: ${moment(datePurchased).toDate().toLocaleString()}`;

			setSalesTax(currentTax.toString())
			return message;
		} else {
			message += `You haven't purchased any Kiba yet to be applicable for our sales tax. Buy some now!`;
		}
		return message
	}, [originalPurchaseDate])

	return (
		originalPurchaseDate <= 0 ? null : 
		<div style={{ display: 'flex', justifyContent: 'flex-end', flexFlow: 'column wrap' }}>
			<span style={{ marginBottom: 5 }}>
				Sales Tax {salesTax}%
				<Tooltip show={showTool} text={toolMessage}>
					<Info style={{ position: 'relative', top: 5 }}
						onMouseEnter={() => setShowTool(true)}
						onMouseLeave={() => setShowTool(false)} />
				</Tooltip>
			</span>
			<Badge style={{ background: Number(salesTax) > 8 ? 'red' : 'green', color: "#FFF", display: 'flex', justifyContent: 'flex-end', width: 'max-content', textAlign: 'right' }}>
				{timeHolding} hours holding
			</Badge>

		</div>
	)

}