import 'package:supabase_flutter/supabase_flutter.dart';
import 'blockchain_service.dart';
import 'dart:typed_data';

class SupabaseService {
  static const String supabaseUrl = 'https://vvyuhplekvizscvovral.supabase.co';
  static const String supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2eXVocGxla3ZpenNjdm92cmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNzQwNzEsImV4cCI6MjA4NDg1MDA3MX0.BugWw5SlEICo2UXDe-pBuvoLJbLSaUJjzKr4tilTnSc';
  
  static SupabaseClient get client => Supabase.instance.client;
  
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: supabaseUrl,
      anonKey: supabaseKey,
    );
  }

  // Get all election data (replaces /api/get-db)
  static Future<Map<String, dynamic>> getElectionData() async {
    try {
      final users = await client.from('users').select('*');
      final parties = await client.from('parties').select('*');
      final votes = await client.from('votes').select('*');
      final settings = await client.from('settings').select('*').single();
      
      // Format data to match web frontend structure
      final formattedUsers = users.map((u) => {
        'username': u['username'],
        'password': u['password'],
        'voterId': u['voter_id'],
        'role': u['role'],
        'pass1': u['pass1'],
        'pass2': u['pass2'],
        'pass3': u['pass3'],
        'pass4': u['pass4'],
      }).toList();
      
      final formattedParties = parties.map((p) => {
        'name': p['name'],
        'symbol': p['symbol'],
        'votes': p['votes'],
        'description': p['description'],
        'manifesto': p['manifesto'],
        'imageUrl': p['image_url'],
      }).toList();
      
      final formattedVotes = votes.map((v) => {
        'userId': v['user_id'],
        'partyName': v['party_name'],
        'timestamp': v['timestamp'],
        'boothId': v['booth_id'],
        'hash': v['tx_hash'],
      }).toList();
      
      return {
        'admin': formattedUsers.firstWhere((u) => u['role'] == 'admin', orElse: () => {}),
        'users': formattedUsers,
        'parties': formattedParties,
        'votes': formattedVotes,
        'electionSettings': {
          'startTime': settings['start_time'],
          'endTime': settings['end_time'],
          'isActive': settings['is_active'],
          'registrationOpen': settings['registration_open'],
          'minVotingAge': settings['min_voting_age'] ?? 18,
        }
      };
    } catch (e) {
      throw Exception('Failed to fetch election data: $e');
    }
  }

  // Register voter
  static Future<bool> registerVoter({
    required String username,
    required String password,
    required String voterId,
    String? photoBase64,
  }) async {
    try {
      await client.from('users').insert({
        'username': username,
        'password': password,
        'voter_id': voterId,
        'role': 'voter',
        'photo_base64': photoBase64,
      });
      return true;
    } catch (e) {
      throw Exception('Failed to register voter: $e');
    }
  }

  // Add party
  static Future<bool> addParty({
    required String name,
    required String symbol,
    String? description,
    String? manifesto,
    String? imageUrl,
  }) async {
    try {
      await client.from('parties').insert({
        'name': name,
        'symbol': symbol,
        'description': description,
        'manifesto': manifesto,
        'image_url': imageUrl,
        'votes': 0,
      });
      return true;
    } catch (e) {
      throw Exception('Failed to add party: $e');
    }
  }

  // Cast vote with simulated blockchain
  static Future<Map<String, dynamic>> castVote({
    required String userId,
    required String partyName,
    String boothId = 'MOBILE_APP',
  }) async {
    try {
      // Check if already voted
      final existingVote = await client
          .from('votes')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
      
      if (existingVote != null) {
        throw Exception('Already voted');
      }

      // Generate blockchain record
      final voteRecord = BlockchainService.createVoteRecord(
        userId: userId,
        partyName: partyName,
      );

      // Insert vote
      await client.from('votes').insert(voteRecord);

      return {
        'status': 'success',
        'tx_hash': voteRecord['tx_hash'],
        'message': 'Vote recorded successfully'
      };
    } catch (e) {
      throw Exception('Failed to cast vote: $e');
    }
  }

  // Update election settings
  static Future<bool> updateSettings({
    bool? isActive,
    bool? registrationOpen,
    String? startTime,
    String? endTime,
  }) async {
    try {
      final updates = <String, dynamic>{};
      if (isActive != null) updates['is_active'] = isActive;
      if (registrationOpen != null) updates['registration_open'] = registrationOpen;
      if (startTime != null) updates['start_time'] = startTime;
      if (endTime != null) updates['end_time'] = endTime;

      if (updates.isNotEmpty) {
        await client.from('settings').update(updates).eq('id', 1);
      }
      return true;
    } catch (e) {
      throw Exception('Failed to update settings: $e');
    }
  }

  // Biometric verification (simplified - no ML processing)
  static Future<Map<String, dynamic>> verifyBiometric({
    required String voterId,
    required Uint8List liveImageBytes,
  }) async {
    try {
      // Get stored user data
      final user = await client
          .from('users')
          .select('*')
          .eq('voter_id', voterId)
          .single();

      if (user['photo_base64'] == null) {
        throw Exception('No biometric data registered');
      }

      // Simulate biometric verification (always pass for MVP)
      // In production, implement actual face recognition
      await Future.delayed(Duration(seconds: 2)); // Simulate processing

      return {
        'status': 'success',
        'message': 'Biometric verification successful',
        'user': user,
      };
    } catch (e) {
      throw Exception('Biometric verification failed: $e');
    }
  }
}