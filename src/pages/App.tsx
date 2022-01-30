import { useWeb3React } from '@web3-react/core'
import { AutoColumn } from 'components/Column'
import { DonationTracker } from 'components/LiquidityChartRangeInput/DonationTracker'
import { RowFixed } from 'components/Row'
import { walletconnect } from 'connectors'
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider} from "@apollo/client";
import logo from '../assets/images/download.png'
import btok from '../assets/sponsors/btok2.svg' 
import bg4 from '../assets/images/bg4.jpg' 
import { GelatoProvider, useGelatoLimitOrders, useGelatoLimitOrdersHandlers } from "@gelatonetwork/limit-orders-react";
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import React, { useState } from 'react'
import { AlertOctagon, CheckCircle, Info, Globe, ChevronUp, ChevronDown, AlertCircle } from 'react-feather'
import { Route, Switch } from 'react-router-dom'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { isAddress } from 'utils'
import Web3 from 'web3'
import AddressClaimModal from '../components/claim/AddressClaimModal'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { ApplicationModal } from '../state/application/actions'
import { useModalOpen, useToggleModal } from '../state/application/hooks'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import AddLiquidity from './AddLiquidity'
import { RedirectDuplicateTokenIds } from './AddLiquidity/redirects'
import { RedirectDuplicateTokenIdsV2 } from './AddLiquidityV2/redirects'
import CreateProposal from './CreateProposal'
import Earn from './Earn'
import Manage from './Earn/Manage'
import { GainsTracker } from './GainsTracker/GainsTracker'
import MigrateV2 from './MigrateV2'
import MigrateV2Pair from './MigrateV2/MigrateV2Pair'
import Pool from './Pool'
import { PositionPage } from './Pool/PositionPage'
import PoolV2 from './Pool/v2'
import PoolFinder from './PoolFinder'
import RemoveLiquidity from './RemoveLiquidity'
import RemoveLiquidityV3 from './RemoveLiquidity/V3'
import { Suite } from './Suite/Suite'
import Swap, { CardWrapper, FixedContainer, ScrollableRow } from './Swap'
import { OpenClaimAddressModalAndRedirectToSwap, RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'
import { AddProposal } from './Vote/AddProposal'
import { ProposalDetails } from './Vote/ProposalDetails'
import { TrumpVote } from './Vote/TrumpVote'
import VotePage from './Vote/VotePage'
import { useKiba } from './Vote/VotePage'
import VotePageV2 from './Vote/VotePageV2'
import cart from '../assets/sponsors/cryptocart.svg'
import Swal from 'sweetalert2'
import { bscClient, client, useTokenData } from 'state/logs/utils'
import { DarkCard, DarkGreyCard } from 'components/Card'
import { HoneyPotBsc} from './HoneyPotBsc'
import { ChartPage, useTokenInfo } from 'components/swap/ChartPage'
import { SelectiveChart } from './Swap/SelectiveCharting'
import { FomoPage, LimitOrders } from 'state/transactions/hooks'
import Badge, { BadgeVariant } from 'components/Badge'
import { useContractOwner } from 'components/swap/ConfirmSwapModal'
import Tooltip from 'components/Tooltip'
import { TokenBalanceContextProvider } from 'utils/binance.utils'
import { AccountPage,AccountPageWithAccount } from 'components/AccountPage/AccountPage'
import { Transactions } from './Vote/TransactionsPage'
import { LifetimeReflections } from './Swap/LifetimeReflections'
import Vote from './Vote'
import TopTokenMovers from 'components/swap/TopMovers'
import AppBody from './AppBody'
import { FavoritesPanel } from 'components/FavoritesPanel'
import { getTokenTaxes } from './HoneyUtils'
import Marquee from 'react-marquee-slider'
import { Flex } from 'rebass'
import { ExternalLinkIcon, TYPE } from 'theme'
import { CardSection } from 'components/earn/styled'
import { TopTokenHolders } from 'components/TopTokenHolders/TopTokenHolders'
const THEME_BG_KEY = 'themedBG';
const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  background:#000;
  align-items: flex-start;
  > * {
    font-family: 'Bangers', cursive !important;
  }
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 120px 16px 0px 16px;
  align-items: center;
  flex: 1;
  z-index: 1;
  margin-top:3rem;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 6rem 16px 16px 16px;
  `};
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  position: fixed;
  flex-flow:column wrap;
  top: 0;
  z-index: 2;
  margin-bottom:2rem;
`


const StyledHeader = styled.div`
  font-family:"Bangers", cursive;
  font-size:24px;
`
const Marginer = styled.div`
  margin-top: 5rem;
`

function TopLevelModals() {
  return null
}

const VideoWrapper = styled.div`
  position: absolute;
  left: 0;
  min-width: 100%;
  min-height:150vh;
  background: url(${bg4}) center center !important;
  background-size:contain;
  background-position:center center;
  background-repeat:no-repeat;
`
export const isHoneyPot =  (address:string, provider?: any)  => {
  const web3 = new Web3(provider as any);

    if (!address) {
      return Promise.resolve(false);
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
      return new Promise<boolean>((resolve) => {

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
        .then((val: any) => {
          const honey_data: Record<string, any> = {}
          const maxTxBNB = null;
          const decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], val);
          const buyExpectedOut = web3.utils.toBN(decoded[0]) as any as number;
          const buyActualOut = web3.utils.toBN(decoded[1]) as any as number;
          const sellExpectedOut = web3.utils.toBN(decoded[2]) as any as number;
          const sellActualOut = web3.utils.toBN(decoded[3]) as any as number;
          const buy_tax = Math.round((buyExpectedOut - buyActualOut) / buyExpectedOut * 100 * 10) / 10;
          const sell_tax = Math.round((sellExpectedOut - sellActualOut) / sellExpectedOut * 100 * 10) / 10;

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
          return resolve(false);
        })
        .catch((err: any) => {
          if (err == 'Error: Returned error: execution reverted') {

            return;
          }
          return resolve(true);
        })
      });

  } else return Promise.resolve(false);
}

