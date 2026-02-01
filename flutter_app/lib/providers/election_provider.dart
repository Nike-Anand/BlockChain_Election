import 'package:flutter/foundation.dart';
import '../services/supabase_service.dart';
import '../services/voter_verification_service.dart';

class ElectionProvider extends ChangeNotifier {
  Map<String, dynamic>? _electionData;
  bool _isLoading = false;
  String? _error;
  String? _currentVoterId;
  String? _currentVoterName;

  Map<String, dynamic>? get electionData => _electionData;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get currentVoterId => _currentVoterId;
  String? get currentVoterName => _currentVoterName;

  List<dynamic> get parties => _electionData?['parties'] ?? [];
  List<dynamic> get votes => _electionData?['votes'] ?? [];
  Map<String, dynamic> get electionSettings => _electionData?['electionSettings'] ?? {};
  Map<String, dynamic> get admin => _electionData?['admin'] ?? {};

  Future<void> loadElectionData() async {
    _setLoading(true);
    try {
      _electionData = await SupabaseService.getElectionData();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> verifyVoter(String epicNumber) async {
    _setLoading(true);
    try {
      final voterName = await VoterVerificationService.verifyVoter(epicNumber);
      if (voterName != null) {
        _currentVoterId = epicNumber;
        _currentVoterName = voterName;
        _error = null;
        return true;
      } else {
        _error = 'EPIC Number not found in electoral roll';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> castVote(String partyName) async {
    if (_currentVoterId == null) return false;
    
    _setLoading(true);
    try {
      await SupabaseService.castVote(
        userId: _currentVoterId!,
        partyName: partyName,
      );
      
      // Reload data to reflect new vote
      await loadElectionData();
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> addParty({
    required String name,
    required String symbol,
    String? description,
    String? manifesto,
  }) async {
    _setLoading(true);
    try {
      await SupabaseService.addParty(
        name: name,
        symbol: symbol,
        description: description,
        manifesto: manifesto,
      );
      
      await loadElectionData();
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> registerVoter({
    required String username,
    required String password,
    required String voterId,
    String? photoBase64,
  }) async {
    _setLoading(true);
    try {
      await SupabaseService.registerVoter(
        username: username,
        password: password,
        voterId: voterId,
        photoBase64: photoBase64,
      );
      
      await loadElectionData();
      _error = null;
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  bool hasVoted(String voterId) {
    return votes.any((vote) => vote['userId'] == voterId);
  }

  bool isElectionActive() {
    return electionSettings['isActive'] == true;
  }

  void logout() {
    _currentVoterId = null;
    _currentVoterName = null;
    _error = null;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}