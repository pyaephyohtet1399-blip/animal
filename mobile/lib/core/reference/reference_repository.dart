import 'dart:convert';

import 'package:animalcensus/core/config/app_config.dart';
import 'package:animalcensus/core/db/app_database.dart';
import 'package:animalcensus/core/network/api_client.dart';

class CategoryOption {
  const CategoryOption({required this.categoryId, required this.name});

  final int categoryId;
  final String name;

  factory CategoryOption.fromJson(Map<String, dynamic> json) => CategoryOption(
        categoryId: (json['categoryId'] as num).toInt(),
        name: (json['name'] as String?) ?? '',
      );

  Map<String, dynamic> toJson() => {'categoryId': categoryId, 'name': name};
}

/// One location row that can be picked from a cached reference list by code.
abstract class LocationInfo {
  const LocationInfo();

  String get code;

  Map<String, dynamic> toJson();
}

class VillageInfo extends LocationInfo {
  const VillageInfo({required this.wvCode, required this.wvName});

  final String wvCode;
  final String wvName;

  @override
  String get code => wvCode;

  factory VillageInfo.fromJson(Map<String, dynamic> json) => VillageInfo(
        wvCode: (json['wvCode'] ?? '').toString(),
        wvName: (json['wvName'] ?? '').toString(),
      );

  @override
  Map<String, dynamic> toJson() => {'wvCode': wvCode, 'wvName': wvName};
}

class TownVillageInfo extends LocationInfo {
  const TownVillageInfo({
    required this.tvgCode,
    required this.tvgName,
    required this.tspCode,
  });

  final String tvgCode;
  final String tvgName;
  final String tspCode;

  @override
  String get code => tvgCode;

  factory TownVillageInfo.fromJson(Map<String, dynamic> json) => TownVillageInfo(
        tvgCode: (json['tvgCode'] ?? '').toString(),
        tvgName: (json['tvgName'] ?? '').toString(),
        tspCode: (json['tspCode'] ?? '').toString(),
      );

  @override
  Map<String, dynamic> toJson() => {
        'tvgCode': tvgCode,
        'tvgName': tvgName,
        'tspCode': tspCode,
      };
}

class TownshipInfo extends LocationInfo {
  const TownshipInfo({required this.tspCode, required this.tspName});

  final String tspCode;
  final String tspName;

  @override
  String get code => tspCode;

  factory TownshipInfo.fromJson(Map<String, dynamic> json) => TownshipInfo(
        tspCode: (json['tspCode'] ?? '').toString(),
        tspName: (json['tspName'] ?? '').toString(),
      );

  @override
  Map<String, dynamic> toJson() => {'tspCode': tspCode, 'tspName': tspName};
}

/// Locations and categories rarely change, so they live in a local cache and
/// are refreshed opportunistically. Offline the cached copy always wins.
class ReferenceRepository {
  ReferenceRepository({required this.api, required this.db});

  final ApiClient api;
  final AppDatabase db;

  static const Duration maxAge = Duration(hours: 6);
  static const String villageKey = 'village';
  static const String villageNamesKey = 'villagenames';
  static const String townVillageKey = 'townvillage';
  static const String townshipKey = 'township';

  String categoryKey(String group) => 'categories:$group';

  Future<List<CategoryOption>> categories(
    String group, {
    bool forceRefresh = false,
  }) async {
    final key = categoryKey(group);
    final cached = await db.reference(key);
    final now = DateTime.now();
    final fresh =
        cached != null && now.difference(cached.fetchedAt) < maxAge && !forceRefresh;
    if (fresh) return _decodeCategories(cached.payload);
    try {
      final body = await api.get('/categories/$group');
      final items = ApiClient.listData(body)
          .whereType<Map>()
          .map((item) => CategoryOption.fromJson(Map<String, dynamic>.from(item)))
          .toList();
      if (items.isNotEmpty) {
        await db.writeReference(
          key,
          jsonEncode(items.map((item) => item.toJson()).toList()),
        );
      }
      return items;
    } catch (error) {
      if (cached != null) return _decodeCategories(cached.payload);
      rethrow;
    }
  }

  Future<VillageInfo?> village({
    String? wvCode,
    bool forceRefresh = false,
  }) async {
    final info = await _pick<VillageInfo>(
      cacheKey: villageKey,
      endpoint: '/locations/wardvillages',
      fromJson: VillageInfo.fromJson,
      wantedCode: wvCode,
      forceRefresh: forceRefresh,
    );
    if (info != null) await _recordVillageName(info);
    return info;
  }

