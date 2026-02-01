import 'dart:convert';
import 'package:crypto/crypto.dart';

class BlockchainService {
  static String generateTransactionHash({
    required String userId,
    required String partyName,
    required String timestamp,
  }) {
    // Create transaction data
    final transactionData = {
      'voter_id': userId,
      'party': partyName,
      'timestamp': timestamp,
      'nonce': DateTime.now().millisecondsSinceEpoch,
    };
    
    // Convert to JSON string
    final jsonString = jsonEncode(transactionData);
    
    // Generate SHA-256 hash
    final bytes = utf8.encode(jsonString);
    final digest = sha256.convert(bytes);
    
    // Return as blockchain-style hash
    return '0x${digest.toString()}';
  }
  
  static bool validateTransactionHash(String hash) {
    // Basic validation - check if it's a valid hex string with 0x prefix
    if (!hash.startsWith('0x')) return false;
    if (hash.length != 66) return false; // 0x + 64 hex chars
    
    final hexPart = hash.substring(2);
    return RegExp(r'^[a-fA-F0-9]+$').hasMatch(hexPart);
  }
  
  static Map<String, dynamic> createVoteRecord({
    required String userId,
    required String partyName,
  }) {
    final timestamp = DateTime.now().toIso8601String();
    final txHash = generateTransactionHash(
      userId: userId,
      partyName: partyName,
      timestamp: timestamp,
    );
    
    return {
      'user_id': userId,
      'party_name': partyName,
      'tx_hash': txHash,
      'timestamp': timestamp,
      'booth_id': 'MOBILE_APP',
    };
  }
}