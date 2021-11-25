import { isAddress } from 'utils';
import Web3 from 'web3';
export const getTaxesForBscToken = async (address: string, provider: any): Promise<{honeypot: boolean, buy: number | null, sell: number | null}>=> {

const web3 = new Web3(provider as any);
  let maxTXAmount = 0;
  let maxSell = 0;

  async function tryGetMaxes() {
    let sig = web3.eth.abi.encodeFunctionSignature({name: '_maxTxAmount', type: 'function', inputs: []});
 let d = {
      to: address,
      from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
      value: 0,
      gas: 15000000,
      data: sig,
  };
  try {
      const val = await web3.eth.call(d);
      maxTXAmount = web3.utils.toBN(val) as any;
      console.log(val, maxTXAmount);
  } catch (e) {
      console.log('_maxTxAmount: ', e);
      // I will nest as much as I want. screw javascript.
      sig = web3.eth.abi.encodeFunctionSignature({name: 'maxSellTransactionAmount', type: 'function', inputs: []});
      d = {
          to: address,
          from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
          value: 0,
          gas: 15000000,
          data: sig,
      };
      try {
          const val2 = await web3.eth.call(d);
          maxSell = web3.utils.toBN(val2) as any;
          console.log(val2, maxSell);
      } catch (e) {

      }
  }
}
  if (!isAddress(address)) return Promise.resolve({honeypot:false, buy: null, sell: null});
  if (isAddress(address)) {
    try {
    const honeyData: Record<string, any> = {};
    const encodedAddress = web3.eth.abi.encodeParameter('address', address);
    const contractFuncData = '0xd66383cb';
    const callData = contractFuncData + encodedAddress.substring(2);
    const tokenName = '';
    const tokenSymbol = '';
    const tokenDecimals = 0;
    const bnbIN = 1000000000000000000;
    const maxTxBNB: any = null;
    const blacklisted: Record<string, string> = {
      '0xa914f69aef900beb60ae57679c5d4bc316a2536a': 'SPAMMING SCAM',
      '0x105e62565a31c269439b29371df4588bf169cef5': 'SCAM',
      '0xbbd1d56b4ccab9302aecc3d9b18c0c1799fe7525': 'Error: TRANSACTION_FROM_FAILED'
    };
    const unableToCheck: Record<string, string> = {
      '0x54810d2e8d3a551c8a87390c4c18bb739c5b2063': 'Coin does not utilise PancakeSwap'
    };

    if (blacklisted[address.toLowerCase()]) {
      honeyData.message = blacklisted[address.toLowerCase()];
      return  Promise.resolve({honeypot:false, buy: null, sell: null});
    }
    if (unableToCheck[address.toLowerCase()] !== undefined) {
      honeyData.message = unableToCheck[address.toLowerCase()];
      return  Promise.resolve({honeypot:false,buy:null,sell:null});
    }

    let val = 100000000000000000;
    if (bnbIN < val) {
      val = bnbIN - 1000;
    }
    return new Promise<{honeypot: boolean, buy: number | null, sell: number | null }>( (resolve, reject) => {
      web3.eth.call({
        to: '0x2bf75fd2fab5fc635a4c6073864c708dfc8396fc',
        from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
        value: val,
        gas: 45000000,
        data: callData,
      })
        .then(async (updatedVal) => {
          await tryGetMaxes()
          const warnings = [];
          const decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], updatedVal);
          const buyExpectedOut = web3.utils.toBN(decoded[0]);
          const buyActualOut = web3.utils.toBN(decoded[1]);
          const sellExpectedOut = web3.utils.toBN(decoded[2]);
          const sellActualOut = web3.utils.toBN(decoded[3]);
          const buyGasUsed = web3.utils.toBN(decoded[4]);
          const sellGasUsed = web3.utils.toBN(decoded[5]);
          const buyTax = Math.round((+buyExpectedOut - +buyActualOut) / +buyExpectedOut * 100 * 10) / 10;
          const sellTax = Math.round((+sellExpectedOut - +sellActualOut) / +sellExpectedOut * 100 * 10) / 10;

          honeyData.sellTax = sellTax;
          honeyData.buyTax = buyTax;
          if (+buyTax + +sellTax > 80) {
            honeyData.isHoneyPot = true;
            warnings.push("Extremely high tax. Effectively a honeypot.")
            return resolve({honeypot: true, buy: null, sell: null});
          }
          if (+sellGasUsed > 1500000) {
            warnings.push("Selling costs a lot of gas.");
          }
          console.log(buyTax, sellTax);
          let maxDiv = '';
          if (maxTXAmount !== 0 || maxSell !== 0) {
            let n = 'Max TX';
            let x = maxTXAmount;
            if (maxSell !== 0) {
              n = 'Max Sell';
              x = maxSell;
              honeyData.maxSell = maxSell;
            }
            let bnbWorth: number | string = '?'
            if (maxTxBNB !== null) {
              bnbWorth = Math.round(maxTxBNB / 10 ** 15) / 10 ** 3;
              honeyData.maxTxAmount = maxSell;
            }
            const tokens = Math.round(x / 10 ** tokenDecimals);
            maxDiv = `<p>${n}: ${tokens} ${tokenSymbol} (~ ${bnbWorth} BNB)</p>`;
          }
          let warningmsg = '';
          let uiType = 'success';
          let warningsEncountered = false;
          if (warnings.length > 0) {
            warningsEncountered = true;
            uiType = 'warning';
            warningmsg = '<p><ul>WARNINGS';
            for (let i = 0; i < warnings.length; i++) {
              warningmsg += `<li>${warnings[i]}</li>`;
            }
            warningmsg += '</ul></p>';
          }
          return resolve({honeypot: false, buy: buyTax, sell: sellTax});
        })
        .catch(err => {
          if (err === 'Error: Returned error: execution reverted') {
            return resolve({honeypot: true, buy: null, sell: null});
          }
          return resolve({honeypot: true, buy: null, sell: null});
        });
    })
  } catch (ex) {
    return Promise.resolve({honeypot: true, buy: null, sell: null})
  }
  } else return Promise.resolve({honeypot: false, buy: null, sell: null})
}



