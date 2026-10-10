import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/features/auth/login_screen.dart';
import 'package:animalcensus/features/households/household_form_screen.dart';
import 'package:animalcensus/features/households/household_list_screen.dart';
import 'package:animalcensus/features/settings/settings_screen.dart';
import 'package:animalcensus/features/upload/upload_screen.dart';
import 'package:animalcensus/features/home/home_screen.dart';

class AnimalCensusApp extends ConsumerStatefulWidget {
  const AnimalCensusApp({super.key});

  @override
  ConsumerState<AnimalCensusApp> createState() => _AnimalCensusAppState();
}

class _AnimalCensusAppState extends ConsumerState<AnimalCensusApp> {
  final GlobalKey<NavigatorState> _navKey = GlobalKey<NavigatorState>();
  StreamSubscription<void>? _expirySub;

  @override
  void initState() {
    super.initState();
    _expirySub = ref.read(sessionEventsProvider).expired.listen((_) {
      final state = _navKey.currentState;
      final ctx = state?.context;
      if (ctx != null && ctx.mounted) {
        ScaffoldMessenger.of(ctx).showSnackBar(
          const SnackBar(
            content: Text('အသုံးပြုခွင့် သက်တမ်းကုန်သွားပါပြီ — ပြန်လည် ဝင်ရောက်ပါ'),
          ),
        );
      }
      ref.read(authControllerProvider.notifier).signOut();
    });
    ref.read(authControllerProvider.notifier).restore();
  }

  @override
  void dispose() {
    _expirySub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);

    ref.listen(authControllerProvider, (previous, next) {
      if (previous?.signedIn == true && !next.signedIn) {
        _navKey.currentState?.popUntil((route) => route.isFirst);
      }
    });

    return MaterialApp(
      title: 'Animal Census',
      debugShowCheckedModeBanner: false,
      theme: buildAppTheme(),
      navigatorKey: _navKey,
      onGenerateRoute: (settings) {
        final name = settings.name ?? '/';
        switch (name) {
          case '/households':
            return MaterialPageRoute(builder: (_) => const HouseholdListScreen());
          case '/households/new':
            return MaterialPageRoute(builder: (_) => const HouseholdFormScreen());
          case '/households/edit':
            final id = (settings.arguments as String?) ?? '';
            return MaterialPageRoute(
              builder: (_) => HouseholdFormScreen(localRowId: id),
            );
          case '/upload':
            return MaterialPageRoute(builder: (_) => const UploadScreen());
          case '/settings':
            return MaterialPageRoute(builder: (_) => const SettingsScreen());
          default:
            return null;
        }
      },
      home: Builder(
        builder: (context) {
          if (auth.restoring) {
            return const _SplashScreen();
          }
          if (!auth.signedIn) {
            return const LoginScreen();
          }
          return const HomeScreen();
        },
      ),
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.pets, size: 64, color: Color(0xFF2E7D32)),
            SizedBox(height: 16),
            CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

ThemeData buildAppTheme() {
  const seed = Color(0xFF2E7D32);
  final scheme = ColorScheme.fromSeed(seedColor: seed);
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: const Color(0xFFF4F7F3),
    appBarTheme: AppBarTheme(
      backgroundColor: scheme.primary,
      foregroundColor: scheme.onPrimary,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Colors.white,
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      isDense: true,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFD5DDD3)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: Color(0xFFD5DDD3)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: scheme.primary, width: 1.6),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(52),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: Colors.white,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: Color(0xFFE4EAE2)),
      ),
    ),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
    dividerTheme: const DividerThemeData(color: Color(0xFFE4EAE2), space: 1),
  );
}
