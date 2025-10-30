const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TournamentPool", function () {
  let musdToken;
  let matchEscrow;
  let tournamentPool;
  let owner;
  let treasury;
  let player1;
  let player2;
  let player3;
  let player4;
  const entryFee = ethers.parseUnits("50", 18);

  beforeEach(async function () {
    [owner, treasury, player1, player2, player3, player4] = await ethers.getSigners();
    
    // Deploy MUSD Token
    const MUSDToken = await ethers.getContractFactory("MUSDToken");
    musdToken = await MUSDToken.deploy(ethers.parseUnits("1000000", 18));
    await musdToken.waitForDeployment();
    
    // Deploy MatchEscrow (required for TournamentPool)
    const MatchEscrow = await ethers.getContractFactory("MatchEscrow");
    matchEscrow = await MatchEscrow.deploy(await musdToken.getAddress(), treasury.address);
    await matchEscrow.waitForDeployment();
    
    // Deploy TournamentPool
    const TournamentPool = await ethers.getContractFactory("TournamentPool");
    tournamentPool = await TournamentPool.deploy(
      await musdToken.getAddress(),
      treasury.address,
      await matchEscrow.getAddress()
    );
    await tournamentPool.waitForDeployment();
    
    // Mint tokens to players
    await musdToken.mint(player1.address, ethers.parseUnits("1000", 18));
    await musdToken.mint(player2.address, ethers.parseUnits("1000", 18));
    await musdToken.mint(player3.address, ethers.parseUnits("1000", 18));
    await musdToken.mint(player4.address, ethers.parseUnits("1000", 18));
    
    // Approve contract to spend tokens
    await musdToken.connect(player1).approve(await tournamentPool.getAddress(), ethers.parseUnits("1000", 18));
    await musdToken.connect(player2).approve(await tournamentPool.getAddress(), ethers.parseUnits("1000", 18));
    await musdToken.connect(player3).approve(await tournamentPool.getAddress(), ethers.parseUnits("1000", 18));
    await musdToken.connect(player4).approve(await tournamentPool.getAddress(), ethers.parseUnits("1000", 18));
  });

  describe("Deployment", function () {
    it("Should set the correct MUSD token address", async function () {
      expect(await tournamentPool.musdToken()).to.equal(await musdToken.getAddress());
    });

    it("Should set the correct treasury address", async function () {
      expect(await tournamentPool.treasury()).to.equal(treasury.address);
    });

    it("Should set the correct match escrow address", async function () {
      expect(await tournamentPool.matchEscrow()).to.equal(await matchEscrow.getAddress());
    });
  });

  describe("Create Tournament", function () {
    it("Should create a tournament successfully", async function () {
      const prizeDistribution = [60, 30, 10]; // 60%, 30%, 10%
      
      await expect(tournamentPool.createTournament("Test Tournament", entryFee, 4, prizeDistribution))
        .to.emit(tournamentPool, "TournamentCreated")
        .withArgs(1, "Test Tournament", entryFee, 4);
      
      const tournament = await tournamentPool.getTournament(1);
      expect(tournament.name).to.equal("Test Tournament");
      expect(tournament.entryFee).to.equal(entryFee);
      expect(tournament.maxPlayers).to.equal(4);
      expect(tournament.status).to.equal(0); // Registration
    });

    it("Should fail with zero entry fee", async function () {
      await expect(
        tournamentPool.createTournament("Test", 0, 4, [60, 30, 10])
      ).to.be.revertedWith("Entry fee must be positive");
    });

    it("Should fail with non-power-of-2 max players", async function () {
      await expect(
        tournamentPool.createTournament("Test", entryFee, 3, [60, 30, 10])
      ).to.be.revertedWith("Max players must be power of 2 and >= 4");
    });

    it("Should fail with invalid prize distribution", async function () {
      await expect(
        tournamentPool.createTournament("Test", entryFee, 4, [50, 30, 10]) // Sum = 90
      ).to.be.revertedWith("Invalid prize distribution");
    });

    it("Should only allow admin to create tournaments", async function () {
      await expect(
        tournamentPool.connect(player1).createTournament("Test", entryFee, 4, [60, 30, 10])
      ).to.be.reverted;
    });
  });

  describe("Register Player", function () {
    beforeEach(async function () {
      await tournamentPool.createTournament("Test Tournament", entryFee, 4, [60, 30, 10]);
    });

    it("Should allow player to register", async function () {
      await expect(tournamentPool.connect(player1).registerPlayer(1))
        .to.emit(tournamentPool, "PlayerRegistered")
        .withArgs(1, player1.address);
    });

    it("Should transfer entry fee from player", async function () {
      const balanceBefore = await musdToken.balanceOf(player1.address);
      await tournamentPool.connect(player1).registerPlayer(1);
      const balanceAfter = await musdToken.balanceOf(player1.address);
      
      expect(balanceBefore - balanceAfter).to.equal(entryFee);
    });

    it("Should add player to participants list", async function () {
      await tournamentPool.connect(player1).registerPlayer(1);
      const participants = await tournamentPool.getTournamentParticipants(1);
      expect(participants).to.include(player1.address);
    });

    it("Should fail if already registered", async function () {
      await tournamentPool.connect(player1).registerPlayer(1);
      await expect(
        tournamentPool.connect(player1).registerPlayer(1)
      ).to.be.revertedWith("Already registered");
    });

    it("Should fail if tournament is full", async function () {
      await tournamentPool.connect(player1).registerPlayer(1);
      await tournamentPool.connect(player2).registerPlayer(1);
      await tournamentPool.connect(player3).registerPlayer(1);
      await tournamentPool.connect(player4).registerPlayer(1);
      
      const signers = await ethers.getSigners();
      const player5 = signers[6]; // owner, treasury, player1-4, then player5
      await musdToken.mint(player5.address, ethers.parseUnits("1000", 18));
      await musdToken.connect(player5).approve(await tournamentPool.getAddress(), ethers.parseUnits("1000", 18));
      
      await expect(
        tournamentPool.connect(player5).registerPlayer(1)
      ).to.be.revertedWith("Tournament full");
    });
  });

  describe("Start Tournament", function () {
    beforeEach(async function () {
      await tournamentPool.createTournament("Test Tournament", entryFee, 4, [60, 30, 10]);
      await tournamentPool.connect(player1).registerPlayer(1);
      await tournamentPool.connect(player2).registerPlayer(1);
    });

    it("Should start tournament with sufficient players", async function () {
      await expect(tournamentPool.startTournament(1))
        .to.emit(tournamentPool, "TournamentStarted");
      
      const tournament = await tournamentPool.getTournament(1);
      expect(tournament.status).to.equal(1); // Active
    });

    it("Should fail if not enough participants", async function () {
      await tournamentPool.createTournament("Test2", entryFee, 8, [50, 30, 20]);
      await tournamentPool.connect(player1).registerPlayer(2);
      
      await expect(
        tournamentPool.startTournament(2)
      ).to.be.revertedWith("Not enough participants");
    });

    it("Should only allow admin to start tournament", async function () {
      await expect(
        tournamentPool.connect(player1).startTournament(1)
      ).to.be.reverted;
    });
  });

  describe("Cancel Tournament", function () {
    beforeEach(async function () {
      await tournamentPool.createTournament("Test Tournament", entryFee, 4, [60, 30, 10]);
      await tournamentPool.connect(player1).registerPlayer(1);
      await tournamentPool.connect(player2).registerPlayer(1);
    });

    it("Should cancel tournament and refund players", async function () {
      const player1BalanceBefore = await musdToken.balanceOf(player1.address);
      const player2BalanceBefore = await musdToken.balanceOf(player2.address);
      
      await expect(tournamentPool.cancelTournament(1))
        .to.emit(tournamentPool, "TournamentCancelled")
        .withArgs(1);
      
      const player1BalanceAfter = await musdToken.balanceOf(player1.address);
      const player2BalanceAfter = await musdToken.balanceOf(player2.address);
      
      expect(player1BalanceAfter - player1BalanceBefore).to.equal(entryFee);
      expect(player2BalanceAfter - player2BalanceBefore).to.equal(entryFee);
    });

    it("Should fail if tournament is active", async function () {
      await tournamentPool.startTournament(1);
      await expect(
        tournamentPool.cancelTournament(1)
      ).to.be.revertedWith("Cannot cancel active tournament");
    });
  });

  describe("Pause/Unpause", function () {
    it("Should allow admin to pause", async function () {
      await tournamentPool.pause();
      expect(await tournamentPool.paused()).to.be.true;
    });

    it("Should prevent registrations when paused", async function () {
      await tournamentPool.createTournament("Test", entryFee, 4, [60, 30, 10]);
      await tournamentPool.pause();
      
      await expect(
        tournamentPool.connect(player1).registerPlayer(1)
      ).to.be.reverted;
    });

    it("Should allow admin to unpause", async function () {
      await tournamentPool.pause();
      await tournamentPool.unpause();
      expect(await tournamentPool.paused()).to.be.false;
    });
  });
});