export const getTokenTaxes =  (address:string, provider?: any): Promise<{buy: null | number, sell: null | number, honeypot: boolean}>  => {
    const web3 = new Web3(provider as any);
    let buyTax = 0,
    sellTax = 0;
      if (!address) {
        return Promise.resolve({honeypot: false, buy: null, sell: null});
      }
  
  
      if (isAddress(address.toLowerCase())) {
        web3.extend({
          methods: [{
            name: 'callWithState',
            call: 'eth_call',
            params: 3,
          }]
        });
        const tokenSymbol = '';
        const tokenDecimals = 0;
        const maxSell = 0;
        const maxTXAmount = 0;
        const bnbIN = 1000000000000000000;
        const encodedAddress = web3.eth.abi.encodeParameter('address', address);
        const contractFuncData = '0xd66383cb';
        const callData = contractFuncData + encodedAddress.substring(2);
        const bbCode = '0x6080604052600436106100645760003560e01c8063098d32281461017157806362d9a85c1461019a5780638da5cb5b146101cb5780638f0eb6b1146101f35780639eded3f814610213578063d66383cb14610233578063f2fde38b14610273576100ba565b366100ba57600054600160a01b900460ff166100b85760405162461bcd60e51b815260206004820152600e60248201526d7768792073656e6420626e62733f60901b60448201526064015b60405180910390fd5b005b6000546001600160a01b031633146100e45760405162461bcd60e51b81526004016100af90610c12565b600154600160a01b900460ff166101385760405162461bcd60e51b8152602060048201526018602482015277776861742061726520796f75206576656e20646f696e673f60401b60448201526064016100af565b6001546040516001600160a01b039091169036600082376000803683855af43d82016040523d6000833e80801561016d573d83f35b3d83fd5b34801561017d57600080fd5b5061018760001981565b6040519081526020015b60405180910390f35b3480156101a657600080fd5b506001546101bb90600160a01b900460ff1681565b6040519015158152602001610191565b3480156101d757600080fd5b506000546040516001600160a01b039091168152602001610191565b3480156101ff57600080fd5b506100b861020e366004610a40565b610293565b34801561021f57600080fd5b506100b861022e366004610b46565b6102e6565b610246610241366004610a40565b61032e565b604080519687526020870195909552938501929092526060840152608083015260a082015260c001610191565b34801561027f57600080fd5b506100b861028e366004610a40565b610397565b6000546001600160a01b031633146102bd5760405162461bcd60e51b81526004016100af90610c12565b600180546001600160a01b039092166001600160a81b031990921691909117600160a01b179055565b6000546001600160a01b031633146103105760405162461bcd60e51b81526004016100af90610c12565b60008054911515600160a81b0260ff60a81b19909216919091179055565b60008080808080737a250d5630b4cf539739df2c5dacb4c659f2488d818080610358848c34610421565b919450925090506103698b836106c0565b6000806000610379878f876107ed565b979e50959c509a509398509196509294505050505091939550919395565b6000546001600160a01b031633146103c15760405162461bcd60e51b81526004016100af90610c12565b6001600160a01b0381166103ff5760405162461bcd60e51b81526020600482015260056024820152640cae4e462f60db1b60448201526064016100af565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b604080516002808252606082018352600092839283928392602083019080368337019050509050866001600160a01b031663ad5c46486040518163ffffffff1660e01b815260040160206040518083038186803b15801561048157600080fd5b505afa158015610495573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104b99190610a64565b816000815181106104cc576104cc610cb3565b60200260200101906001600160a01b031690816001600160a01b031681525050858160018151811061050057610500610cb3565b6001600160a01b03928316602091820292909201015260405163d06ca61f60e01b815260009189169063d06ca61f9061053f9089908690600401610c31565b60006040518083038186803b15801561055757600080fd5b505afa15801561056b573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526105939190810190610a81565b90506000816001815181106105aa576105aa610cb3565b6020026020010151905060005a9050896001600160a01b031663b6f9de958960008730426040518663ffffffff1660e01b81526004016105ed9493929190610bdd565b6000604051808303818588803b15801561060657600080fd5b505af115801561061a573d6000803e3d6000fd5b505050505060005a61062c9083610c8e565b6040516370a0823160e01b81523060048201529091508a906000906001600160a01b038316906370a082319060240160206040518083038186803b15801561067357600080fd5b505afa158015610687573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106ab9190610b80565b949d949c50919a509298505050505050505050565b60405163095ea7b360e01b8152737a250d5630b4cf539739df2c5dacb4c659f2488d6004820152600019602482015282906001600160a01b0382169063095ea7b390604401602060405180830381600087803b15801561071f57600080fd5b505af192505050801561074f575060408051601f3d908101601f1916820190925261074c91810190610b63565b60015b6107e75760405163095ea7b360e01b8152737a250d5630b4cf539739df2c5dacb4c659f2488d6004820152602481018390526001600160a01b0382169063095ea7b390604401602060405180830381600087803b1580156107af57600080fd5b505af11580156107c3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107e79190610b63565b50505050565b604080516002808252606082018352600092839283928392602083019080368337019050509050858160008151811061082857610828610cb3565b60200260200101906001600160a01b031690816001600160a01b031681525050866001600160a01b031663ad5c46486040518163ffffffff1660e01b815260040160206040518083038186803b15801561088157600080fd5b505afa158015610895573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108b99190610a64565b816001815181106108cc576108cc610cb3565b6001600160a01b03928316602091820292909201015260405163d06ca61f60e01b815260009189169063d06ca61f9061090b9089908690600401610c31565b60006040518083038186803b15801561092357600080fd5b505afa158015610937573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f1916820160405261095f9190810190610a81565b905060008160018151811061097657610976610cb3565b60209081029190910101516000805460ff60a01b1916600160a01b17815590915047905a60405163791ac94760e01b81529091506001600160a01b038c169063791ac947906109d2908c906000908a9030904290600401610c52565b600060405180830381600087803b1580156109ec57600080fd5b505af1158015610a00573d6000803e3d6000fd5b5050505060005a610a119083610c8e565b6000805460ff60a01b19168155909150610a2b8447610c8e565b949d949c50909a509298505050505050505050565b600060208284031215610a5257600080fd5b8135610a5d81610cdf565b9392505050565b600060208284031215610a7657600080fd5b8151610a5d81610cdf565b60006020808385031215610a9457600080fd5b825167ffffffffffffffff80821115610aac57600080fd5b818501915085601f830112610ac057600080fd5b815181811115610ad257610ad2610cc9565b8060051b604051601f19603f83011681018181108582111715610af757610af7610cc9565b604052828152858101935084860182860187018a1015610b1657600080fd5b600095505b83861015610b39578051855260019590950194938601938601610b1b565b5098975050505050505050565b600060208284031215610b5857600080fd5b8135610a5d81610cf7565b600060208284031215610b7557600080fd5b8151610a5d81610cf7565b600060208284031215610b9257600080fd5b5051919050565b600081518084526020808501945080840160005b83811015610bd25781516001600160a01b031687529582019590820190600101610bad565b509495945050505050565b848152608060208201526000610bf66080830186610b99565b6001600160a01b03949094166040830152506060015292915050565b6020808252600590820152640cae4e460f60db1b604082015260600190565b828152604060208201526000610c4a6040830184610b99565b949350505050565b85815284602082015260a060408201526000610c7160a0830186610b99565b6001600160a01b0394909416606083015250608001529392505050565b600082821015610cae57634e487b7160e01b600052601160045260246000fd5b500390565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160a01b0381168114610cf457600080fd5b50565b8015158114610cf457600080fdfea264697066735822122055a2cf41241dc699f20971bece1cef6267ea3394de09413d5f978e96037f34a364736f6c63430008060033';
  
        let val = 50000000000000000;
        if (bnbIN < val) {
          val = bnbIN - 1000;
        }
        return new Promise((resolve) => {
  
        (web3 as any).callWithState({
          to: '0x5bf62ec82af715ca7aa365634fab0e8fd7bf92c7',
          from: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
          value: '0x' + val.toString(16),
          gas: '0x' + (45000000).toString(16),
          data: callData,
        }, 'latest', {
          '0x5bf62ec82af715ca7aa365634fab0e8fd7bf92c7': {
            'code': bbCode,
          },
          '0xCD5312d086f078D1554e8813C27Cf6C9D1C3D9b3': {
            'code': '0x608060405234801561001057600080fd5b50600436106100365760003560e01c806312bdf4231461003b578063155d0ed914610062575b600080fd5b61004e610049366004610127565b6100b1565b604051901515815260200160405180910390f35b6100af610070366004610127565b6001600160a01b039283166000908152602081815260408083204390819055948616835260018252808320859055929094168152600290935290912055565b005b6001600160a01b0380821660009081526002602090815260408083205486851684526001835281842054948816845291839052822054919283926100f5919061016a565b6100ff919061016a565b50600095945050505050565b80356001600160a01b038116811461012257600080fd5b919050565b60008060006060848603121561013c57600080fd5b6101458461010b565b92506101536020850161010b565b91506101616040850161010b565b90509250925092565b6000821982111561018b57634e487b7160e01b600052601160045260246000fd5b50019056fea26469706673582212202288a2eeda68890e8bd67abf689f2c0469dcc2bc6b9cc73f7876d2f8d63dfea764736f6c63430008060033',
          },
          '0x8894e0a0c962cb723c1976a4421c95949be2d4e3': {
            'balance': '0x' + (100000000000000000000).toString(16),
          }
        })
          .then(async (val: any) => {
            const honey_data: Record<string, any> = {}
            const maxTxBNB = null;
            const decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], val);
            const buyExpectedOut = web3.utils.toBN(decoded[0]) as any as number;
            const buyActualOut = web3.utils.toBN(decoded[1]) as any as number;
            const sellExpectedOut = web3.utils.toBN(decoded[2]) as any as number;
            const sellActualOut = web3.utils.toBN(decoded[3]) as any as number;
            const buy_tax = Math.round((buyExpectedOut - buyActualOut) / buyExpectedOut * 100 * 10) / 10;
            const sell_tax = Math.round((sellExpectedOut - sellActualOut) / sellExpectedOut * 100 * 10) / 10;
            buyTax = buy_tax,
            sellTax = sell_tax;
            honey_data['buyExpected'] = buyExpectedOut;
            honey_data['buyActual'] = buyActualOut;
            honey_data['sellExpected'] = sellExpectedOut;
            honey_data['sellActual'] = sellActualOut;
  
            honey_data['buyTax'] = buy_tax;
            honey_data['sellTax'] = sell_tax;
            let maxdiv = '';
            if (maxTXAmount != 0 || maxSell != 0) {
              let n = 'Max TX';
              let x = maxTXAmount;
              honey_data['maxTxAmount'] = maxTXAmount;
              if (maxSell != 0) {
                n = 'Max Sell';
                x = maxSell;
                honey_data['maxSell'] = maxSell;
              }
              let bnbWorth = '?'
              if (maxTxBNB != null) {
                bnbWorth = (Math.round(maxTxBNB / 10 ** 15) / 10 ** 3).toString();
              }
              const tokens = Math.round(x / 10 ** tokenDecimals);
              maxdiv = '<p>' + n + ': ' + tokens + ' ' + tokenSymbol + ' (~' + bnbWorth + ' ETH)</p>';
              honey_data['isHoneyPot'] = false;
            }
            honey_data['ran'] = true;
            return resolve({honeypot: false, buy: buyTax, sell: sellTax});
          })
          .catch((err: any) => {
            if (err == 'Error: Returned error: execution reverted') {
  
              return;
            }
            return resolve({honeypot: true, buy: null, sell: null});
          })
        });
  
    } else return Promise.resolve({honeypot: false, buy: null, sell: null});
  }