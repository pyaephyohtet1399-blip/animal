import 'package:drift/drift.dart' show driftRuntimeOptions;
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:animalcensus/app_providers.dart';
import 'package:animalcensus/core/db/app_database.dart';
import 'package:animalcensus/features/households/household_form_screen.dart';

void main() {
  driftRuntimeOptions.dontWarnAboutMultipleDatabases = true;

  testWidgets('animal rows expose every label at phone width', (tester) async {
    await tester.binding.setSurfaceSize(const Size(360, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [appDatabaseProvider.overrideWithValue(AppDatabase.memory())],
        child: const MaterialApp(home: HouseholdFormScreen()),
      ),
    );
    await tester.pumpAndSettle();

    // MC1 (first ထည့်ရန်) — big animals have age + ca_male sex options.
    await tester.tap(find.text('ထည့်ရန်').first);
    await tester.pumpAndSettle();

    expect(find.text('အမျိုးအစား'), findsOneWidget);
    expect(find.text('အသက်အရွယ်'), findsOneWidget);
    expect(find.text('ကျား/မ'), findsOneWidget);
    expect(find.text('အရေအတွက်'), findsOneWidget);
    expect(find.byIcon(Icons.delete_outline), findsOneWidget);

    // MC4 (last ထည့်ရန်) — breeding has no age dropdown, sex takes the row.
    // Scroll until the MC4 section header is on screen, then add a row there.
    var scrolls = 0;
    while (find.text('MC4 မျိုးတိရစ္ဆာန်').evaluate().isEmpty && scrolls < 6) {
      await tester.drag(find.byType(Scrollable).first, const Offset(0, -500));
      await tester.pumpAndSettle();
      scrolls += 1;
    }
    expect(find.text('MC4 မျိုးတိရစ္ဆာန်'), findsOneWidget);
    await tester.tap(find.text('ထည့်ရန်').last);
    await tester.pumpAndSettle();
    expect(find.text('ကျား/မ'), findsNWidgets(2));
    // breeding တွင် အသက် dropdown မရှိ
    expect(find.text('အသက်အရွယ်'), findsOneWidget);

    // No RenderFlex overflow / layout exceptions on a 360px phone.
    expect(tester.takeException(), isNull);
  });

  testWidgets('empty category list shows a hint instead of a blank box',
      (tester) async {
    await tester.binding.setSurfaceSize(const Size(360, 800));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [appDatabaseProvider.overrideWithValue(AppDatabase.memory())],
        child: const MaterialApp(home: HouseholdFormScreen()),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('ထည့်ရန်').first);
    await tester.pumpAndSettle();

    expect(find.text('စာရင်း မရှိပါ'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
