import 'package:crypto/crypto.dart';

String sha256Hex(List<int> data) => sha256.convert(data).toString();
