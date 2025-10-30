// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MUSDToken
 * @dev Mock MUSD token for testnet use
 * ERC20 token with minting capabilities for testing
 */
contract MUSDToken is ERC20, Ownable {
    /**
     * @dev Constructor that gives msg.sender all of existing tokens
     * @param initialSupply Initial supply of tokens (in wei)
     */
    constructor(uint256 initialSupply) ERC20("Mock USD", "MUSD") Ownable(msg.sender) {
        _mint(msg.sender, initialSupply);
    }

    /**
     * @dev Mint new tokens - only owner can call
     * @param to Address to receive minted tokens
     * @param amount Amount of tokens to mint (in wei)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Public faucet function for testnet - allows anyone to mint tokens for testing
     * Limited to 1000 MUSD per call to prevent abuse
     * @param to Address to receive tokens
     */
    function faucet(address to) external {
        uint256 faucetAmount = 1000 * 10**decimals(); // 1000 MUSD
        _mint(to, faucetAmount);
    }

    /**
     * @dev Returns the number of decimals used for token
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
