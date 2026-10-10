class AppConfig {
  AppConfig._();

  /// Android emulator reaches the host machine via 10.0.2.2.
  /// Real devices: `flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3100/api/v1`
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://192.168.1.4:3100/api/v1',
  );

  static const String appVersion = '1.0.0';
  static const String uploadFormat = 'animal-census/village-upload';
  static const int uploadFormatVersion = 1;

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 90);
  static const Duration refreshTimeout = Duration(seconds: 20);

  static const int maxAnimalCount = 99999;

  static const List<String> animalGroups = ['big', 'small', 'poultry', 'breeding'];
}
