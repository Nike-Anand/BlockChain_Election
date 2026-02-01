import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/election_provider.dart';

class AdminScreen extends StatefulWidget {
  final VoidCallback onBack;

  const AdminScreen({super.key, required this.onBack});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _adminLoginController = TextEditingController();
  final _adminPasswordController = TextEditingController();
  bool _isLoggedIn = false;

  // Party form controllers
  final _partyNameController = TextEditingController();
  final _partySymbolController = TextEditingController();
  final _partyDescController = TextEditingController();

  // Voter form controllers
  final _voterNameController = TextEditingController();
  final _voterIdController = TextEditingController();
  final _voterPasswordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLoggedIn) {
      return _buildLoginView();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF003366),
      appBar: AppBar(
        backgroundColor: const Color(0xFF003366),
        title: const Text('Admin Dashboard'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: widget.onBack,
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              setState(() => _isLoggedIn = false);
              widget.onBack();
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFFFF9933),
          labelColor: const Color(0xFFFF9933),
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'Parties'),
            Tab(text: 'Voters'),
            Tab(text: 'Settings'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPartiesTab(),
          _buildVotersTab(),
          _buildSettingsTab(),
        ],
      ),
    );
  }

  Widget _buildLoginView() {
    return Container(
      color: const Color(0xFFFAFAFA),
      child: Center(
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
                            Icons.admin_panel_settings,
                            color: Color(0xFF003366),
                            size: 40,
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'ADMIN OFFICE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 1,
                          ),
                        ),
                        const Text(
                          'நிர்வாக அணுகல்',
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
                  
                  Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      children: [
                        TextField(
                          controller: _adminLoginController,
                          decoration: InputDecoration(
                            labelText: 'Security ID',
                            prefixIcon: const Icon(Icons.person),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextField(
                          controller: _adminPasswordController,
                          obscureText: true,
                          decoration: InputDecoration(
                            labelText: 'Passcode',
                            prefixIcon: const Icon(Icons.lock),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        SizedBox(
                          width: double.infinity,
                          height: 56,
                          child: ElevatedButton(
                            onPressed: _handleAdminLogin,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF003366),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text(
                              'VAULT ENTRY',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 2,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: widget.onBack,
                          child: const Text('← Voter Portal Entry'),
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
    );
  }

  Widget _buildPartiesTab() {
    return Consumer<ElectionProvider>(
      builder: (context, provider, child) {
        return Container(
          color: Colors.white,
          child: Column(
            children: [
              // Add Party Form
              Container(
                padding: const EdgeInsets.all(16),
                color: Colors.grey[50],
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Add New Party',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF003366),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _partyNameController,
                            decoration: const InputDecoration(
                              labelText: 'Party Name',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _partySymbolController,
                            decoration: const InputDecoration(
                              labelText: 'Symbol',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _partyDescController,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: provider.isLoading ? null : _addParty,
                      child: provider.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Add Party'),
                    ),
                  ],
                ),
              ),
              
              // Parties List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.parties.length,
                  itemBuilder: (context, index) {
                    final party = provider.parties[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFF003366),
                          child: Text(
                            party['name'][0],
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(party['name']),
                        subtitle: Text('Symbol: ${party['symbol']}'),
                        trailing: Text('${party['votes']} votes'),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildVotersTab() {
    return Consumer<ElectionProvider>(
      builder: (context, provider, child) {
        return Container(
          color: Colors.white,
          child: Column(
            children: [
              // Add Voter Form
              Container(
                padding: const EdgeInsets.all(16),
                color: Colors.grey[50],
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Register New Voter',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF003366),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _voterNameController,
                      decoration: const InputDecoration(
                        labelText: 'Voter Name',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _voterIdController,
                            decoration: const InputDecoration(
                              labelText: 'Voter ID (EPIC)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _voterPasswordController,
                            decoration: const InputDecoration(
                              labelText: 'Password',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: provider.isLoading ? null : _registerVoter,
                      child: provider.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Text('Register Voter'),
                    ),
                  ],
                ),
              ),
              
              // Voters List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: provider.electionData?['users']?.length ?? 0,
                  itemBuilder: (context, index) {
                    final user = provider.electionData!['users'][index];
                    if (user['role'] != 'voter') return const SizedBox.shrink();
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: const Color(0xFF003366),
                          child: Text(
                            user['username'][0].toUpperCase(),
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(user['username']),
                        subtitle: Text('ID: ${user['voterId']}'),
                        trailing: provider.hasVoted(user['voterId'])
                          ? const Icon(Icons.check_circle, color: Colors.green)
                          : const Icon(Icons.pending, color: Colors.grey),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSettingsTab() {
    return Consumer<ElectionProvider>(
      builder: (context, provider, child) {
        return Container(
          color: Colors.white,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Election Settings',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF003366),
                ),
              ),
              const SizedBox(height: 24),
              
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Election Status'),
                          Switch(
                            value: provider.isElectionActive(),
                            onChanged: (value) {
                              // TODO: Implement settings update
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('Settings update feature coming soon'),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                      const Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Parties'),
                          Text('${provider.parties.length}'),
                        ],
                      ),
                      const Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Votes'),
                          Text('${provider.votes.length}'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _handleAdminLogin() {
    final provider = context.read<ElectionProvider>();
    final admin = provider.admin;
    
    if (_adminLoginController.text == admin['username'] && 
        _adminPasswordController.text == admin['password']) {
      setState(() => _isLoggedIn = true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Invalid admin credentials'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _addParty() async {
    if (_partyNameController.text.isEmpty || _partySymbolController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    final provider = context.read<ElectionProvider>();
    final success = await provider.addParty(
      name: _partyNameController.text,
      symbol: _partySymbolController.text,
      description: _partyDescController.text,
    );

    if (success) {
      _partyNameController.clear();
      _partySymbolController.clear();
      _partyDescController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Party added successfully')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Failed to add party')),
      );
    }
  }

  void _registerVoter() async {
    if (_voterNameController.text.isEmpty || 
        _voterIdController.text.isEmpty || 
        _voterPasswordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    final provider = context.read<ElectionProvider>();
    final success = await provider.registerVoter(
      username: _voterNameController.text,
      password: _voterPasswordController.text,
      voterId: _voterIdController.text,
    );

    if (success) {
      _voterNameController.clear();
      _voterIdController.clear();
      _voterPasswordController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Voter registered successfully')),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(provider.error ?? 'Failed to register voter')),
      );
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _adminLoginController.dispose();
    _adminPasswordController.dispose();
    _partyNameController.dispose();
    _partySymbolController.dispose();
    _partyDescController.dispose();
    _voterNameController.dispose();
    _voterIdController.dispose();
    _voterPasswordController.dispose();
    super.dispose();
  }
}