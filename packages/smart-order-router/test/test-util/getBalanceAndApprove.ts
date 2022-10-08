import { JsonRpcSigner } from '@ethersproject/providers';
import { Currency, CurrencyAmount } from '@uniswap/sdk-core';
import { constants } from 'ethers';
import { Erc20 } from '../../src/types/other/Erc20';
import { Erc20__factory } from '../../src/types/other/factories/Erc20__factory';

export const getBalance = async (
  alice: JsonRpcSigner,
  currency: Currency
): Promise<CurrencyAmount<Currency>> => {
  if (!currency.isToken) {
    return CurrencyAmount.fromRawAmount(
      currency,
      (await alice.getBalance()).toString()
    );
  }

  const aliceTokenIn: Erc20 = Erc20__factory.connect(currency.address, alice);

  return CurrencyAmount.fromRawAmount(
    currency,
    (await aliceTokenIn.balanceOf(alice._address)).toString()
  );
};

export const getBalanceAndApprove = async (
  alice: JsonRpcSigner,
  approveTarget: string,
  currency: Currency
): Promise<CurrencyAmount<Currency>> => {
  if (currency.isToken) {
    const aliceTokenIn: Erc20 = Erc20__factory.connect(currency.address, alice);

    if (currency.symbol == 'USDT') {
      await (await aliceTokenIn.approve(approveTarget, 0)).wait();
    }
    await (
      await aliceTokenIn.approve(approveTarget, constants.MaxUint256)
    ).wait();
  }

  return getBalance(alice, currency);
};
