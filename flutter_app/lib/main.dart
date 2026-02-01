import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/supabase_service.dart';
import 'screens/voter_landing_screen.dart';
import 'providers/election_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Supabase
  await SupabaseService.initialize();
  
  runApp(const VoterApp());
}

class VoterApp extends StatelessWidget {
  const VoterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => ElectionProvider(),
      child: MaterialApp(
        title: 'TN Election - Voter App',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          primaryColor: const Color(0xFF003366),
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF003366),
            secondary: const Color(0xFFFF9933),
          ),
          textTheme: GoogleFonts.interTextTheme(),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF003366),
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF003366),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          cardTheme: CardThemeData(
            elevation: 4,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
        ),
        home: const VoterLandingScreen(),
      ),
    );
  }
}