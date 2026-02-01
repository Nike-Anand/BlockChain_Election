import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/election_provider.dart';

class SuccessScreen extends StatelessWidget {
  final String voterName;
  final String voterId;
  final String partyName;

  const SuccessScreen({
    super.key,
    required this.voterName,
    required this.voterId,
    required this.partyName,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAFAFA),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Expanded(
                child: Center(
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
                          // Success Header
                          Container(
                            width: double.infinity,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Color(0xFFFF9933),
                              borderRadius: BorderRadius.only(
                                topLeft: Radius.circular(32),
                                topRight: Radius.circular(32),
                              ),
                            ),
                          ),
                          
                          Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              children: [
                                // TN Logo
                                Container(
                                  width: 80,
                                  height: 80,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(40),
                                    border: Border.all(
                                      color: const Color(0xFFFF9933),
                                      width: 4,
                                    ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.grey.withOpacity(0.3),
                                        blurRadius: 10,
                                        offset: const Offset(0, 4),
                                      ),
                                    ],
                                  ),
                                  child: const Icon(
                                    Icons.how_to_vote,
                                    color: Color(0xFF003366),
                                    size: 40,
                                  ),
                                ),
                                
                                const SizedBox(height: 24),
                                
                                // Success Message
                                const Text(
                                  'வாக்களித்ததிற்கு நன்றி',
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF003366),
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                                
                                const SizedBox(height: 8),
                                
                                const Text(
                                  'VOTE RECORDED SUCCESSFULLY',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFFF9933),
                                    letterSpacing: 2,
                                  ),
                                ),
                                
                                const SizedBox(height: 32),
                                
                                // Receipt Details
                                Container(
                                  padding: const EdgeInsets.all(24),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[50],
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(color: Colors.grey[200]!),
                                  ),
                                  child: Column(
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text(
                                            'DIGITAL AUDIT CERTIFICATE',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w900,
                                              color: Colors.grey,
                                              letterSpacing: 1,
                                            ),
                                          ),
                                          Container(
                                            width: 24,
                                            height: 24,
                                            decoration: BoxDecoration(
                                              color: Colors.green.withOpacity(0.1),
                                              shape: BoxShape.circle,
                                            ),
                                            child: const Icon(
                                              Icons.check,
                                              color: Colors.green,
                                              size: 16,
                                            ),
                                          ),
                                        ],
                                      ),
                                      
                                      const SizedBox(height: 20),
                                      
                                      _buildReceiptRow('Voter Identity', voterName),
                                      const SizedBox(height: 12),
                                      _buildReceiptRow('EPIC Reference', voterId),
                                      const SizedBox(height: 12),
                                      _buildReceiptRow('Selected Party', partyName),
                                      const SizedBox(height: 12),
                                      
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'TRANSACTION HASH',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w900,
                                              color: Colors.grey,
                                              letterSpacing: 1,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Container(
                                            width: double.infinity,
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: Colors.white,
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(color: Colors.grey[300]!),
                                            ),
                                            child: Consumer<ElectionProvider>(
                                              builder: (context, provider, child) {
                                                final vote = provider.votes.firstWhere(
                                                  (v) => v['userId'] == voterId,
                                                  orElse: () => {'hash': 'Processing...'},
                                                );
                                                return Text(
                                                  vote['hash'] ?? 'Processing...',
                                                  style: const TextStyle(
                                                    fontSize: 10,
                                                    fontFamily: 'monospace',
                                                    color: Color(0xFFFF9933),
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        ],
                                      ),
                                      
                                      const SizedBox(height: 16),
                                      
                                      Container(
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        decoration: BoxDecoration(
                                          border: Border(
                                            top: BorderSide(color: Colors.grey[300]!),
                                          ),
                                        ),
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            const Text(
                                              'TIMESTAMP',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w900,
                                                color: Colors.grey,
                                                letterSpacing: 1,
                                              ),
                                            ),
                                            Text(
                                              DateTime.now().toString().substring(0, 19),
                                              style: const TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF003366),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                
                                const SizedBox(height: 32),
                                
                                // Action Buttons
                                Column(
                                  children: [
                                    SizedBox(
                                      width: double.infinity,
                                      height: 56,
                                      child: ElevatedButton.icon(
                                        onPressed: () {
                                          // TODO: Implement PDF export
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(
                                              content: Text('PDF export feature coming soon'),
                                              backgroundColor: Colors.blue,
                                            ),
                                          );
                                        },
                                        icon: const Icon(Icons.download),
                                        label: const Text(
                                          'EXPORT AUDIT PDF',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 1,
                                          ),
                                        ),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF003366),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                        ),
                                      ),
                                    ),
                                    
                                    const SizedBox(height: 12),
                                    
                                    SizedBox(
                                      width: double.infinity,
                                      height: 48,
                                      child: OutlinedButton(
                                        onPressed: () {
                                          context.read<ElectionProvider>().logout();
                                          Navigator.popUntil(context, (route) => route.isFirst);
                                        },
                                        style: OutlinedButton.styleFrom(
                                          side: BorderSide(color: Colors.grey[300]!),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(16),
                                          ),
                                        ),
                                        child: const Text(
                                          'EXIT AUTHORIZED SESSION',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w900,
                                            letterSpacing: 1,
                                            color: Colors.grey,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildReceiptRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label.toUpperCase(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: Colors.grey,
            letterSpacing: 1,
          ),
        ),
        Flexible(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF003366),
            ),
            textAlign: TextAlign.right,
          ),
        ),
      ],
    );
  }
}