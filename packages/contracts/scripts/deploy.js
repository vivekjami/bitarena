const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment to", hre.network.name);
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Get treasury address from environment or use deployer
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log("Treasury address:", treasuryAddress);

  // 1. Deploy MUSD Token
  console.log("\n1. Deploying MUSD Token...");
  const MUSDToken = await hre.ethers.getContractFactory("MUSDToken");
  const initialSupply = hre.ethers.parseUnits("1000000", 18); // 1 million MUSD
  const musdToken = await MUSDToken.deploy(initialSupply);
  await musdToken.waitForDeployment();
  const musdAddress = await musdToken.getAddress();
  console.log("MUSD Token deployed to:", musdAddress);

  // 2. Deploy MatchEscrow
  console.log("\n2. Deploying MatchEscrow...");
  const MatchEscrow = await hre.ethers.getContractFactory("MatchEscrow");
  const matchEscrow = await MatchEscrow.deploy(musdAddress, treasuryAddress);
  await matchEscrow.waitForDeployment();
  const matchEscrowAddress = await matchEscrow.getAddress();
  console.log("MatchEscrow deployed to:", matchEscrowAddress);

  // 3. Deploy TournamentPool
  console.log("\n3. Deploying TournamentPool...");
  const TournamentPool = await hre.ethers.getContractFactory("TournamentPool");
  const tournamentPool = await TournamentPool.deploy(
    musdAddress,
    treasuryAddress,
    matchEscrowAddress
  );
  await tournamentPool.waitForDeployment();
  const tournamentPoolAddress = await tournamentPool.getAddress();
  console.log("TournamentPool deployed to:", tournamentPoolAddress);

  // 4. Grant oracle role (if oracle address is different)
  const oracleAddress = process.env.ORACLE_ADDRESS || deployer.address;
  if (oracleAddress !== deployer.address) {
    console.log("\n4. Granting ORACLE_ROLE to:", oracleAddress);
    const ORACLE_ROLE = await matchEscrow.ORACLE_ROLE();
    await matchEscrow.grantRole(ORACLE_ROLE, oracleAddress);
    console.log("ORACLE_ROLE granted");
  }

  // 5. Save deployment addresses
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    treasury: treasuryAddress,
    contracts: {
      MUSDToken: musdAddress,
      MatchEscrow: matchEscrowAddress,
      TournamentPool: tournamentPoolAddress,
    },
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${hre.network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n5. Deployment info saved to:", filepath);

  // Also save to a "latest" file for easy access
  const latestFile = path.join(deploymentsDir, `${hre.network.name}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("Latest deployment info saved to:", latestFile);

  // 6. Print summary
  console.log("\n========================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("========================================");
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("Treasury:", treasuryAddress);
  console.log("\nContract Addresses:");
  console.log("MUSD Token:", musdAddress);
  console.log("MatchEscrow:", matchEscrowAddress);
  console.log("TournamentPool:", tournamentPoolAddress);
  console.log("========================================\n");

  // 7. Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("To verify contracts on block explorer, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${musdAddress} "${initialSupply}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${matchEscrowAddress} "${musdAddress}" "${treasuryAddress}"`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${tournamentPoolAddress} "${musdAddress}" "${treasuryAddress}" "${matchEscrowAddress}"`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
