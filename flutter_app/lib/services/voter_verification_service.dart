import 'dart:convert';
import 'package:flutter/services.dart';

class VoterVerificationService {
  static List<List<String>>? _voterData;
  
  static Future<void> loadVoterData() async {
    if (_voterData != null) return;
    
    try {
      print('🔍 Loading voter data from assets/data/voter_list_final.csv');
      final csvString = await rootBundle.loadString('assets/data/voter_list_final.csv');
      print('✅ CSV loaded, length: ${csvString.length} characters');
      
      // Manual parsing - split by newlines and then by commas
      final lines = csvString.split(RegExp(r'\r?\n')).where((line) => line.trim().isNotEmpty).toList();
      print('✅ Found ${lines.length} lines');
      
      _voterData = lines.map((line) {
        // Simple CSV parsing - split by comma
        return line.split(',').map((cell) => cell.trim()).toList();
      }).toList();
      
      print('✅ CSV parsed, ${_voterData!.length} rows found');
      if (_voterData!.isNotEmpty) {
        print('📋 Headers: ${_voterData![0]}');
        if (_voterData!.length > 1) {
          print('📋 First data row: ${_voterData![1]}');
          print('📋 Second data row: ${_voterData!.length > 2 ? _voterData![2] : "No second row"}');
        }
      }
    } catch (e) {
      print('❌ Error loading voter data: $e');
      _voterData = [];
    }
  }

  static Future<String?> verifyVoter(String epicNumber) async {
    print('\n🔍 Verifying EPIC: $epicNumber');
    await loadVoterData();
    
    if (_voterData == null || _voterData!.isEmpty) {
      print('❌ Voter data is empty or null');
      return null;
    }

    print('📊 Total rows in CSV: ${_voterData!.length}');

    // Find header row
    final headers = _voterData![0].map((h) => h.toUpperCase()).toList();
    print('📋 Headers found: $headers');
    
    final epicIndex = headers.indexWhere((h) => h.contains('EPIC'));
    final nameIndex = headers.indexWhere((h) => h.contains('NAME') && !h.contains('FATHER'));
    
    print('📍 EPIC column index: $epicIndex');
    print('📍 Name column index: $nameIndex');
    
    if (epicIndex == -1) {
      print('❌ EPIC column not found in CSV');
      return null;
    }

    final targetEpic = epicNumber.trim().toUpperCase().replaceAll(RegExp(r'\s+'), '');
    print('🎯 Searching for: $targetEpic');
    
    // Search for voter (skip header row)
    for (int i = 1; i < _voterData!.length; i++) {
      final row = _voterData![i];
      if (row.length > epicIndex) {
        final recordEpic = row[epicIndex].toUpperCase().replaceAll(RegExp(r'\s+'), '');
        
        if (i <= 3) { // Log first few rows for debugging
          print('  Row $i EPIC: $recordEpic (comparing with $targetEpic)');
        }
        
        if (recordEpic == targetEpic) {
          String name = 'Unknown Voter';
          if (nameIndex != -1 && row.length > nameIndex) {
            name = row[nameIndex]
                .replaceAll(RegExp(r'[\u200C\u200B]'), '')
                .trim();
          }
          print('✅ Voter verified: $name ($targetEpic)');
          return name;
        }
      }
    }
    
    print('❌ EPIC $targetEpic not found in ${_voterData!.length - 1} voter records');
    return null;
  }
}