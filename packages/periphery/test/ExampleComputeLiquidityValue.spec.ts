import { AddressZero, MaxUint256 } from 'ethers/constants'
import chai, { expect } from 'chai'
import { Contract } from 'ethers'
import { solidity, MockProvider, createFixtureLoader, deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './shared/utilities'
import { v2Fixture } from './shared/fixtures'

import ExampleComputeLiquidityValue from '../build/ExampleComputeLiquidityValue.json'

chai.use(solidity)

const overrides = {
  gasLimit: 9999999
}

describe('ExampleComputeLiquidityValue', () => {
  const provider = new MockProvider({
    hardfork: 'istanbul',
    mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
    gasLimit: 9999999
  })
  const [wallet] = provider.getWallets()
  const loadFixture = createFixtureLoader(provider, [wallet])

  let token0: Contract
  let token1: Contract
  let factory: Contract
  let pair: Contract
  let computeLiquidityValue: Contract
  let router: Contract
  beforeEach(async function() {
    const fixture = await loadFixture(v2Fixture)
    token0 = fixture.token0
    token1 = fixture.token1
    pair = fixture.pair
    factory = fixture.factoryV2
    router = fixture.router
    computeLiquidityValue = await deployContract(
      wallet,
      ExampleComputeLiquidityValue,
      [fixture.factoryV2.address],
      overrides
    )
  })

  beforeEach('mint some liquidity for the pair at 1:100 (100 shares minted)', async () => {
    await token0.transfer(pair.address, expandTo18Decimals(10))
    await token1.transfer(pair.address, expandTo18Decimals(1000))
    await pair.mint(wallet.address, overrides)
    expect(await pair.totalSupply()).to.eq(expandTo18Decimals(100))
  })

  it('correct factory address', async () => {
    expect(await computeLiquidityValue.factory()).to.eq(factory.address)
  })

  describe('#getLiquidityValue', () => {
    it('correct for 5 shares', async () => {
      const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValue(
        token0.address,
        token1.address,
        expandTo18Decimals(5)
      )
      expect(token0Amount).to.eq('500000000000000000')
      expect(token1Amount).to.eq('50000000000000000000')
    })
    it('correct for 7 shares', async () => {
      const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValue(
        token0.address,
        token1.address,
        expandTo18Decimals(7)
      )
      expect(token0Amount).to.eq('700000000000000000')
      expect(token1Amount).to.eq('70000000000000000000')
    })

    it('correct after swap', async () => {
      await token0.approve(router.address, MaxUint256, overrides)
      await router.swapExactTokensForTokens(
        expandTo18Decimals(10),
        0,
        [token0.address, token1.address],
        wallet.address,
        MaxUint256,
        overrides
      )
      const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValue(
        token0.address,
        token1.address,
        expandTo18Decimals(7)
      )
      expect(token0Amount).to.eq('1400000000000000000')
      expect(token1Amount).to.eq('35052578868302453680')
    })

    describe('fee on', () => {
      beforeEach('turn on fee', async () => {
        await factory.setFeeTo(wallet.address)
      })

      // this is necessary to cause kLast to be set
      beforeEach('mint more liquidity to address zero', async () => {
        await token0.transfer(pair.address, expandTo18Decimals(10))
        await token1.transfer(pair.address, expandTo18Decimals(1000))
        await pair.mint(AddressZero, overrides)
        expect(await pair.totalSupply()).to.eq(expandTo18Decimals(200))
      })

      it('correct after swap', async () => {
        await token0.approve(router.address, MaxUint256, overrides)
        await router.swapExactTokensForTokens(
          expandTo18Decimals(20),
          0,
          [token0.address, token1.address],
          wallet.address,
          MaxUint256,
          overrides
        )
        const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValue(
          token0.address,
          token1.address,
          expandTo18Decimals(7)
        )
        expect(token0Amount).to.eq('1399824934325735058')
        expect(token1Amount).to.eq('35048195651620807684')
      })
    })
  })

  describe('#getReservesAfterArbitrage', () => {
    it('1/400', async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        token0.address,
        token1.address,
        1,
        400
      )
      expect(reserveA).to.eq('5007516917298542016')
      expect(reserveB).to.eq('1999997739838173075192')
    })
    it('1/200', async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        token0.address,
        token1.address,
        1,
        200
      )
      expect(reserveA).to.eq('7081698338256310291')
      expect(reserveB).to.eq('1413330640570018326894')
    })
    it('1/100 (same price)', async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        token0.address,
        token1.address,
        1,
        100
      )
      expect(reserveA).to.eq('10000000000000000000')
      expect(reserveB).to.eq('1000000000000000000000')
    })
    it('1/50', async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        token0.address,
        token1.address,
        1,
        50
      )
      expect(reserveA).to.eq('14133306405700183269')
      expect(reserveB).to.eq('708169833825631029041')
    })
    it('1/25', async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        token0.address,
        token1.address,
        1,
        25
      )
      expect(reserveA).to.eq('19999977398381730752')
      expect(reserveB).to.eq('500751691729854201595')
    })
    it('25/1', async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        token0.address,
        token1.address,
        25,
        1
      )
      expect(reserveA).to.eq('500721601459041764285')
      expect(reserveB).to.eq('20030067669194168064')
    })
    it('works with large numbers for the price', async () => {
      const [reserveA, reserveB] = await computeLiquidityValue.getReservesAfterArbitrage(
        token0.address,
        token1.address,
        MaxUint256.div(1000),
        MaxUint256.div(1000)
      )
      // diff of 30 bips
      expect(reserveA).to.eq('100120248075158403008')
      expect(reserveB).to.eq('100150338345970840319')
    })
  })

  describe('#getLiquidityValue', () => {
    describe('fee is off', () => {
      it('produces the correct value after arbing to 1:105', async () => {
        const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
          token0.address,
          token1.address,
          1,
          105,
          expandTo18Decimals(5)
        )
        expect(token0Amount).to.eq('488683612488266114') // slightly less than 5% of 10, or 0.5
        expect(token1Amount).to.eq('51161327957205755422') // slightly more than 5% of 100, or 5
      })

      it('produces the correct value after arbing to 1:95', async () => {
        const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
          token0.address,
          token1.address,
          1,
          95,
          expandTo18Decimals(5)
        )
        expect(token0Amount).to.eq('512255881944227034') // slightly more than 5% of 10, or 0.5
        expect(token1Amount).to.eq('48807237571060645526') // slightly less than 5% of 100, or 5
      })

      it('produces correct value at the current price', async () => {
        const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
          token0.address,
          token1.address,
          1,
          100,
          expandTo18Decimals(5)
        )
        expect(token0Amount).to.eq('500000000000000000')
        expect(token1Amount).to.eq('50000000000000000000')
      })

      it('gas current price', async () => {
        expect(
          await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            100,
            expandTo18Decimals(5)
          )
        ).to.eq('12705')
      })

      it('gas higher price', async () => {
        expect(
          await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            105,
            expandTo18Decimals(5)
          )
        ).to.eq('13478')
      })

      it('gas lower price', async () => {
        expect(
          await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            95,
            expandTo18Decimals(5)
          )
        ).to.eq('13523')
      })

      describe('after a swap', () => {
        beforeEach('swap to ~1:25', async () => {
          await token0.approve(router.address, MaxUint256, overrides)
          await router.swapExactTokensForTokens(
            expandTo18Decimals(10),
            0,
            [token0.address, token1.address],
            wallet.address,
            MaxUint256,
            overrides
          )
          const [reserve0, reserve1] = await pair.getReserves()
          expect(reserve0).to.eq('20000000000000000000')
          expect(reserve1).to.eq('500751126690035052579') // half plus the fee
        })

        it('is roughly 1/25th liquidity', async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            25,
            expandTo18Decimals(5)
          )

          expect(token0Amount).to.eq('1000000000000000000')
          expect(token1Amount).to.eq('25037556334501752628')
        })

        it('shares after arbing back to 1:100', async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            100,
            expandTo18Decimals(5)
          )

          expect(token0Amount).to.eq('501127678536722155')
          expect(token1Amount).to.eq('50037429168613534246')
        })
      })
    })

    describe('fee is on', () => {
      beforeEach('turn on fee', async () => {
        await factory.setFeeTo(wallet.address)
      })

      // this is necessary to cause kLast to be set
      beforeEach('mint more liquidity to address zero', async () => {
        await token0.transfer(pair.address, expandTo18Decimals(10))
        await token1.transfer(pair.address, expandTo18Decimals(1000))
        await pair.mint(AddressZero, overrides)
        expect(await pair.totalSupply()).to.eq(expandTo18Decimals(200))
      })

      describe('no fee to be collected', () => {
        it('produces the correct value after arbing to 1:105', async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            105,
            expandTo18Decimals(5)
          )
          expect(token0Amount).to.eq('488680839243189328') // slightly less than 5% of 10, or 0.5
          expect(token1Amount).to.eq('51161037620273529068') // slightly more than 5% of 100, or 5
        })

        it('produces the correct value after arbing to 1:95', async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            95,
            expandTo18Decimals(5)
          )
          expect(token0Amount).to.eq('512252817918759166') // slightly more than 5% of 10, or 0.5
          expect(token1Amount).to.eq('48806945633721895174') // slightly less than 5% of 100, or 5
        })

        it('produces correct value at the current price', async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            100,
            expandTo18Decimals(5)
          )
          expect(token0Amount).to.eq('500000000000000000')
          expect(token1Amount).to.eq('50000000000000000000')
        })
      })

      it('gas current price', async () => {
        expect(
          await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            100,
            expandTo18Decimals(5)
          )
        ).to.eq('16938')
      })

      it('gas higher price', async () => {
        expect(
          await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            105,
            expandTo18Decimals(5)
          )
        ).to.eq('18475')
      })

      it('gas lower price', async () => {
        expect(
          await computeLiquidityValue.getGasCostOfGetLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            95,
            expandTo18Decimals(5)
          )
        ).to.eq('18406')
      })

      describe('after a swap', () => {
        beforeEach('swap to ~1:25', async () => {
          await token0.approve(router.address, MaxUint256, overrides)
          await router.swapExactTokensForTokens(
            expandTo18Decimals(20),
            0,
            [token0.address, token1.address],
            wallet.address,
            MaxUint256,
            overrides
          )
          const [reserve0, reserve1] = await pair.getReserves()
          expect(reserve0).to.eq('40000000000000000000')
          expect(reserve1).to.eq('1001502253380070105158') // half plus the fee
        })

        it('is roughly 1:25', async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            25,
            expandTo18Decimals(5)
          )

          expect(token0Amount).to.eq('999874953089810756')
          expect(token1Amount).to.eq('25034425465443434060')
        })

        it('shares after arbing back to 1:100', async () => {
          const [token0Amount, token1Amount] = await computeLiquidityValue.getLiquidityValueAfterArbitrageToPrice(
            token0.address,
            token1.address,
            1,
            100,
            expandTo18Decimals(5)
          )

          expect(token0Amount).to.eq('501002443792372662')
          expect(token1Amount).to.eq('50024924521757597314')
        })
      })
    })
  })
})
