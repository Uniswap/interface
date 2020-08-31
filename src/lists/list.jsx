import mainnet from "./mainnet/list.json";
import testnet from "./testnet/list.json";
require("dotenv").config();

const network = process.env.REACT_APP_NETWORK || 'testnet';

const lists = {
  mainnet,
  testnet
};

export default lists[network];