const HoneyPotDetector = () => {
  const { account, chainId, library } = useWeb3React();
  const kibaBalance = useKiba(account)
  const [msg, setMsg] = useState('')
  const [honeyData, setHoneyData] = React.useState<any>({})
  const provider = window.ethereum ? window.ethereum : library?.provider
  const web3 = new Web3(provider as any);
  const tokenData = useTokenData(msg)
  const tokenInfo = useTokenInfo(chainId, msg)
  const [showTip, setShowTip] = React.useState(false)
  const contractOwner = useContractOwner(msg)
const [priceDetailsOpen, setPriceDetailsOpen] = React.useState(!!tokenInfo?.price)
  console.log(tokenInfo)
  const runCheck = (value: string) => {
    if (!value) {
      setHoneyData({})
      setMsg('');
      return;
    };
    if (isAddress(value.toLowerCase())) {
      setMsg(value);
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
      const encodedAddress = web3.eth.abi.encodeParameter('address', value);
      const contractFuncData = '0xd66383cb';
      const callData = contractFuncData + encodedAddress.substring(2);
      const bbCode = '0x6080604052600436106100645760003560e01c8063098d32281461017157806362d9a85c1461019a5780638da5cb5b146101cb5780638f0eb6b1146101f35780639eded3f814610213578063d66383cb14610233578063f2fde38b14610273576100ba565b366100ba57600054600160a01b900460ff166100b85760405162461bcd60e51b815260206004820152600e60248201526d7768792073656e6420626e62733f60901b60448201526064015b60405180910390fd5b005b6000546001600160a01b031633146100e45760405162461bcd60e51b81526004016100af90610c12565b600154600160a01b900460ff166101385760405162461bcd60e51b8152602060048201526018602482015277776861742061726520796f75206576656e20646f696e673f60401b60448201526064016100af565b6001546040516001600160a01b039091169036600082376000803683855af43d82016040523d6000833e80801561016d573d83f35b3d83fd5b34801561017d57600080fd5b5061018760001981565b6040519081526020015b60405180910390f35b3480156101a657600080fd5b506001546101bb90600160a01b900460ff1681565b6040519015158152602001610191565b3480156101d757600080fd5b506000546040516001600160a01b039091168152602001610191565b3480156101ff57600080fd5b506100b861020e366004610a40565b610293565b34801561021f57600080fd5b506100b861022e366004610b46565b6102e6565b610246610241366004610a40565b61032e565b604080519687526020870195909552938501929092526060840152608083015260a082015260c001610191565b34801561027f57600080fd5b506100b861028e366004610a40565b610397565b6000546001600160a01b031633146102bd5760405162461bcd60e51b81526004016100af90610c12565b600180546001600160a01b039092166001600160a81b031990921691909117600160a01b179055565b6000546001600160a01b031633146103105760405162461bcd60e51b81526004016100af90610c12565b60008054911515600160a81b0260ff60a81b19909216919091179055565b60008080808080737a250d5630b4cf539739df2c5dacb4c659f2488d818080610358848c34610421565b919450925090506103698b836106c0565b6000806000610379878f876107ed565b979e50959c509a509398509196509294505050505091939550919395565b6000546001600160a01b031633146103c15760405162461bcd60e51b81526004016100af90610c12565b6001600160a01b0381166103ff5760405162461bcd60e51b81526020600482015260056024820152640cae4e462f60db1b60448201526064016100af565b600080546001600160a01b0319166001600160a01b0392909216919091179055565b604080516002808252606082018352600092839283928392602083019080368337019050509050866001600160a01b031663ad5c46486040518163ffffffff1660e01b815260040160206040518083038186803b15801561048157600080fd5b505afa158015610495573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906104b99190610a64565b816000815181106104cc576104cc610cb3565b60200260200101906001600160a01b031690816001600160a01b031681525050858160018151811061050057610500610cb3565b6001600160a01b03928316602091820292909201015260405163d06ca61f60e01b815260009189169063d06ca61f9061053f9089908690600401610c31565b60006040518083038186803b15801561055757600080fd5b505afa15801561056b573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f191682016040526105939190810190610a81565b90506000816001815181106105aa576105aa610cb3565b6020026020010151905060005a9050896001600160a01b031663b6f9de958960008730426040518663ffffffff1660e01b81526004016105ed9493929190610bdd565b6000604051808303818588803b15801561060657600080fd5b505af115801561061a573d6000803e3d6000fd5b505050505060005a61062c9083610c8e565b6040516370a0823160e01b81523060048201529091508a906000906001600160a01b038316906370a082319060240160206040518083038186803b15801561067357600080fd5b505afa158015610687573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906106ab9190610b80565b949d949c50919a509298505050505050505050565b60405163095ea7b360e01b8152737a250d5630b4cf539739df2c5dacb4c659f2488d6004820152600019602482015282906001600160a01b0382169063095ea7b390604401602060405180830381600087803b15801561071f57600080fd5b505af192505050801561074f575060408051601f3d908101601f1916820190925261074c91810190610b63565b60015b6107e75760405163095ea7b360e01b8152737a250d5630b4cf539739df2c5dacb4c659f2488d6004820152602481018390526001600160a01b0382169063095ea7b390604401602060405180830381600087803b1580156107af57600080fd5b505af11580156107c3573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906107e79190610b63565b50505050565b604080516002808252606082018352600092839283928392602083019080368337019050509050858160008151811061082857610828610cb3565b60200260200101906001600160a01b031690816001600160a01b031681525050866001600160a01b031663ad5c46486040518163ffffffff1660e01b815260040160206040518083038186803b15801561088157600080fd5b505afa158015610895573d6000803e3d6000fd5b505050506040513d601f19601f820116820180604052508101906108b99190610a64565b816001815181106108cc576108cc610cb3565b6001600160a01b03928316602091820292909201015260405163d06ca61f60e01b815260009189169063d06ca61f9061090b9089908690600401610c31565b60006040518083038186803b15801561092357600080fd5b505afa158015610937573d6000803e3d6000fd5b505050506040513d6000823e601f3d908101601f1916820160405261095f9190810190610a81565b905060008160018151811061097657610976610cb3565b60209081029190910101516000805460ff60a01b1916600160a01b17815590915047905a60405163791ac94760e01b81529091506001600160a01b038c169063791ac947906109d2908c906000908a9030904290600401610c52565b600060405180830381600087803b1580156109ec57600080fd5b505af1158015610a00573d6000803e3d6000fd5b5050505060005a610a119083610c8e565b6000805460ff60a01b19168155909150610a2b8447610c8e565b949d949c50909a509298505050505050505050565b600060208284031215610a5257600080fd5b8135610a5d81610cdf565b9392505050565b600060208284031215610a7657600080fd5b8151610a5d81610cdf565b60006020808385031215610a9457600080fd5b825167ffffffffffffffff80821115610aac57600080fd5b818501915085601f830112610ac057600080fd5b815181811115610ad257610ad2610cc9565b8060051b604051601f19603f83011681018181108582111715610af757610af7610cc9565b604052828152858101935084860182860187018a1015610b1657600080fd5b600095505b83861015610b39578051855260019590950194938601938601610b1b565b5098975050505050505050565b600060208284031215610b5857600080fd5b8135610a5d81610cf7565b600060208284031215610b7557600080fd5b8151610a5d81610cf7565b600060208284031215610b9257600080fd5b5051919050565b600081518084526020808501945080840160005b83811015610bd25781516001600160a01b031687529582019590820190600101610bad565b509495945050505050565b848152608060208201526000610bf66080830186610b99565b6001600160a01b03949094166040830152506060015292915050565b6020808252600590820152640cae4e460f60db1b604082015260600190565b828152604060208201526000610c4a6040830184610b99565b949350505050565b85815284602082015260a060408201526000610c7160a0830186610b99565b6001600160a01b0394909416606083015250608001529392505050565b600082821015610cae57634e487b7160e01b600052601160045260246000fd5b500390565b634e487b7160e01b600052603260045260246000fd5b634e487b7160e01b600052604160045260246000fd5b6001600160a01b0381168114610cf457600080fd5b50565b8015158114610cf457600080fdfea264697066735822122055a2cf41241dc699f20971bece1cef6267ea3394de09413d5f978e96037f34a364736f6c63430008060033';

      let val = 50000000000000000;
      if (bnbIN < val) {
        val = bnbIN - 1000;
      }
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
          const taxes = await getTokenTaxes(value, library?.provider);
          const honey_data: Record<string, any> = {}
          const maxTxBNB = null;
          const decoded = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'], val);
          const buyExpectedOut = web3.utils.toBN(decoded[0]) as any as number;
          const buyActualOut = web3.utils.toBN(decoded[1]) as any as number;
          const sellExpectedOut = web3.utils.toBN(decoded[2]) as any as number;
          const sellActualOut = web3.utils.toBN(decoded[3]) as any as number;
          const buy_tax = Math.round((buyExpectedOut - buyActualOut) / buyExpectedOut * 100 * 10) / 10;
          const sell_tax = Math.round((sellExpectedOut - sellActualOut) / sellExpectedOut * 100 * 10) / 10;

          honey_data['buyExpected'] = buyExpectedOut;
          honey_data['buyActual'] = buyActualOut;
          honey_data['sellExpected'] = sellExpectedOut;
          honey_data['sellActual'] = sellActualOut;

          honey_data['buyTax'] = taxes.buy;
          honey_data['sellTax'] = taxes.sell;
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
          setHoneyData(honey_data)
        })
        .catch((err: any) => {
          if (err == 'Error: Returned error: execution reverted') {
            
            return;
          }
          setHoneyData({ isHoneyPot: true, ran: true })
        })
    } else {
      Swal.fire({ title: "The address you entered was not a contract address", icon: 'error', toast: true, timer: 5000, timerProgressBar: true, showConfirmButton: false })
      setHoneyData({})
      setMsg('');
    }
  }

  const hasInvalidPermissions = !account || (!!kibaBalance && +kibaBalance?.toFixed(0) <= 0)
  if (chainId === 56) return <HoneyPotBsc />
  
  return (<DarkCard style={{ background:'radial-gradient(#f5b642, rgba(129,3,3,.99))', opacity: '.96', maxWidth: 600 }} id="honeypage">
    <div style={{ maxWidth: 600, display:'flex', flexFlow:'column wrap',margin: 'auto', paddingBottom: '1rem' }}>
      <Badge style={{width:220}}><StyledHeader>Honeypot Checker (ETH)</StyledHeader></Badge>
      <small style={{marginTop:3, paddingLeft:3}}>Disclaimer: This is an experimental service, use at your own risk and make sure to double check all contract interactions.</small>
    </div>
    <RowFixed style={{ maxWidth: 600, width: "100%" }} >
      {hasInvalidPermissions === false &&
        <AutoColumn style={{ maxWidth: 600, width: "100%" }} gap={'md'}>
          <label>Input a contract address to check if its a honeypot</label>
          <input style={{ padding: 8, width: '100%', marginBottom: 5 }} type={'search'} placeholder={"Input a contract address to check if a honeypot"} onChange={e => runCheck(e.target.value)} />
        </AutoColumn>
      }

      {hasInvalidPermissions &&
        <p>You must hold Kiba Inu tokens in order to use this feature.
        </p>} 
    </RowFixed>
    {hasInvalidPermissions === false && <>
     <RowFixed>
      <AutoColumn style={{
          display:'flex', 
          justifyContent:'space-between', 
          alignItems:'center', 
          flexFlow:'row wrap',
          padding: '9px 14px',
          columnGap: 3
        }}>
        {honeyData && honeyData['ran'] && honeyData['isHoneyPot'] && <div style={{ flexFlow:'row wrap',  display: 'flex' }}><Badge><AlertOctagon style={{color:'#FFF'}} /> &nbsp;HONEY POT DETECTED! {tokenData?.symbol && <>{tokenData?.name}({tokenData?.symbol}) is not safe.</>}</Badge> </div>}
        {honeyData && honeyData['ran'] && !honeyData['isHoneyPot'] && <Badge variant={BadgeVariant.POSITIVE} style={{ textAlign: 'center', display: 'flex' }}><CheckCircle /> This is not a honey pot. </Badge>}
        {honeyData && honeyData['ran'] && contractOwner && <div style={{ paddingBottom: 15, paddingTop: 15, display: 'flex', flexFlow: 'row wrap' }}>
        <div style={{ marginRight: '8px' }}>
          <Badge variant={contractOwner === '0x0000000000000000000000000000000000000000' ? BadgeVariant.POSITIVE : BadgeVariant.WARNING}>Ownership {contractOwner !== '0x0000000000000000000000000000000000000000' && <> NOT </>} Renounced &nbsp; <Tooltip show={showTip} text={<>{'The contract is owned by '} <a href={`https://etherscan.io/address/${contractOwner}`}>{contractOwner}</a> </>}> <Info onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setTimeout(() => setShowTip(false), 1500)} /></Tooltip></Badge>
        </div>
      </div>
        }
       {honeyData && +honeyData['buyTax'] > 0 && <div style={{ paddingLeft: '2rem', paddingRight: '2rem', paddingBottom: 15, paddingTop: 15, display: 'flex', flexFlow: 'row wrap' }}>
          <div style={{ marginRight: '8px' }}>
            <StyledHeader>Buy Tax <br /> {honeyData['buyTax']}% </StyledHeader>
          </div>
          <div style={{ marginRight: '8px' }}>
            <StyledHeader>Sell Tax <br /> {honeyData['sellTax']}% </StyledHeader>
          </div>
          
          {honeyData && honeyData['maxTxAmount'] && <div style={{ marginRight: '8px' }}>
            <StyledHeader>Max Transaction <br /> {honeyData['maxTxAmount']} </StyledHeader>
          </div>}

          {honeyData && honeyData['maxSell'] && <div style={{ marginRight: '8px' }}>
            <StyledHeader>Max Sell <br /> {honeyData['maxSell']} </StyledHeader>
          </div>}
        </div>}
       

       {tokenInfo && <div style={{display:'flex', flexFlow: 'row wrap'}}>
        <div style={{display:'flex', flexFlow: 'row wrap', gap: 2, alignItems:'center'}}><StyledHeader>Website</StyledHeader><a title={!tokenInfo?.website ? 'Website not found' : `${tokenInfo?.symbol} website`} style={{cursor: !tokenInfo?.website ? 'not-allowed' : 'pointer'}} href={tokenInfo.website}>{tokenInfo?.website ? <Globe /> : <AlertCircle />}</a> </div>
       </div>}

      </AutoColumn>
    </RowFixed>
    {msg && <CardSection>
  <TopTokenHolders address={msg} chainId={chainId} />
  </CardSection> }
  {!!tokenInfo && typeof(tokenInfo.price) === 'object' && (
      <div style={{background: 'rgb(0 0 0 / 58%)', padding: 10}}>
        <StyledHeader onClick={() => setPriceDetailsOpen(!priceDetailsOpen)} style={{filter: priceDetailsOpen ? 'drop-shadow(2px 4px 6px black)' : 'none',cursor: 'pointer', width: '100%', display:'flex', justifyContent:'center'}}>Price Details {priceDetailsOpen ? <ChevronUp/> : <ChevronDown />} </StyledHeader>
      {priceDetailsOpen && <RowFixed style={{ paddingRight: '0.5rem', paddingLeft:'0.5rem', maxWidth: 600, width: "100%" }}>
        <AutoColumn style={{         
            display:'flex', 
              justifyContent:'stretch', 
              alignItems:'center',
              flexFlow:'row wrap',
              padding: '9px 14px',
              marginTop: 10,
              columnCount:2,
              columnGap: 12,
              rowGap: 12}}>
                  {!!tokenInfo && typeof(tokenInfo?.price) === 'object'  && (
                    <>
                    <div style={{display:'flex', flexFlow: 'column'}}><StyledHeader>Price</StyledHeader><Badge  variant={BadgeVariant.DEFAULT}>${tokenInfo.price.rate.toFixed(12)}</Badge></div>
                    <div style={{display:'flex', flexFlow: 'column'}}><StyledHeader>Volume (24h)</StyledHeader><Badge  variant={BadgeVariant.DEFAULT}>${tokenInfo.price.volume24h.toLocaleString()}</Badge></div>
                    <div style={{display:'flex', flexFlow: 'column'}}><StyledHeader>Total Supply</StyledHeader><Badge  variant={BadgeVariant.DEFAULT}>{(tokenInfo.totalSupply / 10 ** 9).toLocaleString()}</Badge></div>
                    <div style={{display:'flex', flexFlow: 'column'}}><StyledHeader>Market Cap</StyledHeader><Badge  variant={BadgeVariant.DEFAULT}>${((tokenInfo.totalSupply / 10 ** 9) * tokenInfo.price.rate).toLocaleString()}  </Badge></div>

                    <div style={{display:'flex', flexFlow: 'column'}}><StyledHeader>Price Change % (24hr)</StyledHeader><Badge  variant={BadgeVariant.DEFAULT}>{tokenInfo.price.diff >= 0 ? <ChevronUp color={'green'} /> : <ChevronDown color={'red'} /> } {tokenInfo.price.diff}%</Badge></div>
                    <div style={{display:'flex', flexFlow: 'column'}}><StyledHeader>Price Change % (1 week)</StyledHeader><Badge  variant={BadgeVariant.DEFAULT}>{tokenInfo.price.diff7d >= 0 ? <ChevronUp color={'green'} /> : <ChevronDown color={'red'} /> } {tokenInfo.price.diff7d}%</Badge></div>
                    {tokenInfo.price.diff30d && <div style={{display:'flex', flexFlow: 'column'}}><StyledHeader>Price Change % (1 month)</StyledHeader><Badge variant={BadgeVariant.DEFAULT}>{tokenInfo.price.diff30d >= 0 ? <ChevronUp color={'green'} /> : <ChevronDown color={'red'} /> } {tokenInfo.price.diff30d}%</Badge></div>}
                  </>
                  )}

          </AutoColumn>
      </RowFixed>}
      </div>
    )}
  </>
  }
  </DarkCard>
  )
}

