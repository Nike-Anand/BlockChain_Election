import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/election_provider.dart';
import 'biometric_screen.dart';

class VoterLandingScreen extends StatefulWidget {
  const VoterLandingScreen({super.key});

  @override
  State<VoterLandingScreen> createState() => _VoterLandingScreenState();
}

class _VoterLandingScreenState extends State<VoterLandingScreen> {
  final _epicController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ElectionProvider>().loadElectionData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFFFAFAFA), Color(0xFFFFF8E1)],
          ),
        ),
        child: Column(
          children: [
            // TN Header Stripe
            Container(
              height: 8,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.red, Color(0xFFFF9933), Colors.black],
                ),
              ),
            ),
            
            // Header
            _buildHeader(),
            
            // Main Content
            Expanded(child: _buildVoterEntry()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Consumer<ElectionProvider>(
      builder: (context, provider, child) {
        return Container(
          color: const Color(0xFF003366),
          padding: const EdgeInsets.all(16),
          child: SafeArea(
            bottom: false,
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: const Color(0xFFFF9933), width: 2),
                  ),
                  child: const Icon(
                    Icons.how_to_vote,
                    color: Color(0xFF003366),
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'தமிழ்நாடு மாநில தேர்தல் ஆணையம்',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      Text(
                        'TAMIL NADU STATE ELECTION COMMISSION',
                        style: TextStyle(
                          color: Color(0xFFFF9933),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: provider.isElectionActive() 
                      ? Colors.green.withOpacity(0.1)
                      : Colors.red.withOpacity(0.1),
                    border: Border.all(
                      color: provider.isElectionActive() ? Colors.green : Colors.red,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.circle,
                        size: 8,
                        color: provider.isElectionActive() ? Colors.green : Colors.red,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        provider.isElectionActive() ? 'POLLING ACTIVE' : 'POLLING CLOSED',
                        style: TextStyle(
                          color: provider.isElectionActive() ? Colors.green : Colors.red,
                          fontSize: 8,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildVoterEntry() {
    return Consumer<ElectionProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.electionData == null) {
          return const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(color: Color(0xFF003366)),
                SizedBox(height: 16),
                Text(
                  'Initialising Secure Systems',
                  style: TextStyle(
                    color: Color(0xFF003366),
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
              ],
            ),
          );
        }

        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Card(
              elevation: 20,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(32),
              ),
              child: Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxWidth: 400),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Card Header
                    Container(
                      padding: const EdgeInsets.all(32),
                      decoration: const BoxDecoration(
                        color: Color(0xFF003366),
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(32),
                          topRight: Radius.circular(32),
                        ),
                      ),
                      child: Column(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(40),
                              border: Border.all(color: const Color(0xFFFF9933), width: 4),
                            ),
                            child: const Icon(
                              Icons.how_to_vote,
                              color: Color(0xFF003366),
                              size: 40,
                            ),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'VOTER ENTRY',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1,
                            ),
                          ),
                          const Text(
                            'அடையாளச் சரிபார்ப்பு',
                            style: TextStyle(
                              color: Color(0xFFFF9933),
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 2,
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    // Card Content
                    Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'EPIC REFERENCE IDENTIFICATION',
                            style: TextStyle(
                              color: Color(0xFF003366),
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextField(
                            controller: _epicController,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 2,
                            ),
                            textCapitalization: TextCapitalization.characters,
                            decoration: InputDecoration(
                              hintText: 'ENTER EPIC NO.',
                              prefixIcon: const Icon(Icons.person, color: Color(0xFF003366)),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Colors.grey),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: const BorderSide(color: Color(0xFF003366), width: 2),
                              ),
                              filled: true,
                              fillColor: Colors.grey[50],
                            ),
                          ),
                          const SizedBox(height: 24),
                          
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton(
                              onPressed: provider.isLoading ? null : _handleEpicCheck,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF003366),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: provider.isLoading
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
                                        'VERIFYING...',
                                        style: TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w900,
                                          letterSpacing: 2,
                                        ),
                                      ),
                                    ],
                                  )
                                : const Text(
                                    'AUTHENTICATE',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 2,
                                    ),
                                  ),
                            ),
                          ),
                          
                          if (provider.error != null) ...[
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.red[50],
                                border: Border.all(color: Colors.red),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.error, color: Colors.red, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      provider.error!,
                                      style: const TextStyle(
                                        color: Colors.red,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  void _handleEpicCheck() async {
    if (_epicController.text.trim().isEmpty) {
      _showError('Please enter EPIC Number');
      return;
    }

    final provider = context.read<ElectionProvider>();
    
    if (!provider.isElectionActive()) {
      _showError('Election is NOT Active. Please wait for the administrator to start polling.');
      return;
    }

    if (provider.hasVoted(_epicController.text.trim())) {
      _showError('You have already voted in this election.');
      return;
    }

    final success = await provider.verifyVoter(_epicController.text.trim());
    
    if (success && mounted) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const BiometricScreen(),
        ),
      );
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  void dispose() {
    _epicController.dispose();
    super.dispose();
  }
}