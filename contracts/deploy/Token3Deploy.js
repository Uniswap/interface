module.exports = async function ({ ethers, getNamedAccounts, deployments }) {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const initialSupply = ethers.utils.parseUnits('1',18)

  const name = 'Token3'
  const symbol = 'TKN'

  token = await deploy("Token3", {
    from: deployer,
    log: true,
    args:[name, symbol, initialSupply],
    skipIfAlreadyDeployed: true,
  });

  console.log("Token address:", token.address);
};

module.exports.tags = ["Token3"];
