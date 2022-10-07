// import { BaseProvider } from '@ethersproject/providers'
// import { mocked } from 'ts-jest/utils';
// import { UniswapMulticallProvider } from '../../../src/providers/multicall-uniswap-provider';
// import { IERC20Metadata__factory } from '../../../src/types/v3/factories/IERC20Metadata__factory';
// import { UniswapInterfaceMulticall__factory } from '../../../src/types/v3/factories/UniswapInterfaceMulticall__factory';
// import { UniswapInterfaceMulticall } from '../../../src/types/v3/UniswapInterfaceMulticall';

/* jest.mock('../../src/types/v3/UniswapInterfaceMulticall', () => {
  return {
    UniswapInterfaceMulticall: jest.fn().mockImplementation(() => {
      return {
        callStatic: {
          multicall: () => {
            return {
              blockNumber: BigNumber.from(10000),
              returnData: [
                {
                  success: true,
                  gasUsed: BigNumber.from(100),
                  returnData: '0x0',
                },
              ],
            } as any;
          },
        },
      };
    }),
  };
}); */

describe.skip('uniswap multicall provider', () => {
  test('placeholder', async () => {
    return;
  });

  /*
  let uniswapMulticallProvider: UniswapMulticallProvider;
  const erc20Interface = IERC20Metadata__factory.createInterface();

  let mockProvider: jest.Mocked<BaseProvider>;

  let multicallMock: jest.Mocked<UniswapInterfaceMulticall>;

  beforeAll(() => {
    multicallMock = createMockInstance(UniswapInterfaceMulticall);

    mocked(multicallMock.callStatic.multicall).mockResolvedValue({
      blockNumber: BigNumber.from(10000),
      returnData: [
        { success: true, gasUsed: BigNumber.from(100), returnData: '0x0' },
      ],
    } as any);

    mocked(UniswapInterfaceMulticall__factory.connect).mockReturnValue(
      UniswapInterfaceMulticall as any
    );

    mockProvider = createMockInstance(BaseProvider);
    uniswapMulticallProvider = new UniswapMulticallProvider(
      createMockInstance(BaseProvider)
    );
  });

  describe('callSameFunctionOnMultipleContracts', () => {
    test('succeeds', async () => {
      const result =
        await uniswapMulticallProvider.callSameFunctionOnMultipleContracts<
          undefined,
          [string]
        >({
          addresses: [
            '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
            '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9C',
          ],
          contractInterface: erc20Interface,
          functionName: 'decimals',
        });

      console.log({ result }, 'Result');
      expect(multicallMock).toHaveBeenCalledTimes(1);
      mockProvider;
    });
  });
  */
});
