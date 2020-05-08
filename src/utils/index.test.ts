import { getEtherscanLink } from './index'

describe('utils',() => {
  describe('index' , () =>{
    it('works', () => {
      expect(getEtherscanLink(1, 'abc', 'transaction')).toEqual('https://etherscan.io/tx/abc');
    })
  })
})