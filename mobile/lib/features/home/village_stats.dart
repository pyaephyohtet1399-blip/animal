class VillageStats {
  const VillageStats({
    required this.activeHouseholds,
    required this.pendingUpload,
    required this.totalAnimals,
    this.lastUploadAt,
    this.lastUploadCount = 0,
  });

  final int activeHouseholds;
  final int pendingUpload;
  final int totalAnimals;
  final DateTime? lastUploadAt;
  final int lastUploadCount;
}
