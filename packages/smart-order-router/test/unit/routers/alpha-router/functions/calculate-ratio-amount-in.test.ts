import { Fraction, Token } from '@uniswap/sdk-core';
import { parseAmount } from '../../../../../src';
import { calculateRatioAmountIn } from '../../../../../src/routers/alpha-router/functions/calculate-ratio-amount-in';

const ADDRESS_ZERO = `0x${'0'.repeat(40)}`;
const ADDRESS_ONE = `0x${'0'.repeat(39)}1`;

describe('calculate ratio amount in', () => {
  let inputToken: Token;
  let outputToken: Token;

  beforeEach(() => {
    inputToken = new Token(1, ADDRESS_ZERO, 18, 'TEST1', 'Test Token 1');
    outputToken = new Token(1, ADDRESS_ONE, 18, 'TEST2', 'Test Token 2');
  });

  it('returns correct amountIn with simple inputs', () => {
    const optimalRatio = new Fraction(1, 1);
    const price = new Fraction(2, 1);
    const inputTokenAmount = parseAmount('20', inputToken);
    const outputTokenAmount = parseAmount('5', outputToken);

    const amountIn = calculateRatioAmountIn(
      optimalRatio,
      price,
      inputTokenAmount,
      outputTokenAmount
    );

    expect(amountIn.quotient.toString()).toEqual('5000000000000000000');
    expect(amountIn.currency).toEqual(inputTokenAmount.currency);
  });

  it('returns correct amountIn when inputToken has more decimal places', () => {
    const optimalRatio = new Fraction(1, 2);
    const price = new Fraction(1, 2);
    const outputTokenSixDecimals = new Token(
      1,
      ADDRESS_ZERO,
      6,
      'TEST1',
      'Test Token 1'
    );
    const inputTokenAmount = parseAmount('20', inputToken);
    const outputTokenAmount = parseAmount(
      '5000000000000',
      outputTokenSixDecimals
    );

    const amountIn = calculateRatioAmountIn(
      optimalRatio,
      price,
      inputTokenAmount,
      outputTokenAmount
    );

    expect(amountIn.quotient.toString()).toEqual('14000000000000000000');
    expect(amountIn.currency).toEqual(inputTokenAmount.currency);
  });

  it('returns correct amountIn when outputToken has more decimal places', () => {
    const optimalRatio = new Fraction(1, 2);
    const price = new Fraction(2, 1);
    const inputTokenSixDecimals = new Token(
      1,
      ADDRESS_ZERO,
      6,
      'TEST1',
      'Test Token 1'
    );
    const inputTokenAmount = parseAmount(
      '20000000000000',
      inputTokenSixDecimals
    );
    const outputTokenAmount = parseAmount('5', outputToken);

    const amountIn = calculateRatioAmountIn(
      optimalRatio,
      price,
      inputTokenAmount,
      outputTokenAmount
    );

    expect(amountIn.quotient.toString()).toEqual('8750000000000000000');
    expect(amountIn.currency).toEqual(inputTokenAmount.currency);
  });

  it('returns correct amountIn with price greater than 1', () => {
    const optimalRatio = new Fraction(2, 1);
    const price = new Fraction(2, 1);
    const inputTokenAmount = parseAmount('20', inputToken);
    const outputTokenAmount = parseAmount('5', outputToken);

    const amountIn = calculateRatioAmountIn(
      optimalRatio,
      price,
      inputTokenAmount,
      outputTokenAmount
    );

    expect(amountIn.quotient.toString()).toEqual('2000000000000000000');
    expect(amountIn.currency).toEqual(inputTokenAmount.currency);
  });

  it('returns correct amountIn when price is less than 1', () => {
    const optimalRatio = new Fraction(1, 2);
    const price = new Fraction(1, 2);
    const inputTokenAmount = parseAmount('20', inputToken);
    const outputTokenAmount = parseAmount('5', outputToken);

    const amountIn = calculateRatioAmountIn(
      optimalRatio,
      price,
      inputTokenAmount,
      outputTokenAmount
    );

    expect(amountIn.quotient.toString()).toEqual('14000000000000000000');
    expect(amountIn.currency).toEqual(inputTokenAmount.currency);
  });

  it('throw an error if amountIn balance is insufficient for a swap to ratio', () => {
    const optimalRatio = new Fraction(1, 2);
    const price = new Fraction(1, 2);
    const inputTokenAmount = parseAmount('5', inputToken);
    const outputTokenAmount = parseAmount('20', outputToken);

    expect(() => {
      calculateRatioAmountIn(
        optimalRatio,
        price,
        inputTokenAmount,
        outputTokenAmount
      );
    }).toThrow('routeToRatio: insufficient input token amount');
  });
});
