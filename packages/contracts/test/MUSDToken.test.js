const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MUSDToken", function () {
  let musdToken;
  let owner;
  let addr1;
  let addr2;
  const initialSupply = ethers.parseUnits("1000000", 18);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const MUSDToken = await ethers.getContractFactory("MUSDToken");
    musdToken = await MUSDToken.deploy(initialSupply);
    await musdToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await musdToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply to the owner", async function () {
      const ownerBalance = await musdToken.balanceOf(owner.address);
      expect(await musdToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await musdToken.name()).to.equal("Mock USD");
      expect(await musdToken.symbol()).to.equal("MUSD");
    });

    it("Should have 18 decimals", async function () {
      expect(await musdToken.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      await musdToken.mint(addr1.address, mintAmount);
      expect(await musdToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      await expect(
        musdToken.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(musdToken, "OwnableUnauthorizedAccount");
    });

    it("Should increase total supply when minting", async function () {
      const mintAmount = ethers.parseUnits("1000", 18);
      const totalSupplyBefore = await musdToken.totalSupply();
      await musdToken.mint(addr1.address, mintAmount);
      const totalSupplyAfter = await musdToken.totalSupply();
      expect(totalSupplyAfter - totalSupplyBefore).to.equal(mintAmount);
    });
  });

  describe("Faucet", function () {
    it("Should allow anyone to use faucet", async function () {
      await musdToken.connect(addr1).faucet(addr1.address);
      const expectedAmount = ethers.parseUnits("1000", 18);
      expect(await musdToken.balanceOf(addr1.address)).to.equal(expectedAmount);
    });

    it("Should mint 1000 MUSD per faucet call", async function () {
      await musdToken.connect(addr1).faucet(addr2.address);
      const balance = await musdToken.balanceOf(addr2.address);
      expect(balance).to.equal(ethers.parseUnits("1000", 18));
    });

    it("Should allow multiple faucet calls", async function () {
      await musdToken.connect(addr1).faucet(addr1.address);
      await musdToken.connect(addr1).faucet(addr1.address);
      const expectedAmount = ethers.parseUnits("2000", 18);
      expect(await musdToken.balanceOf(addr1.address)).to.equal(expectedAmount);
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseUnits("100", 18);
      await musdToken.transfer(addr1.address, transferAmount);
      expect(await musdToken.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await musdToken.balanceOf(owner.address);
      await expect(
        musdToken.connect(addr1).transfer(owner.address, ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(musdToken, "ERC20InsufficientBalance");
    });

    it("Should update balances after transfers", async function () {
      const initialOwnerBalance = await musdToken.balanceOf(owner.address);
      const transferAmount = ethers.parseUnits("100", 18);
      
      await musdToken.transfer(addr1.address, transferAmount);
      await musdToken.transfer(addr2.address, transferAmount);

      const finalOwnerBalance = await musdToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance - (transferAmount * 2n));
      expect(await musdToken.balanceOf(addr1.address)).to.equal(transferAmount);
      expect(await musdToken.balanceOf(addr2.address)).to.equal(transferAmount);
    });
  });
});
