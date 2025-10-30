// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MatchEscrow
 * @dev Manages MUSD stakes for competitive matches with oracle-based result submission
 */
contract MatchEscrow is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    
    IERC20 public immutable musdToken;
    address public immutable treasury;
    uint256 public matchCounter;
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
    uint256 public constant DISPUTE_TIMEOUT = 10 minutes;
    uint256 public constant BPS_DENOMINATOR = 10000;

    enum GameType { ProjectileDuel, GravityPainters }
    enum MatchStatus { Pending, Active, Completed, Disputed, Refunded }

    struct Match {
        uint256 id;
        GameType gameType;
        uint256 stakeAmount;
        uint8 maxPlayers;
        address[] players;
        address winner;
        uint256 totalPot;
        MatchStatus status;
        uint256 startTime;
        uint256 createdAt;
        bytes32 gameDataHash;
    }

    mapping(uint256 => Match) public matches;
    mapping(uint256 => mapping(address => bool)) public hasJoined;

    event MatchCreated(uint256 indexed matchId, address indexed creator, GameType gameType, uint256 stakeAmount, uint8 maxPlayers);
    event PlayerJoined(uint256 indexed matchId, address indexed player);
    event MatchStarted(uint256 indexed matchId, uint256 startTime);
    event MatchCompleted(uint256 indexed matchId, address indexed winner, bytes32 gameDataHash);
    event WinningsClaimed(uint256 indexed matchId, address indexed winner, uint256 amount, uint256 platformFee);
    event MatchDisputed(uint256 indexed matchId);
    event MatchRefunded(uint256 indexed matchId);

    constructor(address _musdToken, address _treasury) {
        require(_musdToken != address(0), "Invalid token address");
        require(_treasury != address(0), "Invalid treasury address");
        
        musdToken = IERC20(_musdToken);
        treasury = _treasury;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
    }

    /**
     * @dev Create a new match
     */
    function createMatch(
        GameType _gameType,
        uint256 _stakeAmount,
        uint8 _maxPlayers
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_stakeAmount > 0, "Stake must be positive");
        require(_maxPlayers >= 2 && _maxPlayers <= 10, "Invalid max players");
        
        // Transfer stake from creator
        require(musdToken.transferFrom(msg.sender, address(this), _stakeAmount), "Transfer failed");
        
        matchCounter++;
        uint256 matchId = matchCounter;
        
        Match storage newMatch = matches[matchId];
        newMatch.id = matchId;
        newMatch.gameType = _gameType;
        newMatch.stakeAmount = _stakeAmount;
        newMatch.maxPlayers = _maxPlayers;
        newMatch.players.push(msg.sender);
        newMatch.totalPot = _stakeAmount;
        newMatch.status = MatchStatus.Pending;
        newMatch.createdAt = block.timestamp;
        
        hasJoined[matchId][msg.sender] = true;
        
        emit MatchCreated(matchId, msg.sender, _gameType, _stakeAmount, _maxPlayers);
        
        return matchId;
    }

    /**
     * @dev Join an existing match
     */
    function joinMatch(uint256 _matchId) external whenNotPaused nonReentrant {
        Match storage matchData = matches[_matchId];
        
        require(matchData.id != 0, "Match does not exist");
        require(matchData.status == MatchStatus.Pending, "Match not accepting players");
        require(!hasJoined[_matchId][msg.sender], "Already joined");
        require(matchData.players.length < matchData.maxPlayers, "Match is full");
        
        // Transfer stake from player
        require(musdToken.transferFrom(msg.sender, address(this), matchData.stakeAmount), "Transfer failed");
        
        matchData.players.push(msg.sender);
        matchData.totalPot += matchData.stakeAmount;
        hasJoined[_matchId][msg.sender] = true;
        
        emit PlayerJoined(_matchId, msg.sender);
        
        // Auto-start if match is full
        if (matchData.players.length == matchData.maxPlayers) {
            _startMatch(_matchId);
        }
    }

    /**
     * @dev Internal function to start a match
     */
    function _startMatch(uint256 _matchId) internal {
        Match storage matchData = matches[_matchId];
        matchData.status = MatchStatus.Active;
        matchData.startTime = block.timestamp;
        
        emit MatchStarted(_matchId, block.timestamp);
    }

    /**
     * @dev Submit match result (Oracle only)
     */
    function submitResult(
        uint256 _matchId,
        address _winner,
        bytes32 _gameDataHash
    ) external onlyRole(ORACLE_ROLE) {
        Match storage matchData = matches[_matchId];
        
        require(matchData.status == MatchStatus.Active, "Match not active");
        require(_isPlayerInMatch(_matchId, _winner), "Winner not in match");
        
        matchData.winner = _winner;
        matchData.gameDataHash = _gameDataHash;
        matchData.status = MatchStatus.Completed;
        
        emit MatchCompleted(_matchId, _winner, _gameDataHash);
    }

    /**
     * @dev Claim winnings after match completion
     */
    function claimWinnings(uint256 _matchId) external nonReentrant {
        Match storage matchData = matches[_matchId];
        
        require(matchData.status == MatchStatus.Completed, "Match not completed");
        require(matchData.winner == msg.sender, "Not the winner");
        require(matchData.totalPot > 0, "Already claimed");
        
        uint256 totalPot = matchData.totalPot;
        uint256 platformFee = (totalPot * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 winnerPrize = totalPot - platformFee;
        
        matchData.totalPot = 0; // Prevent re-claiming
        
        require(musdToken.transfer(treasury, platformFee), "Fee transfer failed");
        require(musdToken.transfer(msg.sender, winnerPrize), "Prize transfer failed");
        
        emit WinningsClaimed(_matchId, msg.sender, winnerPrize, platformFee);
    }

    /**
     * @dev Dispute a match and refund all players if timeout exceeded
     */
    function disputeMatch(uint256 _matchId) external nonReentrant {
        Match storage matchData = matches[_matchId];
        
        require(matchData.status == MatchStatus.Active, "Match not active");
        require(block.timestamp >= matchData.startTime + DISPUTE_TIMEOUT, "Timeout not reached");
        require(_isPlayerInMatch(_matchId, msg.sender), "Not a player");
        
        matchData.status = MatchStatus.Disputed;
        
        // Refund all players
        uint256 refundAmount = matchData.stakeAmount;
        for (uint256 i = 0; i < matchData.players.length; i++) {
            require(musdToken.transfer(matchData.players[i], refundAmount), "Refund failed");
        }
        
        matchData.totalPot = 0;
        
        emit MatchDisputed(_matchId);
        emit MatchRefunded(_matchId);
    }

    /**
     * @dev Check if an address is a player in the match
     */
    function _isPlayerInMatch(uint256 _matchId, address _player) internal view returns (bool) {
        return hasJoined[_matchId][_player];
    }

    /**
     * @dev Get match details
     */
    function getMatch(uint256 _matchId) external view returns (Match memory) {
        return matches[_matchId];
    }

    /**
     * @dev Get players in a match
     */
    function getMatchPlayers(uint256 _matchId) external view returns (address[] memory) {
        return matches[_matchId].players;
    }

    /**
     * @dev Pause contract (admin only)
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract (admin only)
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Emergency withdrawal (admin only, for stuck funds)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(IERC20(_token).transfer(msg.sender, _amount), "Withdrawal failed");
    }
}
