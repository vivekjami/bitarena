import { ethers } from 'ethers';
import { config, contracts } from '../config';
import { db } from '../config/database';

/**
 * Oracle Service - Submits match results to blockchain
 */
export class OracleService {
  private static instance: OracleService;
  private pendingSubmissions: Map<string, NodeJS.Timeout>;
  private maxRetries: number;

  private constructor() {
    this.pendingSubmissions = new Map();
    this.maxRetries = 3;
  }

  public static getInstance(): OracleService {
    if (!OracleService.instance) {
      OracleService.instance = new OracleService();
    }
    return OracleService.instance;
  }

  /**
   * Submit match result to blockchain
   */
  public async submitResult(
    matchId: string,
    winner: string,
    finalState: unknown
  ): Promise<void> {
    console.log(`🔮 Oracle submitting result for match ${matchId}`);

    try {
      // Get match from database
      const matchResult = await db.query(
        'SELECT contract_match_id FROM matches WHERE id = $1',
        [matchId]
      );

      if (matchResult.rows.length === 0) {
        throw new Error(`Match ${matchId} not found in database`);
      }

      const contractMatchId = matchResult.rows[0].contract_match_id;

      // Generate game data hash
      const gameDataHash = this.generateGameDataHash(finalState);

      // Submit to blockchain with retries
      await this.submitWithRetry(contractMatchId, winner, gameDataHash, 0);

      console.log(`✅ Result submitted for match ${matchId}`);
    } catch (error) {
      console.error(`❌ Failed to submit result for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Generate game data hash (keccak256)
   */
  private generateGameDataHash(finalState: unknown): string {
    // Serialize final state deterministically
    const serialized = JSON.stringify(
      finalState,
      finalState && typeof finalState === 'object' ? Object.keys(finalState).sort() : null
    );
    
    // Generate keccak256 hash
    const hash = ethers.keccak256(ethers.toUtf8Bytes(serialized));
    
    return hash;
  }

  /**
   * Submit to blockchain with retry logic
   */
  private async submitWithRetry(
    contractMatchId: number,
    winner: string,
    gameDataHash: string,
    attempt: number
  ): Promise<void> {
    try {
      // Ensure contract is initialized
      if (!contracts.matchEscrow) {
        throw new Error('MatchEscrow contract not initialized');
      }

      // Call submitResult on smart contract
      const tx = await contracts.matchEscrow.submitResult(
        contractMatchId,
        winner,
        gameDataHash,
        {
          gasLimit: 300000 + (attempt * 50000), // Increase gas on retries
        }
      );

      console.log(`📤 Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error(`Submission attempt ${attempt + 1} failed:`, error);

      // Retry with exponential backoff
      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(`⏳ Retrying in ${delay}ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.submitWithRetry(contractMatchId, winner, gameDataHash, attempt + 1);
      }

      throw new Error(`Failed to submit result after ${this.maxRetries + 1} attempts`);
    }
  }

  /**
   * Sign result with oracle private key
   */
  private signResult(matchId: number, winner: string, gameDataHash: string): string {
    if (!config.blockchain.oraclePrivateKey) {
      throw new Error('Oracle private key not configured');
    }

    // Create message to sign
    const message = ethers.solidityPackedKeccak256(
      ['uint256', 'address', 'bytes32'],
      [matchId, winner, gameDataHash]
    );

    // Sign with oracle wallet
    const wallet = new ethers.Wallet(config.blockchain.oraclePrivateKey);
    const signature = wallet.signMessageSync(ethers.getBytes(message));

    return signature;
  }

  /**
   * Monitor for dispute events
   */
  public async monitorDisputes(): Promise<void> {
    if (!contracts.matchEscrow) {
      console.warn('MatchEscrow contract not initialized, cannot monitor disputes');
      return;
    }

    console.log('👀 Oracle monitoring for dispute events...');

    // Listen for MatchDisputed events
    contracts.matchEscrow.on('MatchDisputed', async (matchId: bigint, timestamp: bigint) => {
      console.log(`⚠️  Dispute detected for match ${matchId}`);

      try {
        await this.handleDispute(Number(matchId), Number(timestamp));
      } catch (error) {
        console.error(`Failed to handle dispute for match ${matchId}:`, error);
      }
    });
  }

  /**
   * Handle disputed match
   */
  private async handleDispute(contractMatchId: number, _timestamp: number): Promise<void> {
    console.log(`🔍 Investigating dispute for contract match ${contractMatchId}`);

    // Get match from database
    const result = await db.query(
      'SELECT id FROM matches WHERE contract_match_id = $1',
      [contractMatchId]
    );

    if (result.rows.length === 0) {
      console.warn(`No database record found for contract match ${contractMatchId}`);
      return;
    }

    const matchId = result.rows[0].id;

    // Pull game logs for replay
    const logs = await this.getGameLogs(matchId);

    // Generate replay data
    const replayData = this.generateReplayData(logs);

    // Store replay for manual review
    await db.query(
      'UPDATE matches SET replay_data = $1, disputed = true WHERE id = $2',
      [JSON.stringify(replayData), matchId]
    );

    console.log(`✅ Dispute data stored for match ${matchId}`);

    // In a real system, this would trigger manual review by admins
    // For now, we just log it
  }

  /**
   * Get game logs for a match
   */
  private async getGameLogs(matchId: string): Promise<unknown[]> {
    // Determine partition
    const now = new Date();
    const partition = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    try {
      const result = await db.query(
        `SELECT * FROM game_logs_${partition}
         WHERE match_id = $1
         ORDER BY timestamp ASC`,
        [matchId]
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to fetch game logs:', error);
      return [];
    }
  }

  /**
   * Generate replay data from game logs
   */
  private generateReplayData(logs: unknown[]): { events: unknown[]; metadata: unknown } {
    return {
      events: logs,
      metadata: {
        generatedAt: Date.now(),
        eventCount: logs.length,
      },
    };
  }

  /**
   * Get signature from oracle
   */
  public getSignature(matchId: number, winner: string, gameDataHash: string): string {
    return this.signResult(matchId, winner, gameDataHash);
  }
}

// Export singleton
export const oracleService = OracleService.getInstance();
