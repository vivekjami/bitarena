// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TournamentPool
 * @dev Manages bracket-style tournaments with progressive prize distribution
 */
contract TournamentPool is AccessControl, ReentrancyGuard, Pausable {
    IERC20 public immutable musdToken;
    address public immutable treasury;
    address public matchEscrow;
    uint256 public tournamentCounter;
    uint256 public constant PLATFORM_FEE_BPS = 250; // 2.5%
    uint256 public constant BPS_DENOMINATOR = 10000;

    enum TournamentStatus { Registration, Active, Completed, Cancelled }

    struct Tournament {
        uint256 id;
        string name;
        uint256 entryFee;
        uint256 prizePool;
        uint8 maxPlayers;
        uint8 currentRound;
        TournamentStatus status;
        address[] participants;
        uint8[] prizeDistribution; // Percentages in basis points
        uint256 createdAt;
    }

    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => mapping(address => bool)) public hasRegistered;
    mapping(uint256 => mapping(uint8 => uint256[])) public roundMatches;
    mapping(uint256 => mapping(address => bool)) public hasAdvanced;

    event TournamentCreated(uint256 indexed tournamentId, string name, uint256 entryFee, uint8 maxPlayers);
    event PlayerRegistered(uint256 indexed tournamentId, address indexed player);
    event TournamentStarted(uint256 indexed tournamentId, uint256 startTime);
    event WinnerAdvanced(uint256 indexed tournamentId, uint8 round, address indexed winner);
    event PrizesDistributed(uint256 indexed tournamentId);
    event TournamentCancelled(uint256 indexed tournamentId);

    constructor(address _musdToken, address _treasury, address _matchEscrow) {
        require(_musdToken != address(0), "Invalid token address");
        require(_treasury != address(0), "Invalid treasury address");
        require(_matchEscrow != address(0), "Invalid match escrow address");
        
        musdToken = IERC20(_musdToken);
        treasury = _treasury;
        matchEscrow = _matchEscrow;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Create a new tournament
     */
    function createTournament(
        string memory _name,
        uint256 _entryFee,
        uint8 _maxPlayers,
        uint8[] memory _prizeDistribution
    ) external onlyRole(DEFAULT_ADMIN_ROLE) whenNotPaused returns (uint256) {
        require(_entryFee > 0, "Entry fee must be positive");
        require(_isPowerOfTwo(_maxPlayers) && _maxPlayers >= 4, "Max players must be power of 2 and >= 4");
        require(_validatePrizeDistribution(_prizeDistribution), "Invalid prize distribution");
        
        tournamentCounter++;
        uint256 tournamentId = tournamentCounter;
        
        Tournament storage newTournament = tournaments[tournamentId];
        newTournament.id = tournamentId;
        newTournament.name = _name;
        newTournament.entryFee = _entryFee;
        newTournament.maxPlayers = _maxPlayers;
        newTournament.prizeDistribution = _prizeDistribution;
        newTournament.status = TournamentStatus.Registration;
        newTournament.createdAt = block.timestamp;
        
        emit TournamentCreated(tournamentId, _name, _entryFee, _maxPlayers);
        
        return tournamentId;
    }

    /**
     * @dev Register player for tournament
     */
    function registerPlayer(uint256 _tournamentId) external whenNotPaused nonReentrant {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.id != 0, "Tournament does not exist");
        require(tournament.status == TournamentStatus.Registration, "Registration closed");
        require(!hasRegistered[_tournamentId][msg.sender], "Already registered");
        require(tournament.participants.length < tournament.maxPlayers, "Tournament full");
        
        // Transfer entry fee
        require(musdToken.transferFrom(msg.sender, address(this), tournament.entryFee), "Transfer failed");
        
        tournament.participants.push(msg.sender);
        tournament.prizePool += tournament.entryFee;
        hasRegistered[_tournamentId][msg.sender] = true;
        
        emit PlayerRegistered(_tournamentId, msg.sender);
    }

    /**
     * @dev Start tournament (admin only)
     */
    function startTournament(uint256 _tournamentId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.status == TournamentStatus.Registration, "Already started");
        require(tournament.participants.length >= tournament.maxPlayers / 2, "Not enough participants");
        
        tournament.status = TournamentStatus.Active;
        tournament.currentRound = 1;
        
        // Shuffle participants (simple pseudo-random for demo)
        _shuffleParticipants(_tournamentId);
        
        emit TournamentStarted(_tournamentId, block.timestamp);
    }

    /**
     * @dev Advance winner to next round (called by MatchEscrow or admin)
     */
    function advanceWinner(uint256 _tournamentId, address _winner) external {
        require(msg.sender == matchEscrow || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Unauthorized");
        
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.status == TournamentStatus.Active, "Tournament not active");
        require(hasRegistered[_tournamentId][_winner], "Not a participant");
        
        hasAdvanced[_tournamentId][_winner] = true;
        
        emit WinnerAdvanced(_tournamentId, tournament.currentRound, _winner);
        
        // Check if round is complete and advance to next round or finish tournament
        _checkRoundCompletion(_tournamentId);
    }

    /**
     * @dev Distribute prizes to winners
     */
    function distributePrizes(uint256 _tournamentId) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.status == TournamentStatus.Active, "Tournament not active");
        require(tournament.prizePool > 0, "No prize pool");
        
        uint256 totalPot = tournament.prizePool;
        uint256 platformFee = (totalPot * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netPot = totalPot - platformFee;
        
        // Transfer platform fee
        require(musdToken.transfer(treasury, platformFee), "Fee transfer failed");
        
        // Distribute prizes based on distribution array
        // This is simplified - in production, track actual winners
        uint256 remainingParticipants = tournament.participants.length;
        uint256 prizeCount = tournament.prizeDistribution.length;
        
        for (uint256 i = 0; i < prizeCount && i < remainingParticipants; i++) {
            uint256 prizeAmount = (netPot * tournament.prizeDistribution[i]) / BPS_DENOMINATOR;
            address winner = tournament.participants[i]; // Simplified: actual winners should be tracked
            require(musdToken.transfer(winner, prizeAmount), "Prize transfer failed");
        }
        
        tournament.prizePool = 0;
        tournament.status = TournamentStatus.Completed;
        
        emit PrizesDistributed(_tournamentId);
    }

    /**
     * @dev Cancel tournament and refund all participants
     */
    function cancelTournament(uint256 _tournamentId) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.status == TournamentStatus.Registration, "Cannot cancel active tournament");
        
        // Refund all participants
        uint256 refundAmount = tournament.entryFee;
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            require(musdToken.transfer(tournament.participants[i], refundAmount), "Refund failed");
        }
        
        tournament.prizePool = 0;
        tournament.status = TournamentStatus.Cancelled;
        
        emit TournamentCancelled(_tournamentId);
    }

    /**
     * @dev Check if a number is a power of 2
     */
    function _isPowerOfTwo(uint8 n) internal pure returns (bool) {
        return n > 0 && (n & (n - 1)) == 0;
    }

    /**
     * @dev Validate prize distribution percentages sum to 100%
     */
    function _validatePrizeDistribution(uint8[] memory _distribution) internal pure returns (bool) {
        uint256 total = 0;
        for (uint256 i = 0; i < _distribution.length; i++) {
            total += _distribution[i];
        }
        return total == 100;
    }

    /**
     * @dev Simple shuffle algorithm for participants
     */
    function _shuffleParticipants(uint256 _tournamentId) internal {
        Tournament storage tournament = tournaments[_tournamentId];
        uint256 n = tournament.participants.length;
        
        for (uint256 i = 0; i < n; i++) {
            uint256 j = i + uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, i))) % (n - i);
            address temp = tournament.participants[i];
            tournament.participants[i] = tournament.participants[j];
            tournament.participants[j] = temp;
        }
    }

    /**
     * @dev Check if current round is complete and advance to next round
     */
    function _checkRoundCompletion(uint256 _tournamentId) internal {
        Tournament storage tournament = tournaments[_tournamentId];
        
        // Count how many players have advanced in current round
        uint256 advancedCount = 0;
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            if (hasAdvanced[_tournamentId][tournament.participants[i]]) {
                advancedCount++;
            }
        }
        
        // If half the players advanced, move to next round
        uint256 expectedInNextRound = tournament.participants.length / (2 ** tournament.currentRound);
        if (advancedCount >= expectedInNextRound) {
            tournament.currentRound++;
        }
    }

    /**
     * @dev Get tournament details
     */
    function getTournament(uint256 _tournamentId) external view returns (Tournament memory) {
        return tournaments[_tournamentId];
    }

    /**
     * @dev Get tournament participants
     */
    function getTournamentParticipants(uint256 _tournamentId) external view returns (address[] memory) {
        return tournaments[_tournamentId].participants;
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
     * @dev Update match escrow address (admin only)
     */
    function setMatchEscrow(address _matchEscrow) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_matchEscrow != address(0), "Invalid address");
        matchEscrow = _matchEscrow;
    }
}