  Future<Map<String, String>> villageNames() async {
    final cached = await db.reference(villageNamesKey);
    if (cached == null) return const {};
    try {
      return (jsonDecode(cached.payload) as Map)
          .map((key, value) => MapEntry(key.toString(), value.toString()));
    } catch (_) {
      return const {};
    }
  }

  Future<void> _recordVillageName(VillageInfo info) async {
    if (info.wvCode.isEmpty || info.wvName.isEmpty) return;
    final names = Map<String, String>.from(await villageNames());
    if (names[info.wvCode] == info.wvName) return;
    names[info.wvCode] = info.wvName;
    await db.writeReference(villageNamesKey, jsonEncode(names));
  }

  Future<TownVillageInfo?> townVillage({
    String? tvgCode,
    bool forceRefresh = false,
  }) async {
    final wanted = tvgCode?.trim();
    if (wanted == null || wanted.isEmpty) return null;
    return _pick<TownVillageInfo>(
      cacheKey: townVillageKey,
      endpoint: '/locations/townvgs',
      fromJson: TownVillageInfo.fromJson,
      wantedCode: wanted,
      forceRefresh: forceRefresh,
    );
  }

  Future<TownshipInfo?> township({
    String? tspCode,
    bool forceRefresh = false,
  }) async {
    final wanted = tspCode?.trim();
    if (wanted == null || wanted.isEmpty) return null;
    return _pick<TownshipInfo>(
      cacheKey: townshipKey,
      endpoint: '/locations/townships',
      fromJson: TownshipInfo.fromJson,
      wantedCode: wanted,
      forceRefresh: forceRefresh,
    );
  }

  /// Picks one row by `wantedCode` out of a list endpoint, cached per key.
  ///
  /// A fresh cached row that matches wins; otherwise the list is fetched and
  /// the first match is stored. Offline the cached copy (even stale) is used;
  /// only a first-ever failure throws.
  Future<T?> _pick<T extends LocationInfo>({
    required String cacheKey,
    required String endpoint,
    required T Function(Map<String, dynamic> json) fromJson,
    String? wantedCode,
    bool forceRefresh = false,
  }) async {
    final wanted = wantedCode?.trim();
    final wantedKnown = wanted != null && wanted.isNotEmpty;

    final cached = await db.reference(cacheKey);
    final fresh = cached != null &&
        DateTime.now().difference(cached.fetchedAt) < maxAge &&
        !forceRefresh;
    T? cachedItem;
    if (cached != null) {
      cachedItem = fromJson(jsonDecode(cached.payload) as Map<String, dynamic>);
      final matches = !wantedKnown || cachedItem.code == wanted;
      if (fresh && matches) return cachedItem;
    }

    try {
      final body = await api.get(endpoint);
      T? match;
      for (final item in ApiClient.listData(body)
          .whereType<Map>()
          .map((row) => fromJson(Map<String, dynamic>.from(row)))) {
        if (!wantedKnown || item.code == wanted) {
          match = item;
          break;
        }
      }
      if (match != null) {
        await db.writeReference(cacheKey, jsonEncode(match.toJson()));
        return match;
      }
      return cachedItem;
    } catch (_) {
      if (cachedItem != null) return cachedItem;
      rethrow;
    }
  }

  /// Refreshes everything; individual failures stay silent so an offline app
  /// start is never blocked by reference data.
  Future<void> refreshAll({
    String? wvCode,
    String? tvgCode,
    String? tspCode,
  }) async {
    for (final group in AppConfig.animalGroups) {
      try {
        await categories(group, forceRefresh: true);
      } catch (_) {}
    }
    try {
      await village(wvCode: wvCode, forceRefresh: true);
    } catch (_) {}
    try {
      await townVillage(tvgCode: tvgCode, forceRefresh: true);
    } catch (_) {}
    try {
      await township(tspCode: tspCode, forceRefresh: true);
    } catch (_) {}
  }

  static List<CategoryOption> _decodeCategories(String payload) =>
      (jsonDecode(payload) as List)
          .whereType<Map>()
          .map((item) => CategoryOption.fromJson(Map<String, dynamic>.from(item)))
          .toList();
}
