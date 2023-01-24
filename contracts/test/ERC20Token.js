const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Token", function () {
  const initialSupply = ethers.utils.parseUnits("1000000");
  beforeEach(async function () {
    [this.deployer, this.account1, this.account2] = await ethers.getSigners();
    this.contract = await ethers.getContractFactory("ERC20Token");
    this.token = await this.contract.deploy("TOKEN1", "TKN", initialSupply);
  });

  it("has a name", async function () {
    expect(await this.token.name()).to.equal("TOKEN1");
  });

  it("has a symbol", async function () {
    expect(await this.token.symbol()).to.equal("TKN");
  });

  it("has 18 decimals", async function () {
    expect(await this.token.decimals()).to.equal(18);
  });

  it("returns the total amount of tokens", async function () {
    expect(await this.token.totalSupply()).to.equal(initialSupply);
  });

  it("returns the balance of deployer", async function () {
    expect(await this.token.balanceOf(this.deployer.address)).to.equal(initialSupply);
  });
});
