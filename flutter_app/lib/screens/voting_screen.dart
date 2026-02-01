import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/election_provider.dart';
import 'success_screen.dart';

class VotingScreen extends StatefulWidget {
  const VotingScreen({super.key});

  @override
  State<VotingScreen> createState() => _VotingScreenState();
}

class _VotingScreenState extends State<VotingScreen> {
  String? _selectedParty;
  int _timeLeft = 30;
  bool _isVoting = false;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() => _timeLeft--);
        if (_timeLeft <= 0) {
          _handleTimeout();
          return false;
        }
        return true;
      }
      return false;
    });
  }

  void _handleTimeout() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Session timed out'),
        backgroundColor: Colors.red,
      ),
    );
    Navigator.popUntil(context, (route) => route.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Consumer<ElectionProvider>(
        builder: (context, provider, child) {
          return Column(
            children: [
              // Header
              Container(
                color: const Color(0xFF003366),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.how_to_vote,
                            color: Color(0xFF003366),
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'CAST YOUR VOTE',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                ),
                              ),
                              Text(
                                'Voter: ${provider.currentVoterName}',
                                style: const TextStyle(
                                  color: Color(0xFFFF9933),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            '00:${_timeLeft.toString().padLeft(2, '0')}',
                            style: TextStyle(
                              color: _timeLeft < 10 ? Colors.red : const Color(0xFFFF9933),
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'monospace',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              
              // Parties Grid
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.8,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: provider.parties.length,
                    itemBuilder: (context, index) {
                      final party = provider.parties[index];
                      final isSelected = _selectedParty == party['name'];
                      
                      return GestureDetector(
                        onTap: () => setState(() => _selectedParty = party['name']),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected 
                                ? const Color(0xFFFF9933)
                                : Colors.grey[300]!,
                              width: isSelected ? 3 : 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: isSelected 
                                  ? const Color(0xFFFF9933).withOpacity(0.3)
                                  : Colors.grey.withOpacity(0.1),
                                blurRadius: isSelected ? 8 : 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              children: [
                                if (isSelected)
                                  const Align(
                                    alignment: Alignment.topRight,
                                    child: Icon(
                                      Icons.check_circle,
                                      color: Color(0xFFFF9933),
                                      size: 24,
                                    ),
                                  ),
                                
                                Expanded(
                                  child: Container(
                                    width: 80,
                                    height: 80,
                                    decoration: BoxDecoration(
                                      color: Colors.grey[100],
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isSelected 
                                          ? const Color(0xFFFF9933)
                                          : Colors.grey[300]!,
                                      ),
                                    ),
                                    child: party['imageUrl'] != null
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(11),
                                          child: Image.network(
                                            party['imageUrl'],
                                            fit: BoxFit.contain,
                                            errorBuilder: (context, error, stackTrace) {
                                              return Center(
                                                child: Text(
                                                  party['name'][0],
                                                  style: const TextStyle(
                                                    fontSize: 32,
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFF003366),
                                                  ),
                                                ),
                                              );
                                            },
                                          ),
                                        )
                                      : Center(
                                          child: Text(
                                            party['name'][0],
                                            style: const TextStyle(
                                              fontSize: 32,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF003366),
                                            ),
                                          ),
                                        ),
                                  ),
                                ),
                                
                                const SizedBox(height: 12),
                                
                                Text(
                                  party['name'],
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected 
                                      ? const Color(0xFF003366)
                                      : Colors.grey[700],
                                  ),
                                  textAlign: TextAlign.center,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                
                                const SizedBox(height: 8),
                                
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isSelected 
                                      ? const Color(0xFFFF9933)
                                      : const Color(0xFF003366),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    isSelected ? 'SELECTED' : 'SELECT',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
              
              // Confirm Button
              if (_selectedParty != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, -2),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: const Color(0xFF003366),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.check,
                                color: Color(0xFFFF9933),
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'READY TO CAST',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.grey,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                  Text(
                                    _selectedParty!,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF003366),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _isVoting ? null : _handleVote,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFF9933),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: _isVoting
                              ? const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    ),
                                    SizedBox(width: 12),
                                    Text(
                                      'CASTING VOTE...',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                  ],
                                )
                              : const Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      'CONFIRM VOTE',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                    SizedBox(width: 8),
                                    Icon(Icons.arrow_forward, size: 20),
                                  ],
                                ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  void _handleVote() async {
    if (_selectedParty == null || _isVoting) return;
    
    setState(() => _isVoting = true);
    
    final provider = context.read<ElectionProvider>();
    final success = await provider.castVote(_selectedParty!);
    
    if (mounted) {
      if (success) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => SuccessScreen(
              voterName: provider.currentVoterName ?? 'Voter',
              voterId: provider.currentVoterId ?? '',
              partyName: _selectedParty!,
            ),
          ),
        );
      } else {
        setState(() => _isVoting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Failed to cast vote'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}