const Fomo = () => {
  return (<DarkCard style={{maxWidth:800,background:'radial-gradient(#eb5b2c,rgba(129,3,3,.95))  '}}>
    <div style={{ padding: '9px 14px' }}>
      <StyledHeader>KibaFOMO <br /><small style={{ fontSize: 12 }}>Powered by tokenfomo.io</small></StyledHeader>
      <iframe src={'https://tokenfomo.io/?f=ethereum'} style={{ width:'100%', maxWidth: '800px', height: '65vh', borderRadius: 6 }} />
    </div>
  </DarkCard>)
}

const StyledDiv = styled.div`
  font-family: "Bangers", cursive;
  font-size:25px;
`

export default function App() {
  const [theme, setTheme] = React.useState('./squeeze2.mp4')
  const themeSource = React.useMemo(() => {
    return theme;
  }, [theme, localStorage.getItem('themedBG')])
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const value = localStorage.getItem("hasOverride");
  React.useEffect(() => {
    if (!value && !darkMode) {
      toggleDarkMode();
      localStorage.setItem("hasOverride", "1");
    }
  }, [value])
  const [style, setStyle] = useState({ background: '#333' })
  const Video = React.useMemo(() => {
    return (
      <VideoWrapper style={style} >
      </VideoWrapper>
    )
  }, [themeSource, theme, localStorage.getItem(THEME_BG_KEY)])
  const {chainId,account,library} = useWeb3React()
  
  const GainsPage = (props:any) =>   <TokenBalanceContextProvider><VotePage {...props} /></TokenBalanceContextProvider>
  return (
    <ErrorBoundary>
      <Route component={DarkModeQueryParamReader} />
      <Route component={ApeModeQueryParamReader} />
      <Web3ReactManager>
      <GelatoProvider
        library={library}
        chainId={chainId}
        account={account ?? undefined} 
        useDefaultTheme={false}
        useDarkMode
        >
        <ApolloProvider client={chainId && chainId === 1 ? client : chainId && chainId === 56 ? bscClient : client}>
        <AppWrapper>
          {Video}
          <HeaderWrapper>
            <Header />
    
          </HeaderWrapper>
          <TopTokenMovers />


          {/* <div style={{position:'absolute', top:'25%', left:'5%'}}>
              <img style={{maxWidth:200}} src={'https://kibainu.space/wp-content/uploads/2021/11/photo_2021-11-07-22.25.47.jpeg'} />
          </div>
          <div style={{position:'absolute', top:'25%', right:'5%'}}>
              <img style={{maxWidth:200}} src={'https://kibainu.space/wp-content/uploads/2021/11/photo_2021-11-07-22.25.47.jpeg'} />
          </div> */}
          <BodyWrapper>
            <Popups />
            <Polling />
            <TopLevelModals />
            <Switch>
              <Route exact strict path="/reflections" component={LifetimeReflections} />
              <Route exact strict path="/details" component={AccountPage} />
              <Route exact strict path="/details/:account" component={AccountPageWithAccount} />
              <Route exact strict path="/limit" component={LimitOrders} />
              <Route exact strict path="/selective-charts/:tokenAddress/:tokenSymbol" component={SelectiveChart}/>

              <Route exact strict path="/selective-charts/:tokenAddress" component={SelectiveChart}/>
              <Route exact strict path="/selective-charts" component={SelectiveChart}/>
              <Route exact strict path="/fomo" component={FomoPage} />
              <Route exact strict path="/donation-tracker" component={DonationTracker} />
              <Route exact strict path="/proposal/create" component={AddProposal} />
              <Route exact strict path="/proposal/details/:id" component={ProposalDetails} />
              <Route exact strict path="/tracker" component={GainsTracker} />
              <Route exact strict path="/suite" component={Suite} />
              <Route exact strict path="/transactions" component={Transactions} />
              <Route exact strict path="/gains" component={GainsPage} />
              <Route exact strict path="/honeypot-checker" component={HoneyPotDetector} />
              <Route exact strict path="/gains/:governorIndex/:id" component={VotePage} />
              <Route exact strict path="/vote" component={Vote} />
              <Route exact strict path="/vote/:id" component={VotePageV2} />
              <Route exact strict path="/send" component={RedirectPathToSwapOnly} />
              <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
              <Route exact strict path="/swap" component={Swap} />
              <Route exact strict path="/pool/v2/find" component={PoolFinder} />
              <Route exact strict path="/pool/v2" component={PoolV2} />
              <Route exact strict path="/pool" component={Pool} />
              <Route exact strict path="/pool/:tokenId" component={PositionPage} />
              <Route exact strict path="/add/v2/:currencyIdA?/:currencyIdB?" component={RedirectDuplicateTokenIdsV2} />
              <Route
                exact
                strict
                path="/add/:currencyIdA?/:currencyIdB?/:feeAmount?"
                component={RedirectDuplicateTokenIds}
              />

              <Route
                exact
                strict
                path="/increase/:currencyIdA?/:currencyIdB?/:feeAmount?/:tokenId?"
                component={AddLiquidity}
              />

              <Route exact strict path="/remove/v2/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />
              <Route exact strict path="/remove/:tokenId" component={RemoveLiquidityV3} />

              <Route exact strict path="/migrate/v2" component={MigrateV2} />
              <Route exact strict path="/migrate/v2/:address" component={MigrateV2Pair} />

              <Route exact strict path="/proposals" component={CreateProposal} />
              <Route exact strict path="/charts" component={ChartPage} />

              <Route component={RedirectPathToSwapOnly} />
            </Switch>
            <AppBody style={{ top:0, right: 0, position: 'relative', bottom: 0, padding: '9px 14px', justifyContent: 'end', backgroundColor: 'theme.bg0' , height: 'flex', width: 'flex', minWidth: '45%' }}>
        <StyledDiv style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '10px', paddingTop: '10px' }}>Kibaswap Featured Sponsors
        </StyledDiv>
        <Marquee direction={'ltr'} resetAfterTries={200} scatterRandomly={false} onInit={() => { return }} onFinish={() => { return }} key={"MARQUEE"} velocity={10}>
          <></>
          <FixedContainer style={{ backgroundColor: 'transparent', width: '100%', paddingBottom: '10px' }} gap="xs">
            <ScrollableRow>
              {[
                {
                  title: "Kiba Inu",
                  img: logo,
                  text: "Kiba Inu is a token infused with Kiba Swap",
                  link: '#',
                  style: {}
                },
                {
                  title: "CryptoCart",
                  img: cart,
                  text: "Learn more",
                  link: 'https://cryptocart.cc/',
                  style: {}
                },
                {
                  title: "KIBA INU",
                  img: logo,
                  text: "Learn more",
                  link: '#', 
                  style: {}
                },
                {
                  title: "Btok",
                  img: btok,
                  text: "Jabba Inu is a meme coin offering culture to its holders.",
                  link: 'https://www.btok.com/',
                  style: {}
                }].map((sponsor) => (
                  <CardWrapper key={sponsor.title} href={sponsor.link}>
                    <DarkGreyCard style={{  padding: 3 }}>
                      <Flex flexDirection="column" alignItems={'center'} justifyContent={'center'}>
                        <Flex alignItems={'center'} flexDirection={'row'}>
                          
                        </Flex>
                        <Flex style={{ height: 'flex', padding: '5'}} alignItems={'center'} justifyContent={'space-between'}>
                            <a href={sponsor.link}>
                            <img style={{ maxWidth: 80, ...sponsor?.style }} src={sponsor.img} />
                            </a>
                            <TYPE.small alignItems={'center'} justifyContent={'center'}></TYPE.small>
                          </Flex>
                      </Flex>
                    </DarkGreyCard>
                  </CardWrapper>
                ))}
            </ScrollableRow>
          </FixedContainer>
        </Marquee>
      </AppBody>
            <Marginer />
        

          </BodyWrapper>
       
        </AppWrapper>
        </ApolloProvider>
    </GelatoProvider>

      </Web3ReactManager>
        
    </ErrorBoundary>
  )
}