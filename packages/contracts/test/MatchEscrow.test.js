const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("MatchEscrow", function () {
  let musdToken;
  let matchEscrow;
  let owner;
  let treasury;
  let oracle;
  let player1;
  let player2;
  let player3;
  const stakeAmount = ethers.parseUnits("10", 18);

  beforeEach(async function () {
    [owner, treasury, oracle, player1, player2, player3] = await ethers.getSigners();
    
    // Deploy MUSD Token
    const MUSDToken = await ethers.getContractFactory("MUSDToken");
    musdToken = await MUSDToken.deploy(ethers.parseUnits("1000000", 18));
    await musdToken.waitForDeployment();
    
    // Deploy MatchEscrow
    const MatchEscrow = await ethers.getContractFactory("MatchEscrow");
    matchEscrow = await MatchEscrow.deploy(await musdToken.getAddress(), treasury.address);
    await matchEscrow.waitForDeployment();
    
    // Grant oracle role
    const ORACLE_ROLE = await matchEscrow.ORACLE_ROLE();
    await matchEscrow.grantRole(ORACLE_ROLE, oracle.address);
    
    // Mint tokens to players
    await musdToken.mint(player1.address, ethers.parseUnits("1000", 18));
    await musdToken.mint(player2.address, ethers.parseUnits("1000", 18));
    await musdToken.mint(player3.address, ethers.parseUnits("1000", 18));
    
    // Approve contract to spend tokens
    await musdToken.connect(player1).approve(await matchEscrow.getAddress(), ethers.parseUnits("1000", 18));
    await musdToken.connect(player2).approve(await matchEscrow.getAddress(), ethers.parseUnits("1000", 18));
    await musdToken.connect(player3).approve(await matchEscrow.getAddress(), ethers.parseUnits("1000", 18));
  });

  describe("Deployment", function () {
    it("Should set the correct MUSD token address", async function () {
      expect(await matchEscrow.musdToken()).to.equal(await musdToken.getAddress());
    });

    it("Should set the correct treasury address", async function () {
      expect(await matchEscrow.treasury()).to.equal(treasury.address);
    });

    it("Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await matchEscrow.DEFAULT_ADMIN_ROLE();
      expect(await matchEscrow.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("Should grant ORACLE_ROLE to oracle", async function () {
      const ORACLE_ROLE = await matchEscrow.ORACLE_ROLE();
      expect(await matchEscrow.hasRole(ORACLE_ROLE, oracle.address)).to.be.true;
    });
  });

  describe("Create Match", function () {
    it("Should create a match successfully", async function () {
      const tx = await matchEscrow.connect(player1).createMatch(0, stakeAmount, 2);
      await expect(tx).to.emit(matchEscrow, "MatchCreated").withArgs(1, player1.address, 0, stakeAmount, 2);
      
      const match = await matchEscrow.getMatch(1);
      expect(match.id).to.equal(1);
      expect(match.stakeAmount).to.equal(stakeAmount);
      expect(match.maxPlayers).to.equal(2);
      expect(match.status).to.equal(0); // Pending
    });

    it("Should increment match counter", async function () {
      await matchEscrow.connect(player1).createMatch(0, stakeAmount, 2);
      expect(await matchEscrow.matchCounter()).to.equal(1);
      
      await matchEscrow.connect(player2).createMatch(1, stakeAmount, 4);
      expect(await matchEscrow.matchCounter()).to.equal(2);
    });

    it("Should fail with zero stake amount", async function () {
      await expect(
        matchEscrow.connect(player1).createMatch(0, 0, 2)
      ).to.be.revertedWith("Stake must be positive");
    });

    it("Should fail with invalid max players", async function () {
      await expect(
        matchEscrow.connect(player1).createMatch(0, stakeAmount, 1)
      ).to.be.revertedWith("Invalid max players");
      
      await expect(
        matchEscrow.connect(player1).createMatch(0, stakeAmount, 11)
      ).to.be.revertedWith("Invalid max players");
    });

    it("Should transfer stake from creator", async function () {
      const balanceBefore = await musdToken.balanceOf(player1.address);
      await matchEscrow.connect(player1).createMatch(0, stakeAmount, 2);
      const balanceAfter = await musdToken.balanceOf(player1.address);
      
      expect(balanceBefore - balanceAfter).to.equal(stakeAmount);
    });
  });

  describe("Join Match", function () {
    beforeEach(async function () {
      await matchEscrow.connect(player1).createMatch(0, stakeAmount, 2);
    });

    it("Should allow player to join match", async function () {
      await expect(matchEscrow.connect(player2).joinMatch(1))
        .to.emit(matchEscrow, "PlayerJoined")
        .withArgs(1, player2.address);
    });

    it("Should transfer stake from joining player", async function () {
      const balanceBefore = await musdToken.balanceOf(player2.address);
      await matchEscrow.connect(player2).joinMatch(1);
      const balanceAfter = await musdToken.balanceOf(player2.address);
      
      expect(balanceBefore - balanceAfter).to.equal(stakeAmount);
    });

    it("Should auto-start match when full", async function () {
      await expect(matchEscrow.connect(player2).joinMatch(1))
        .to.emit(matchEscrow, "MatchStarted");
      
      const match = await matchEscrow.getMatch(1);
      expect(match.status).to.equal(1); // Active
    });

    it("Should fail if match doesn't exist", async function () {
      await expect(
        matchEscrow.connect(player2).joinMatch(999)
      ).to.be.revertedWith("Match does not exist");
    });

    it("Should fail if player already joined", async function () {
      await expect(
        matchEscrow.connect(player1).joinMatch(1)
      ).to.be.revertedWith("Already joined");
    });

    it("Should fail if match is full", async function () {
      await matchEscrow.connect(player2).joinMatch(1);
      await expect(
        matchEscrow.connect(player3).joinMatch(1)
      ).to.be.revertedWith("Match not accepting players");
    });
  });

  describe("Submit Result", function () {
    beforeEach(async function () {
      await matchEscrow.connect(player1).createMatch(0, stakeAmount, 2);
      await matchEscrow.connect(player2).joinMatch(1);
    });

    it("Should allow oracle to submit result", async function () {
      const gameDataHash = ethers.keccak256(ethers.toUtf8Bytes("game-data"));
      await expect(matchEscrow.connect(oracle).submitResult(1, player1.address, gameDataHash))
        .to.emit(matchEscrow, "MatchCompleted")
        .withArgs(1, player1.address, gameDataHash);
      
      const match = await matchEscrow.getMatch(1);
      expect(match.winner).to.equal(player1.address);
      expect(match.status).to.equal(2); // Completed
    });

    it("Should fail if caller is not oracle", async function () {
      const gameDataHash = ethers.keccak256(ethers.toUtf8Bytes("game-data"));
      await expect(
        matchEscrow.connect(player1).submitResult(1, player1.address, gameDataHash)
      ).to.be.reverted;
    });

    it("Should fail if winner not in match", async function () {
      const gameDataHash = ethers.keccak256(ethers.toUtf8Bytes("game-data"));
      await expect(
        matchEscrow.connect(oracle).submitResult(1, player3.address, gameDataHash)
      ).to.be.revertedWith("Winner not in match");
    });

    it("Should fail if match not active", async function () {
      const gameDataHash = ethers.keccak256(ethers.toUtf8Bytes("game-data"));
      await matchEscrow.connect(oracle).submitResult(1, player1.address, gameDataHash);
      
      await expect(
        matchEscrow.connect(oracle).submitResult(1, player2.address, gameDataHash)
      ).to.be.revertedWith("Match not active");
    });
  });

  describe("Claim Winnings", function () {
    beforeEach(async function () {
      await matchEscrow.connect(player1).createMatch(0, stakeAmount, 2);
      await matchEscrow.connect(player2).joinMatch(1);
      
      const gameDataHash = ethers.keccak256(ethers.toUtf8Bytes("game-data"));
      await matchEscrow.connect(oracle).submitResult(1, player1.address, gameDataHash);
    });

    it("Should allow winner to claim winnings", async function () {
      const balanceBefore = await musdToken.balanceOf(player1.address);
      const treasuryBalanceBefore = await musdToken.balanceOf(treasury.address);
      
      await matchEscrow.connect(player1).claimWinnings(1);
      
      const balanceAfter = await musdToken.balanceOf(player1.address);
      const treasuryBalanceAfter = await musdToken.balanceOf(treasury.address);
      
      const totalPot = stakeAmount * 2n;
      const platformFee = (totalPot * 250n) / 10000n;
      const winnerPrize = totalPot - platformFee;
      
      expect(balanceAfter - balanceBefore).to.equal(winnerPrize);
      expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(platformFee);
    });

    it("Should emit WinningsClaimed event", async function () {
      const totalPot = stakeAmount * 2n;
      const platformFee = (totalPot * 250n) / 10000n;
      const winnerPrize = totalPot - platformFee;
      
      await expect(matchEscrow.connect(player1).claimWinnings(1))
        .to.emit(matchEscrow, "WinningsClaimed")
        .withArgs(1, player1.address, winnerPrize, platformFee);
    });

    it("Should fail if match not completed", async function () {
      await matchEscrow.connect(player1).createMatch(0, stakeAmount, 2);
      await expect(
        matchEscrow.connect(player1).claimWinnings(2)
      ).to.be.revertedWith("Match not completed");
    });

    it("Should fail if caller is not winner", async function () {
      await expect(
        matchEscrow.connect(player2).claimWinnings(1)
      ).to.be.revertedWith("Not the winner");
    });

    it("Should fail if already claimed", async function () {
      await matchEscrow.connect(player1).claimWinnings(1);
      await expect(
        matchEscrow.connect(player1).claimWinnings(1)
      ).to.be.revertedWith("Already claimed");
    });
  });

  describe("Dispute Match", function () {
    beforeEach(async function () {
      await matchEscrow.connect(player1).createMatch(0, stakeAmount, 2);
      await matchEscrow.connect(player2).joinMatch(1);
    });

    it("Should allow dispute after timeout", async function () {
      await time.increase(11 * 60); // 11 minutes
      
      await expect(matchEscrow.connect(player1).disputeMatch(1))
        .to.emit(matchEscrow, "MatchDisputed")
        .withArgs(1);
      
      const match = await matchEscrow.getMatch(1);
      expect(match.status).to.equal(3); // Disputed
    });

    it("Should refund all players on dispute", async function () {
      const player1BalanceBefore = await musdToken.balanceOf(player1.address);
      const player2BalanceBefore = await musdToken.balanceOf(player2.address);
      
      await time.increase(11 * 60);
      await matchEscrow.connect(player1).disputeMatch(1);
      
      const player1BalanceAfter = await musdToken.balanceOf(player1.address);
      const player2BalanceAfter = await musdToken.balanceOf(player2.address);
      
      expect(player1BalanceAfter - player1BalanceBefore).to.equal(stakeAmount);
      expect(player2BalanceAfter - player2BalanceBefore).to.equal(stakeAmount);
    });

    it("Should fail if timeout not reached", async function () {
      await expect(
        matchEscrow.connect(player1).disputeMatch(1)
      ).to.be.revertedWith("Timeout not reached");
    });

    it("Should fail if caller not a player", async function () {
      await time.increase(11 * 60);
      await expect(
        matchEscrow.connect(player3).disputeMatch(1)
      ).to.be.revertedWith("Not a player");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow admin to pause", async function () {
      await matchEscrow.pause();
      expect(await matchEscrow.paused()).to.be.true;
    });

    it("Should prevent creating matches when paused", async function () {
      await matchEscrow.pause();
      await expect(
        matchEscrow.connect(player1).createMatch(0, stakeAmount, 2)
      ).to.be.reverted;
    });

    it("Should allow admin to unpause", async function () {
      await matchEscrow.pause();
      await matchEscrow.unpause();
      expect(await matchEscrow.paused()).to.be.false;
    });
  });
});
