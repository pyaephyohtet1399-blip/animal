// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $HouseholdTable extends Household
    with TableInfo<$HouseholdTable, HouseholdData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $HouseholdTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _localRowIdMeta = const VerificationMeta(
    'localRowId',
  );
  @override
  late final GeneratedColumn<String> localRowId = GeneratedColumn<String>(
    'local_row_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _serverSurveyIdMeta = const VerificationMeta(
    'serverSurveyId',
  );
  @override
  late final GeneratedColumn<int> serverSurveyId = GeneratedColumn<int>(
    'server_survey_id',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _serverSyncVersionMeta = const VerificationMeta(
    'serverSyncVersion',
  );
  @override
  late final GeneratedColumn<int> serverSyncVersion = GeneratedColumn<int>(
    'server_sync_version',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _wvCodeMeta = const VerificationMeta('wvCode');
  @override
  late final GeneratedColumn<String> wvCode = GeneratedColumn<String>(
    'wv_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant(''),
  );
  static const VerificationMeta _houseNoMeta = const VerificationMeta(
    'houseNo',
  );
  @override
  late final GeneratedColumn<String> houseNo = GeneratedColumn<String>(
    'house_no',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _headNameMeta = const VerificationMeta(
    'headName',
  );
  @override
  late final GeneratedColumn<String> headName = GeneratedColumn<String>(
    'head_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _genderMeta = const VerificationMeta('gender');
  @override
  late final GeneratedColumn<String> gender = GeneratedColumn<String>(
    'gender',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _educationMeta = const VerificationMeta(
    'education',
  );
  @override
  late final GeneratedColumn<String> education = GeneratedColumn<String>(
    'education',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _phoneMeta = const VerificationMeta('phone');
  @override
  late final GeneratedColumn<String> phone = GeneratedColumn<String>(
    'phone',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _ageMeta = const VerificationMeta('age');
  @override
  late final GeneratedColumn<int> age = GeneratedColumn<int>(
    'age',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _answerDateMeta = const VerificationMeta(
    'answerDate',
  );
  @override
  late final GeneratedColumn<DateTime> answerDate = GeneratedColumn<DateTime>(
    'answer_date',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _deletedMeta = const VerificationMeta(
    'deleted',
  );
  @override
  late final GeneratedColumn<bool> deleted = GeneratedColumn<bool>(
    'deleted',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("deleted" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _dirtyMeta = const VerificationMeta('dirty');
  @override
  late final GeneratedColumn<bool> dirty = GeneratedColumn<bool>(
    'dirty',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("dirty" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    localRowId,
    serverSurveyId,
    serverSyncVersion,
    wvCode,
    houseNo,
    headName,
    gender,
    education,
    phone,
    age,
    answerDate,
    deleted,
    dirty,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'household';
  @override
  VerificationContext validateIntegrity(
    Insertable<HouseholdData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('local_row_id')) {
      context.handle(
        _localRowIdMeta,
        localRowId.isAcceptableOrUnknown(
          data['local_row_id']!,
          _localRowIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_localRowIdMeta);
    }
    if (data.containsKey('server_survey_id')) {
      context.handle(
        _serverSurveyIdMeta,
        serverSurveyId.isAcceptableOrUnknown(
          data['server_survey_id']!,
          _serverSurveyIdMeta,
        ),
      );
    }
    if (data.containsKey('server_sync_version')) {
      context.handle(
        _serverSyncVersionMeta,
        serverSyncVersion.isAcceptableOrUnknown(
          data['server_sync_version']!,
          _serverSyncVersionMeta,
        ),
      );
    }
    if (data.containsKey('wv_code')) {
      context.handle(
        _wvCodeMeta,
        wvCode.isAcceptableOrUnknown(data['wv_code']!, _wvCodeMeta),
      );
    }
    if (data.containsKey('house_no')) {
      context.handle(
        _houseNoMeta,
        houseNo.isAcceptableOrUnknown(data['house_no']!, _houseNoMeta),
      );
    }
    if (data.containsKey('head_name')) {
      context.handle(
        _headNameMeta,
        headName.isAcceptableOrUnknown(data['head_name']!, _headNameMeta),
      );
    } else if (isInserting) {
      context.missing(_headNameMeta);
    }
    if (data.containsKey('gender')) {
      context.handle(
        _genderMeta,
        gender.isAcceptableOrUnknown(data['gender']!, _genderMeta),
      );
    } else if (isInserting) {
      context.missing(_genderMeta);
    }
    if (data.containsKey('education')) {
      context.handle(
        _educationMeta,
        education.isAcceptableOrUnknown(data['education']!, _educationMeta),
      );
    } else if (isInserting) {
      context.missing(_educationMeta);
    }
    if (data.containsKey('phone')) {
      context.handle(
        _phoneMeta,
        phone.isAcceptableOrUnknown(data['phone']!, _phoneMeta),
      );
    } else if (isInserting) {
      context.missing(_phoneMeta);
    }
    if (data.containsKey('age')) {
      context.handle(
        _ageMeta,
        age.isAcceptableOrUnknown(data['age']!, _ageMeta),
      );
    } else if (isInserting) {
      context.missing(_ageMeta);
    }
    if (data.containsKey('answer_date')) {
      context.handle(
        _answerDateMeta,
        answerDate.isAcceptableOrUnknown(data['answer_date']!, _answerDateMeta),
      );
    } else if (isInserting) {
      context.missing(_answerDateMeta);
    }
    if (data.containsKey('deleted')) {
      context.handle(
        _deletedMeta,
        deleted.isAcceptableOrUnknown(data['deleted']!, _deletedMeta),
      );
    }
    if (data.containsKey('dirty')) {
      context.handle(
        _dirtyMeta,
        dirty.isAcceptableOrUnknown(data['dirty']!, _dirtyMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {localRowId};
  @override
  HouseholdData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return HouseholdData(
      localRowId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}local_row_id'],
      )!,
      serverSurveyId: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}server_survey_id'],
      ),
      serverSyncVersion: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}server_sync_version'],
      ),
      wvCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}wv_code'],
      )!,
      houseNo: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}house_no'],
      ),
      headName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}head_name'],
      )!,
      gender: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}gender'],
      )!,
      education: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}education'],
      )!,
      phone: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}phone'],
      )!,
      age: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}age'],
      )!,
      answerDate: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}answer_date'],
      )!,
      deleted: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}deleted'],
      )!,
      dirty: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}dirty'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $HouseholdTable createAlias(String alias) {
    return $HouseholdTable(attachedDatabase, alias);
  }
}

class HouseholdData extends DataClass implements Insertable<HouseholdData> {
  final String localRowId;
  final int? serverSurveyId;
  final int? serverSyncVersion;
  final String wvCode;
  final String? houseNo;
  final String headName;
  final String gender;
  final String education;
  final String phone;
  final int age;
  final DateTime answerDate;
  final bool deleted;
  final bool dirty;
  final DateTime createdAt;
  final DateTime updatedAt;
  const HouseholdData({
    required this.localRowId,
    this.serverSurveyId,
    this.serverSyncVersion,
    required this.wvCode,
    this.houseNo,
    required this.headName,
    required this.gender,
    required this.education,
    required this.phone,
    required this.age,
    required this.answerDate,
    required this.deleted,
    required this.dirty,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['local_row_id'] = Variable<String>(localRowId);
    if (!nullToAbsent || serverSurveyId != null) {
      map['server_survey_id'] = Variable<int>(serverSurveyId);
    }
    if (!nullToAbsent || serverSyncVersion != null) {
      map['server_sync_version'] = Variable<int>(serverSyncVersion);
    }
    map['wv_code'] = Variable<String>(wvCode);
    if (!nullToAbsent || houseNo != null) {
      map['house_no'] = Variable<String>(houseNo);
    }
    map['head_name'] = Variable<String>(headName);
    map['gender'] = Variable<String>(gender);
    map['education'] = Variable<String>(education);
    map['phone'] = Variable<String>(phone);
    map['age'] = Variable<int>(age);
    map['answer_date'] = Variable<DateTime>(answerDate);
    map['deleted'] = Variable<bool>(deleted);
    map['dirty'] = Variable<bool>(dirty);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  HouseholdCompanion toCompanion(bool nullToAbsent) {
    return HouseholdCompanion(
      localRowId: Value(localRowId),
      serverSurveyId: serverSurveyId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverSurveyId),
      serverSyncVersion: serverSyncVersion == null && nullToAbsent
          ? const Value.absent()
          : Value(serverSyncVersion),
      wvCode: Value(wvCode),
      houseNo: houseNo == null && nullToAbsent
          ? const Value.absent()
          : Value(houseNo),
      headName: Value(headName),
      gender: Value(gender),
      education: Value(education),
      phone: Value(phone),
      age: Value(age),
      answerDate: Value(answerDate),
      deleted: Value(deleted),
      dirty: Value(dirty),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory HouseholdData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return HouseholdData(
      localRowId: serializer.fromJson<String>(json['localRowId']),
      serverSurveyId: serializer.fromJson<int?>(json['serverSurveyId']),
      serverSyncVersion: serializer.fromJson<int?>(json['serverSyncVersion']),
      wvCode: serializer.fromJson<String>(json['wvCode']),
      houseNo: serializer.fromJson<String?>(json['houseNo']),
      headName: serializer.fromJson<String>(json['headName']),
      gender: serializer.fromJson<String>(json['gender']),
      education: serializer.fromJson<String>(json['education']),
      phone: serializer.fromJson<String>(json['phone']),
      age: serializer.fromJson<int>(json['age']),
      answerDate: serializer.fromJson<DateTime>(json['answerDate']),
      deleted: serializer.fromJson<bool>(json['deleted']),
      dirty: serializer.fromJson<bool>(json['dirty']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'localRowId': serializer.toJson<String>(localRowId),
      'serverSurveyId': serializer.toJson<int?>(serverSurveyId),
      'serverSyncVersion': serializer.toJson<int?>(serverSyncVersion),
      'wvCode': serializer.toJson<String>(wvCode),
      'houseNo': serializer.toJson<String?>(houseNo),
      'headName': serializer.toJson<String>(headName),
      'gender': serializer.toJson<String>(gender),
      'education': serializer.toJson<String>(education),
      'phone': serializer.toJson<String>(phone),
      'age': serializer.toJson<int>(age),
      'answerDate': serializer.toJson<DateTime>(answerDate),
      'deleted': serializer.toJson<bool>(deleted),
      'dirty': serializer.toJson<bool>(dirty),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  HouseholdData copyWith({
    String? localRowId,
    Value<int?> serverSurveyId = const Value.absent(),
    Value<int?> serverSyncVersion = const Value.absent(),
    String? wvCode,
    Value<String?> houseNo = const Value.absent(),
    String? headName,
    String? gender,
    String? education,
    String? phone,
    int? age,
    DateTime? answerDate,
    bool? deleted,
    bool? dirty,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => HouseholdData(
    localRowId: localRowId ?? this.localRowId,
    serverSurveyId: serverSurveyId.present
        ? serverSurveyId.value
        : this.serverSurveyId,
    serverSyncVersion: serverSyncVersion.present
        ? serverSyncVersion.value
        : this.serverSyncVersion,
    wvCode: wvCode ?? this.wvCode,
    houseNo: houseNo.present ? houseNo.value : this.houseNo,
    headName: headName ?? this.headName,
    gender: gender ?? this.gender,
    education: education ?? this.education,
    phone: phone ?? this.phone,
    age: age ?? this.age,
    answerDate: answerDate ?? this.answerDate,
    deleted: deleted ?? this.deleted,
    dirty: dirty ?? this.dirty,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  HouseholdData copyWithCompanion(HouseholdCompanion data) {
    return HouseholdData(
      localRowId: data.localRowId.present
          ? data.localRowId.value
          : this.localRowId,
      serverSurveyId: data.serverSurveyId.present
          ? data.serverSurveyId.value
          : this.serverSurveyId,
      serverSyncVersion: data.serverSyncVersion.present
          ? data.serverSyncVersion.value
          : this.serverSyncVersion,
      wvCode: data.wvCode.present ? data.wvCode.value : this.wvCode,
      houseNo: data.houseNo.present ? data.houseNo.value : this.houseNo,
      headName: data.headName.present ? data.headName.value : this.headName,
      gender: data.gender.present ? data.gender.value : this.gender,
      education: data.education.present ? data.education.value : this.education,
      phone: data.phone.present ? data.phone.value : this.phone,
      age: data.age.present ? data.age.value : this.age,
      answerDate: data.answerDate.present
          ? data.answerDate.value
          : this.answerDate,
      deleted: data.deleted.present ? data.deleted.value : this.deleted,
      dirty: data.dirty.present ? data.dirty.value : this.dirty,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('HouseholdData(')
          ..write('localRowId: $localRowId, ')
          ..write('serverSurveyId: $serverSurveyId, ')
          ..write('serverSyncVersion: $serverSyncVersion, ')
          ..write('wvCode: $wvCode, ')
          ..write('houseNo: $houseNo, ')
          ..write('headName: $headName, ')
          ..write('gender: $gender, ')
          ..write('education: $education, ')
          ..write('phone: $phone, ')
          ..write('age: $age, ')
          ..write('answerDate: $answerDate, ')
          ..write('deleted: $deleted, ')
          ..write('dirty: $dirty, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    localRowId,
    serverSurveyId,
    serverSyncVersion,
    wvCode,
    houseNo,
    headName,
    gender,
    education,
    phone,
    age,
    answerDate,
    deleted,
    dirty,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is HouseholdData &&
          other.localRowId == this.localRowId &&
          other.serverSurveyId == this.serverSurveyId &&
          other.serverSyncVersion == this.serverSyncVersion &&
          other.wvCode == this.wvCode &&
          other.houseNo == this.houseNo &&
          other.headName == this.headName &&
          other.gender == this.gender &&
          other.education == this.education &&
          other.phone == this.phone &&
          other.age == this.age &&
          other.answerDate == this.answerDate &&
          other.deleted == this.deleted &&
          other.dirty == this.dirty &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class HouseholdCompanion extends UpdateCompanion<HouseholdData> {
  final Value<String> localRowId;
  final Value<int?> serverSurveyId;
  final Value<int?> serverSyncVersion;
  final Value<String> wvCode;
  final Value<String?> houseNo;
  final Value<String> headName;
  final Value<String> gender;
  final Value<String> education;
  final Value<String> phone;
  final Value<int> age;
  final Value<DateTime> answerDate;
  final Value<bool> deleted;
  final Value<bool> dirty;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const HouseholdCompanion({
    this.localRowId = const Value.absent(),
    this.serverSurveyId = const Value.absent(),
    this.serverSyncVersion = const Value.absent(),
    this.wvCode = const Value.absent(),
    this.houseNo = const Value.absent(),
    this.headName = const Value.absent(),
    this.gender = const Value.absent(),
    this.education = const Value.absent(),
    this.phone = const Value.absent(),
    this.age = const Value.absent(),
    this.answerDate = const Value.absent(),
    this.deleted = const Value.absent(),
    this.dirty = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  HouseholdCompanion.insert({
    required String localRowId,
    this.serverSurveyId = const Value.absent(),
    this.serverSyncVersion = const Value.absent(),
    this.wvCode = const Value.absent(),
    this.houseNo = const Value.absent(),
    required String headName,
    required String gender,
    required String education,
    required String phone,
    required int age,
    required DateTime answerDate,
    this.deleted = const Value.absent(),
    this.dirty = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : localRowId = Value(localRowId),
       headName = Value(headName),
       gender = Value(gender),
       education = Value(education),
       phone = Value(phone),
       age = Value(age),
       answerDate = Value(answerDate),
       createdAt = Value(createdAt),
       updatedAt = Value(updatedAt);
  static Insertable<HouseholdData> custom({
    Expression<String>? localRowId,
    Expression<int>? serverSurveyId,
    Expression<int>? serverSyncVersion,
    Expression<String>? wvCode,
    Expression<String>? houseNo,
    Expression<String>? headName,
    Expression<String>? gender,
    Expression<String>? education,
    Expression<String>? phone,
    Expression<int>? age,
    Expression<DateTime>? answerDate,
    Expression<bool>? deleted,
    Expression<bool>? dirty,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (localRowId != null) 'local_row_id': localRowId,
      if (serverSurveyId != null) 'server_survey_id': serverSurveyId,
      if (serverSyncVersion != null) 'server_sync_version': serverSyncVersion,
      if (wvCode != null) 'wv_code': wvCode,
      if (houseNo != null) 'house_no': houseNo,
      if (headName != null) 'head_name': headName,
      if (gender != null) 'gender': gender,
      if (education != null) 'education': education,
      if (phone != null) 'phone': phone,
      if (age != null) 'age': age,
      if (answerDate != null) 'answer_date': answerDate,
      if (deleted != null) 'deleted': deleted,
      if (dirty != null) 'dirty': dirty,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  HouseholdCompanion copyWith({
    Value<String>? localRowId,
    Value<int?>? serverSurveyId,
    Value<int?>? serverSyncVersion,
    Value<String>? wvCode,
    Value<String?>? houseNo,
    Value<String>? headName,
    Value<String>? gender,
    Value<String>? education,
    Value<String>? phone,
    Value<int>? age,
    Value<DateTime>? answerDate,
    Value<bool>? deleted,
    Value<bool>? dirty,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return HouseholdCompanion(
      localRowId: localRowId ?? this.localRowId,
      serverSurveyId: serverSurveyId ?? this.serverSurveyId,
      serverSyncVersion: serverSyncVersion ?? this.serverSyncVersion,
      wvCode: wvCode ?? this.wvCode,
      houseNo: houseNo ?? this.houseNo,
      headName: headName ?? this.headName,
      gender: gender ?? this.gender,
      education: education ?? this.education,
      phone: phone ?? this.phone,
      age: age ?? this.age,
      answerDate: answerDate ?? this.answerDate,
      deleted: deleted ?? this.deleted,
      dirty: dirty ?? this.dirty,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (localRowId.present) {
      map['local_row_id'] = Variable<String>(localRowId.value);
    }
    if (serverSurveyId.present) {
      map['server_survey_id'] = Variable<int>(serverSurveyId.value);
    }
    if (serverSyncVersion.present) {
      map['server_sync_version'] = Variable<int>(serverSyncVersion.value);
    }
    if (wvCode.present) {
      map['wv_code'] = Variable<String>(wvCode.value);
    }
    if (houseNo.present) {
      map['house_no'] = Variable<String>(houseNo.value);
    }
    if (headName.present) {
      map['head_name'] = Variable<String>(headName.value);
    }
    if (gender.present) {
      map['gender'] = Variable<String>(gender.value);
    }
    if (education.present) {
      map['education'] = Variable<String>(education.value);
    }
    if (phone.present) {
      map['phone'] = Variable<String>(phone.value);
    }
    if (age.present) {
      map['age'] = Variable<int>(age.value);
    }
    if (answerDate.present) {
      map['answer_date'] = Variable<DateTime>(answerDate.value);
    }
    if (deleted.present) {
      map['deleted'] = Variable<bool>(deleted.value);
    }
    if (dirty.present) {
      map['dirty'] = Variable<bool>(dirty.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('HouseholdCompanion(')
          ..write('localRowId: $localRowId, ')
          ..write('serverSurveyId: $serverSurveyId, ')
          ..write('serverSyncVersion: $serverSyncVersion, ')
          ..write('wvCode: $wvCode, ')
          ..write('houseNo: $houseNo, ')
          ..write('headName: $headName, ')
          ..write('gender: $gender, ')
          ..write('education: $education, ')
          ..write('phone: $phone, ')
          ..write('age: $age, ')
          ..write('answerDate: $answerDate, ')
          ..write('deleted: $deleted, ')
          ..write('dirty: $dirty, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $AnimalAnswerTable extends AnimalAnswer
    with TableInfo<$AnimalAnswerTable, AnimalAnswerData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $AnimalAnswerTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<int> id = GeneratedColumn<int>(
    'id',
    aliasedName,
    false,
    hasAutoIncrement: true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'PRIMARY KEY AUTOINCREMENT',
    ),
  );
  static const VerificationMeta _localRowIdMeta = const VerificationMeta(
    'localRowId',
  );
  @override
  late final GeneratedColumn<String> localRowId = GeneratedColumn<String>(
    'local_row_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES household (local_row_id) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _groupCodeMeta = const VerificationMeta(
    'groupCode',
  );
  @override
  late final GeneratedColumn<String> groupCode = GeneratedColumn<String>(
    'group_code',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _categoryIdMeta = const VerificationMeta(
    'categoryId',
  );
  @override
  late final GeneratedColumn<int> categoryId = GeneratedColumn<int>(
    'category_id',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _ageLimitMeta = const VerificationMeta(
    'ageLimit',
  );
  @override
  late final GeneratedColumn<String> ageLimit = GeneratedColumn<String>(
    'age_limit',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sexMeta = const VerificationMeta('sex');
  @override
  late final GeneratedColumn<String> sex = GeneratedColumn<String>(
    'sex',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _countMeta = const VerificationMeta('count');
  @override
  late final GeneratedColumn<int> count = GeneratedColumn<int>(
    'count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sortOrderMeta = const VerificationMeta(
    'sortOrder',
  );
  @override
  late final GeneratedColumn<int> sortOrder = GeneratedColumn<int>(
    'sort_order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    localRowId,
    groupCode,
    categoryId,
    ageLimit,
    sex,
    count,
    sortOrder,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'animal_answer';
  @override
  VerificationContext validateIntegrity(
    Insertable<AnimalAnswerData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    }
    if (data.containsKey('local_row_id')) {
      context.handle(
        _localRowIdMeta,
        localRowId.isAcceptableOrUnknown(
          data['local_row_id']!,
          _localRowIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_localRowIdMeta);
    }
    if (data.containsKey('group_code')) {
      context.handle(
        _groupCodeMeta,
        groupCode.isAcceptableOrUnknown(data['group_code']!, _groupCodeMeta),
      );
    } else if (isInserting) {
      context.missing(_groupCodeMeta);
    }
    if (data.containsKey('category_id')) {
      context.handle(
        _categoryIdMeta,
        categoryId.isAcceptableOrUnknown(data['category_id']!, _categoryIdMeta),
      );
    } else if (isInserting) {
      context.missing(_categoryIdMeta);
    }
    if (data.containsKey('age_limit')) {
      context.handle(
        _ageLimitMeta,
        ageLimit.isAcceptableOrUnknown(data['age_limit']!, _ageLimitMeta),
      );
    } else if (isInserting) {
      context.missing(_ageLimitMeta);
    }
    if (data.containsKey('sex')) {
      context.handle(
        _sexMeta,
        sex.isAcceptableOrUnknown(data['sex']!, _sexMeta),
      );
    } else if (isInserting) {
      context.missing(_sexMeta);
    }
    if (data.containsKey('count')) {
      context.handle(
        _countMeta,
        count.isAcceptableOrUnknown(data['count']!, _countMeta),
      );
    } else if (isInserting) {
      context.missing(_countMeta);
    }
    if (data.containsKey('sort_order')) {
      context.handle(
        _sortOrderMeta,
        sortOrder.isAcceptableOrUnknown(data['sort_order']!, _sortOrderMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  AnimalAnswerData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return AnimalAnswerData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}id'],
      )!,
      localRowId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}local_row_id'],
      )!,
      groupCode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}group_code'],
      )!,
      categoryId: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}category_id'],
      )!,
      ageLimit: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}age_limit'],
      )!,
      sex: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}sex'],
      )!,
      count: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}count'],
      )!,
      sortOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}sort_order'],
      )!,
    );
  }

  @override
  $AnimalAnswerTable createAlias(String alias) {
    return $AnimalAnswerTable(attachedDatabase, alias);
  }
}

class AnimalAnswerData extends DataClass
    implements Insertable<AnimalAnswerData> {
  final int id;
  final String localRowId;
  final String groupCode;
  final int categoryId;
  final String ageLimit;
  final String sex;
  final int count;
  final int sortOrder;
  const AnimalAnswerData({
    required this.id,
    required this.localRowId,
    required this.groupCode,
    required this.categoryId,
    required this.ageLimit,
    required this.sex,
    required this.count,
    required this.sortOrder,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<int>(id);
    map['local_row_id'] = Variable<String>(localRowId);
    map['group_code'] = Variable<String>(groupCode);
    map['category_id'] = Variable<int>(categoryId);
    map['age_limit'] = Variable<String>(ageLimit);
    map['sex'] = Variable<String>(sex);
    map['count'] = Variable<int>(count);
    map['sort_order'] = Variable<int>(sortOrder);
    return map;
  }

  AnimalAnswerCompanion toCompanion(bool nullToAbsent) {
    return AnimalAnswerCompanion(
      id: Value(id),
      localRowId: Value(localRowId),
      groupCode: Value(groupCode),
      categoryId: Value(categoryId),
      ageLimit: Value(ageLimit),
      sex: Value(sex),
      count: Value(count),
      sortOrder: Value(sortOrder),
    );
  }

  factory AnimalAnswerData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return AnimalAnswerData(
      id: serializer.fromJson<int>(json['id']),
      localRowId: serializer.fromJson<String>(json['localRowId']),
      groupCode: serializer.fromJson<String>(json['groupCode']),
      categoryId: serializer.fromJson<int>(json['categoryId']),
      ageLimit: serializer.fromJson<String>(json['ageLimit']),
      sex: serializer.fromJson<String>(json['sex']),
      count: serializer.fromJson<int>(json['count']),
      sortOrder: serializer.fromJson<int>(json['sortOrder']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<int>(id),
      'localRowId': serializer.toJson<String>(localRowId),
      'groupCode': serializer.toJson<String>(groupCode),
      'categoryId': serializer.toJson<int>(categoryId),
      'ageLimit': serializer.toJson<String>(ageLimit),
      'sex': serializer.toJson<String>(sex),
      'count': serializer.toJson<int>(count),
      'sortOrder': serializer.toJson<int>(sortOrder),
    };
  }

  AnimalAnswerData copyWith({
    int? id,
    String? localRowId,
    String? groupCode,
    int? categoryId,
    String? ageLimit,
    String? sex,
    int? count,
    int? sortOrder,
  }) => AnimalAnswerData(
    id: id ?? this.id,
    localRowId: localRowId ?? this.localRowId,
    groupCode: groupCode ?? this.groupCode,
    categoryId: categoryId ?? this.categoryId,
    ageLimit: ageLimit ?? this.ageLimit,
    sex: sex ?? this.sex,
    count: count ?? this.count,
    sortOrder: sortOrder ?? this.sortOrder,
  );
  AnimalAnswerData copyWithCompanion(AnimalAnswerCompanion data) {
    return AnimalAnswerData(
      id: data.id.present ? data.id.value : this.id,
      localRowId: data.localRowId.present
          ? data.localRowId.value
          : this.localRowId,
      groupCode: data.groupCode.present ? data.groupCode.value : this.groupCode,
      categoryId: data.categoryId.present
          ? data.categoryId.value
          : this.categoryId,
      ageLimit: data.ageLimit.present ? data.ageLimit.value : this.ageLimit,
      sex: data.sex.present ? data.sex.value : this.sex,
      count: data.count.present ? data.count.value : this.count,
      sortOrder: data.sortOrder.present ? data.sortOrder.value : this.sortOrder,
    );
  }

  @override
  String toString() {
    return (StringBuffer('AnimalAnswerData(')
          ..write('id: $id, ')
          ..write('localRowId: $localRowId, ')
          ..write('groupCode: $groupCode, ')
          ..write('categoryId: $categoryId, ')
          ..write('ageLimit: $ageLimit, ')
          ..write('sex: $sex, ')
          ..write('count: $count, ')
          ..write('sortOrder: $sortOrder')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    localRowId,
    groupCode,
    categoryId,
    ageLimit,
    sex,
    count,
    sortOrder,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AnimalAnswerData &&
          other.id == this.id &&
          other.localRowId == this.localRowId &&
          other.groupCode == this.groupCode &&
          other.categoryId == this.categoryId &&
          other.ageLimit == this.ageLimit &&
          other.sex == this.sex &&
          other.count == this.count &&
          other.sortOrder == this.sortOrder);
}

class AnimalAnswerCompanion extends UpdateCompanion<AnimalAnswerData> {
  final Value<int> id;
  final Value<String> localRowId;
  final Value<String> groupCode;
  final Value<int> categoryId;
  final Value<String> ageLimit;
  final Value<String> sex;
  final Value<int> count;
  final Value<int> sortOrder;
  const AnimalAnswerCompanion({
    this.id = const Value.absent(),
    this.localRowId = const Value.absent(),
    this.groupCode = const Value.absent(),
    this.categoryId = const Value.absent(),
    this.ageLimit = const Value.absent(),
    this.sex = const Value.absent(),
    this.count = const Value.absent(),
    this.sortOrder = const Value.absent(),
  });
  AnimalAnswerCompanion.insert({
    this.id = const Value.absent(),
    required String localRowId,
    required String groupCode,
    required int categoryId,
    required String ageLimit,
    required String sex,
    required int count,
    this.sortOrder = const Value.absent(),
  }) : localRowId = Value(localRowId),
       groupCode = Value(groupCode),
       categoryId = Value(categoryId),
       ageLimit = Value(ageLimit),
       sex = Value(sex),
       count = Value(count);
  static Insertable<AnimalAnswerData> custom({
    Expression<int>? id,
    Expression<String>? localRowId,
    Expression<String>? groupCode,
    Expression<int>? categoryId,
    Expression<String>? ageLimit,
    Expression<String>? sex,
    Expression<int>? count,
    Expression<int>? sortOrder,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (localRowId != null) 'local_row_id': localRowId,
      if (groupCode != null) 'group_code': groupCode,
      if (categoryId != null) 'category_id': categoryId,
      if (ageLimit != null) 'age_limit': ageLimit,
      if (sex != null) 'sex': sex,
      if (count != null) 'count': count,
      if (sortOrder != null) 'sort_order': sortOrder,
    });
  }

  AnimalAnswerCompanion copyWith({
    Value<int>? id,
    Value<String>? localRowId,
    Value<String>? groupCode,
    Value<int>? categoryId,
    Value<String>? ageLimit,
    Value<String>? sex,
    Value<int>? count,
    Value<int>? sortOrder,
  }) {
    return AnimalAnswerCompanion(
      id: id ?? this.id,
      localRowId: localRowId ?? this.localRowId,
      groupCode: groupCode ?? this.groupCode,
      categoryId: categoryId ?? this.categoryId,
      ageLimit: ageLimit ?? this.ageLimit,
      sex: sex ?? this.sex,
      count: count ?? this.count,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<int>(id.value);
    }
    if (localRowId.present) {
      map['local_row_id'] = Variable<String>(localRowId.value);
    }
    if (groupCode.present) {
      map['group_code'] = Variable<String>(groupCode.value);
    }
    if (categoryId.present) {
      map['category_id'] = Variable<int>(categoryId.value);
    }
    if (ageLimit.present) {
      map['age_limit'] = Variable<String>(ageLimit.value);
    }
    if (sex.present) {
      map['sex'] = Variable<String>(sex.value);
    }
    if (count.present) {
      map['count'] = Variable<int>(count.value);
    }
    if (sortOrder.present) {
      map['sort_order'] = Variable<int>(sortOrder.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('AnimalAnswerCompanion(')
          ..write('id: $id, ')
          ..write('localRowId: $localRowId, ')
          ..write('groupCode: $groupCode, ')
          ..write('categoryId: $categoryId, ')
          ..write('ageLimit: $ageLimit, ')
          ..write('sex: $sex, ')
          ..write('count: $count, ')
          ..write('sortOrder: $sortOrder')
          ..write(')'))
        .toString();
  }
}

class $UploadLedgerTable extends UploadLedger
    with TableInfo<$UploadLedgerTable, UploadLedgerData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $UploadLedgerTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _contentHashMeta = const VerificationMeta(
    'contentHash',
  );
  @override
  late final GeneratedColumn<String> contentHash = GeneratedColumn<String>(
    'content_hash',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _attemptsMeta = const VerificationMeta(
    'attempts',
  );
  @override
  late final GeneratedColumn<int> attempts = GeneratedColumn<int>(
    'attempts',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _bytesMeta = const VerificationMeta('bytes');
  @override
  late final GeneratedColumn<int> bytes = GeneratedColumn<int>(
    'bytes',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _rowCountMeta = const VerificationMeta(
    'rowCount',
  );
  @override
  late final GeneratedColumn<int> rowCount = GeneratedColumn<int>(
    'row_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _responseJsonMeta = const VerificationMeta(
    'responseJson',
  );
  @override
  late final GeneratedColumn<String> responseJson = GeneratedColumn<String>(
    'response_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _errorJsonMeta = const VerificationMeta(
    'errorJson',
  );
  @override
  late final GeneratedColumn<String> errorJson = GeneratedColumn<String>(
    'error_json',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    contentHash,
    status,
    attempts,
    bytes,
    rowCount,
    responseJson,
    errorJson,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'upload_ledger';
  @override
  VerificationContext validateIntegrity(
    Insertable<UploadLedgerData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('content_hash')) {
      context.handle(
        _contentHashMeta,
        contentHash.isAcceptableOrUnknown(
          data['content_hash']!,
          _contentHashMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_contentHashMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('attempts')) {
      context.handle(
        _attemptsMeta,
        attempts.isAcceptableOrUnknown(data['attempts']!, _attemptsMeta),
      );
    }
    if (data.containsKey('bytes')) {
      context.handle(
        _bytesMeta,
        bytes.isAcceptableOrUnknown(data['bytes']!, _bytesMeta),
      );
    }
    if (data.containsKey('row_count')) {
      context.handle(
        _rowCountMeta,
        rowCount.isAcceptableOrUnknown(data['row_count']!, _rowCountMeta),
      );
    }
    if (data.containsKey('response_json')) {
      context.handle(
        _responseJsonMeta,
        responseJson.isAcceptableOrUnknown(
          data['response_json']!,
          _responseJsonMeta,
        ),
      );
    }
    if (data.containsKey('error_json')) {
      context.handle(
        _errorJsonMeta,
        errorJson.isAcceptableOrUnknown(data['error_json']!, _errorJsonMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    } else if (isInserting) {
      context.missing(_createdAtMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {contentHash};
  @override
  UploadLedgerData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return UploadLedgerData(
      contentHash: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}content_hash'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      attempts: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}attempts'],
      )!,
      bytes: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}bytes'],
      )!,
      rowCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}row_count'],
      )!,
      responseJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}response_json'],
      ),
      errorJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}error_json'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $UploadLedgerTable createAlias(String alias) {
    return $UploadLedgerTable(attachedDatabase, alias);
  }
}

class UploadLedgerData extends DataClass
    implements Insertable<UploadLedgerData> {
  final String contentHash;
  final String status;
  final int attempts;
  final int bytes;
  final int rowCount;
  final String? responseJson;
  final String? errorJson;
  final DateTime createdAt;
  final DateTime updatedAt;
  const UploadLedgerData({
    required this.contentHash,
    required this.status,
    required this.attempts,
    required this.bytes,
    required this.rowCount,
    this.responseJson,
    this.errorJson,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['content_hash'] = Variable<String>(contentHash);
    map['status'] = Variable<String>(status);
    map['attempts'] = Variable<int>(attempts);
    map['bytes'] = Variable<int>(bytes);
    map['row_count'] = Variable<int>(rowCount);
    if (!nullToAbsent || responseJson != null) {
      map['response_json'] = Variable<String>(responseJson);
    }
    if (!nullToAbsent || errorJson != null) {
      map['error_json'] = Variable<String>(errorJson);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  UploadLedgerCompanion toCompanion(bool nullToAbsent) {
    return UploadLedgerCompanion(
      contentHash: Value(contentHash),
      status: Value(status),
      attempts: Value(attempts),
      bytes: Value(bytes),
      rowCount: Value(rowCount),
      responseJson: responseJson == null && nullToAbsent
          ? const Value.absent()
          : Value(responseJson),
      errorJson: errorJson == null && nullToAbsent
          ? const Value.absent()
          : Value(errorJson),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory UploadLedgerData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return UploadLedgerData(
      contentHash: serializer.fromJson<String>(json['contentHash']),
      status: serializer.fromJson<String>(json['status']),
      attempts: serializer.fromJson<int>(json['attempts']),
      bytes: serializer.fromJson<int>(json['bytes']),
      rowCount: serializer.fromJson<int>(json['rowCount']),
      responseJson: serializer.fromJson<String?>(json['responseJson']),
      errorJson: serializer.fromJson<String?>(json['errorJson']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'contentHash': serializer.toJson<String>(contentHash),
      'status': serializer.toJson<String>(status),
      'attempts': serializer.toJson<int>(attempts),
      'bytes': serializer.toJson<int>(bytes),
      'rowCount': serializer.toJson<int>(rowCount),
      'responseJson': serializer.toJson<String?>(responseJson),
      'errorJson': serializer.toJson<String?>(errorJson),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  UploadLedgerData copyWith({
    String? contentHash,
    String? status,
    int? attempts,
    int? bytes,
    int? rowCount,
    Value<String?> responseJson = const Value.absent(),
    Value<String?> errorJson = const Value.absent(),
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => UploadLedgerData(
    contentHash: contentHash ?? this.contentHash,
    status: status ?? this.status,
    attempts: attempts ?? this.attempts,
    bytes: bytes ?? this.bytes,
    rowCount: rowCount ?? this.rowCount,
    responseJson: responseJson.present ? responseJson.value : this.responseJson,
    errorJson: errorJson.present ? errorJson.value : this.errorJson,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  UploadLedgerData copyWithCompanion(UploadLedgerCompanion data) {
    return UploadLedgerData(
      contentHash: data.contentHash.present
          ? data.contentHash.value
          : this.contentHash,
      status: data.status.present ? data.status.value : this.status,
      attempts: data.attempts.present ? data.attempts.value : this.attempts,
      bytes: data.bytes.present ? data.bytes.value : this.bytes,
      rowCount: data.rowCount.present ? data.rowCount.value : this.rowCount,
      responseJson: data.responseJson.present
          ? data.responseJson.value
          : this.responseJson,
      errorJson: data.errorJson.present ? data.errorJson.value : this.errorJson,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('UploadLedgerData(')
          ..write('contentHash: $contentHash, ')
          ..write('status: $status, ')
          ..write('attempts: $attempts, ')
          ..write('bytes: $bytes, ')
          ..write('rowCount: $rowCount, ')
          ..write('responseJson: $responseJson, ')
          ..write('errorJson: $errorJson, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    contentHash,
    status,
    attempts,
    bytes,
    rowCount,
    responseJson,
    errorJson,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is UploadLedgerData &&
          other.contentHash == this.contentHash &&
          other.status == this.status &&
          other.attempts == this.attempts &&
          other.bytes == this.bytes &&
          other.rowCount == this.rowCount &&
          other.responseJson == this.responseJson &&
          other.errorJson == this.errorJson &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class UploadLedgerCompanion extends UpdateCompanion<UploadLedgerData> {
  final Value<String> contentHash;
  final Value<String> status;
  final Value<int> attempts;
  final Value<int> bytes;
  final Value<int> rowCount;
  final Value<String?> responseJson;
  final Value<String?> errorJson;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const UploadLedgerCompanion({
    this.contentHash = const Value.absent(),
    this.status = const Value.absent(),
    this.attempts = const Value.absent(),
    this.bytes = const Value.absent(),
    this.rowCount = const Value.absent(),
    this.responseJson = const Value.absent(),
    this.errorJson = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  UploadLedgerCompanion.insert({
    required String contentHash,
    required String status,
    this.attempts = const Value.absent(),
    this.bytes = const Value.absent(),
    this.rowCount = const Value.absent(),
    this.responseJson = const Value.absent(),
    this.errorJson = const Value.absent(),
    required DateTime createdAt,
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : contentHash = Value(contentHash),
       status = Value(status),
       createdAt = Value(createdAt),
       updatedAt = Value(updatedAt);
  static Insertable<UploadLedgerData> custom({
    Expression<String>? contentHash,
    Expression<String>? status,
    Expression<int>? attempts,
    Expression<int>? bytes,
    Expression<int>? rowCount,
    Expression<String>? responseJson,
    Expression<String>? errorJson,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (contentHash != null) 'content_hash': contentHash,
      if (status != null) 'status': status,
      if (attempts != null) 'attempts': attempts,
      if (bytes != null) 'bytes': bytes,
      if (rowCount != null) 'row_count': rowCount,
      if (responseJson != null) 'response_json': responseJson,
      if (errorJson != null) 'error_json': errorJson,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  UploadLedgerCompanion copyWith({
    Value<String>? contentHash,
    Value<String>? status,
    Value<int>? attempts,
    Value<int>? bytes,
    Value<int>? rowCount,
    Value<String?>? responseJson,
    Value<String?>? errorJson,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return UploadLedgerCompanion(
      contentHash: contentHash ?? this.contentHash,
      status: status ?? this.status,
      attempts: attempts ?? this.attempts,
      bytes: bytes ?? this.bytes,
      rowCount: rowCount ?? this.rowCount,
      responseJson: responseJson ?? this.responseJson,
      errorJson: errorJson ?? this.errorJson,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (contentHash.present) {
      map['content_hash'] = Variable<String>(contentHash.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (attempts.present) {
      map['attempts'] = Variable<int>(attempts.value);
    }
    if (bytes.present) {
      map['bytes'] = Variable<int>(bytes.value);
    }
    if (rowCount.present) {
      map['row_count'] = Variable<int>(rowCount.value);
    }
    if (responseJson.present) {
      map['response_json'] = Variable<String>(responseJson.value);
    }
    if (errorJson.present) {
      map['error_json'] = Variable<String>(errorJson.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('UploadLedgerCompanion(')
          ..write('contentHash: $contentHash, ')
          ..write('status: $status, ')
          ..write('attempts: $attempts, ')
          ..write('bytes: $bytes, ')
          ..write('rowCount: $rowCount, ')
          ..write('responseJson: $responseJson, ')
          ..write('errorJson: $errorJson, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ReferenceCacheTable extends ReferenceCache
    with TableInfo<$ReferenceCacheTable, ReferenceCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ReferenceCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _cacheKeyMeta = const VerificationMeta(
    'cacheKey',
  );
  @override
  late final GeneratedColumn<String> cacheKey = GeneratedColumn<String>(
    'cache_key',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _fetchedAtMeta = const VerificationMeta(
    'fetchedAt',
  );
  @override
  late final GeneratedColumn<DateTime> fetchedAt = GeneratedColumn<DateTime>(
    'fetched_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [cacheKey, payload, fetchedAt];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'reference_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<ReferenceCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('cache_key')) {
      context.handle(
        _cacheKeyMeta,
        cacheKey.isAcceptableOrUnknown(data['cache_key']!, _cacheKeyMeta),
      );
    } else if (isInserting) {
      context.missing(_cacheKeyMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('fetched_at')) {
      context.handle(
        _fetchedAtMeta,
        fetchedAt.isAcceptableOrUnknown(data['fetched_at']!, _fetchedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_fetchedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {cacheKey};
  @override
  ReferenceCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ReferenceCacheData(
      cacheKey: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}cache_key'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
      fetchedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}fetched_at'],
      )!,
    );
  }

  @override
  $ReferenceCacheTable createAlias(String alias) {
    return $ReferenceCacheTable(attachedDatabase, alias);
  }
}

class ReferenceCacheData extends DataClass
    implements Insertable<ReferenceCacheData> {
  final String cacheKey;
  final String payload;
  final DateTime fetchedAt;
  const ReferenceCacheData({
    required this.cacheKey,
    required this.payload,
    required this.fetchedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['cache_key'] = Variable<String>(cacheKey);
    map['payload'] = Variable<String>(payload);
    map['fetched_at'] = Variable<DateTime>(fetchedAt);
    return map;
  }

  ReferenceCacheCompanion toCompanion(bool nullToAbsent) {
    return ReferenceCacheCompanion(
      cacheKey: Value(cacheKey),
      payload: Value(payload),
      fetchedAt: Value(fetchedAt),
    );
  }

  factory ReferenceCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ReferenceCacheData(
      cacheKey: serializer.fromJson<String>(json['cacheKey']),
      payload: serializer.fromJson<String>(json['payload']),
      fetchedAt: serializer.fromJson<DateTime>(json['fetchedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'cacheKey': serializer.toJson<String>(cacheKey),
      'payload': serializer.toJson<String>(payload),
      'fetchedAt': serializer.toJson<DateTime>(fetchedAt),
    };
  }

  ReferenceCacheData copyWith({
    String? cacheKey,
    String? payload,
    DateTime? fetchedAt,
  }) => ReferenceCacheData(
    cacheKey: cacheKey ?? this.cacheKey,
    payload: payload ?? this.payload,
    fetchedAt: fetchedAt ?? this.fetchedAt,
  );
  ReferenceCacheData copyWithCompanion(ReferenceCacheCompanion data) {
    return ReferenceCacheData(
      cacheKey: data.cacheKey.present ? data.cacheKey.value : this.cacheKey,
      payload: data.payload.present ? data.payload.value : this.payload,
      fetchedAt: data.fetchedAt.present ? data.fetchedAt.value : this.fetchedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ReferenceCacheData(')
          ..write('cacheKey: $cacheKey, ')
          ..write('payload: $payload, ')
          ..write('fetchedAt: $fetchedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(cacheKey, payload, fetchedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ReferenceCacheData &&
          other.cacheKey == this.cacheKey &&
          other.payload == this.payload &&
          other.fetchedAt == this.fetchedAt);
}

class ReferenceCacheCompanion extends UpdateCompanion<ReferenceCacheData> {
  final Value<String> cacheKey;
  final Value<String> payload;
  final Value<DateTime> fetchedAt;
  final Value<int> rowid;
  const ReferenceCacheCompanion({
    this.cacheKey = const Value.absent(),
    this.payload = const Value.absent(),
    this.fetchedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ReferenceCacheCompanion.insert({
    required String cacheKey,
    required String payload,
    required DateTime fetchedAt,
    this.rowid = const Value.absent(),
  }) : cacheKey = Value(cacheKey),
       payload = Value(payload),
       fetchedAt = Value(fetchedAt);
  static Insertable<ReferenceCacheData> custom({
    Expression<String>? cacheKey,
    Expression<String>? payload,
    Expression<DateTime>? fetchedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (cacheKey != null) 'cache_key': cacheKey,
      if (payload != null) 'payload': payload,
      if (fetchedAt != null) 'fetched_at': fetchedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ReferenceCacheCompanion copyWith({
    Value<String>? cacheKey,
    Value<String>? payload,
    Value<DateTime>? fetchedAt,
    Value<int>? rowid,
  }) {
    return ReferenceCacheCompanion(
      cacheKey: cacheKey ?? this.cacheKey,
      payload: payload ?? this.payload,
      fetchedAt: fetchedAt ?? this.fetchedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (cacheKey.present) {
      map['cache_key'] = Variable<String>(cacheKey.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (fetchedAt.present) {
      map['fetched_at'] = Variable<DateTime>(fetchedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ReferenceCacheCompanion(')
          ..write('cacheKey: $cacheKey, ')
          ..write('payload: $payload, ')
          ..write('fetchedAt: $fetchedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $HouseholdTable household = $HouseholdTable(this);
  late final $AnimalAnswerTable animalAnswer = $AnimalAnswerTable(this);
  late final $UploadLedgerTable uploadLedger = $UploadLedgerTable(this);
  late final $ReferenceCacheTable referenceCache = $ReferenceCacheTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    household,
    animalAnswer,
    uploadLedger,
    referenceCache,
  ];
  @override
  StreamQueryUpdateRules get streamUpdateRules => const StreamQueryUpdateRules([
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'household',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [TableUpdate('animal_answer', kind: UpdateKind.delete)],
    ),
  ]);
}

typedef $$HouseholdTableCreateCompanionBuilder =
    HouseholdCompanion Function({
      required String localRowId,
      Value<int?> serverSurveyId,
      Value<int?> serverSyncVersion,
      Value<String> wvCode,
      Value<String?> houseNo,
      required String headName,
      required String gender,
      required String education,
      required String phone,
      required int age,
      required DateTime answerDate,
      Value<bool> deleted,
      Value<bool> dirty,
      required DateTime createdAt,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$HouseholdTableUpdateCompanionBuilder =
    HouseholdCompanion Function({
      Value<String> localRowId,
      Value<int?> serverSurveyId,
      Value<int?> serverSyncVersion,
      Value<String> wvCode,
      Value<String?> houseNo,
      Value<String> headName,
      Value<String> gender,
      Value<String> education,
      Value<String> phone,
      Value<int> age,
      Value<DateTime> answerDate,
      Value<bool> deleted,
      Value<bool> dirty,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

final class $$HouseholdTableReferences
    extends BaseReferences<_$AppDatabase, $HouseholdTable, HouseholdData> {
  $$HouseholdTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static MultiTypedResultKey<$AnimalAnswerTable, List<AnimalAnswerData>>
  _animalAnswerRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.animalAnswer,
    aliasName: 'household__local_row_id__animal_answer__local_row_id',
  );

  $$AnimalAnswerTableProcessedTableManager get animalAnswerRefs {
    final manager = $$AnimalAnswerTableTableManager($_db, $_db.animalAnswer)
        .filter(
          (f) => f.localRowId.localRowId.sqlEquals(
            $_itemColumn<String>('local_row_id')!,
          ),
        );

    final cache = $_typedResult.readTableOrNull(_animalAnswerRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$HouseholdTableFilterComposer
    extends Composer<_$AppDatabase, $HouseholdTable> {
  $$HouseholdTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get localRowId => $composableBuilder(
    column: $table.localRowId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get serverSurveyId => $composableBuilder(
    column: $table.serverSurveyId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get serverSyncVersion => $composableBuilder(
    column: $table.serverSyncVersion,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get wvCode => $composableBuilder(
    column: $table.wvCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get houseNo => $composableBuilder(
    column: $table.houseNo,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get headName => $composableBuilder(
    column: $table.headName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get gender => $composableBuilder(
    column: $table.gender,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get education => $composableBuilder(
    column: $table.education,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get age => $composableBuilder(
    column: $table.age,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get answerDate => $composableBuilder(
    column: $table.answerDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get deleted => $composableBuilder(
    column: $table.deleted,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get dirty => $composableBuilder(
    column: $table.dirty,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> animalAnswerRefs(
    Expression<bool> Function($$AnimalAnswerTableFilterComposer f) f,
  ) {
    final $$AnimalAnswerTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.localRowId,
      referencedTable: $db.animalAnswer,
      getReferencedColumn: (t) => t.localRowId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$AnimalAnswerTableFilterComposer(
            $db: $db,
            $table: $db.animalAnswer,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$HouseholdTableOrderingComposer
    extends Composer<_$AppDatabase, $HouseholdTable> {
  $$HouseholdTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get localRowId => $composableBuilder(
    column: $table.localRowId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get serverSurveyId => $composableBuilder(
    column: $table.serverSurveyId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get serverSyncVersion => $composableBuilder(
    column: $table.serverSyncVersion,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get wvCode => $composableBuilder(
    column: $table.wvCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get houseNo => $composableBuilder(
    column: $table.houseNo,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get headName => $composableBuilder(
    column: $table.headName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get gender => $composableBuilder(
    column: $table.gender,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get education => $composableBuilder(
    column: $table.education,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get phone => $composableBuilder(
    column: $table.phone,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get age => $composableBuilder(
    column: $table.age,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get answerDate => $composableBuilder(
    column: $table.answerDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get deleted => $composableBuilder(
    column: $table.deleted,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get dirty => $composableBuilder(
    column: $table.dirty,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$HouseholdTableAnnotationComposer
    extends Composer<_$AppDatabase, $HouseholdTable> {
  $$HouseholdTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get localRowId => $composableBuilder(
    column: $table.localRowId,
    builder: (column) => column,
  );

  GeneratedColumn<int> get serverSurveyId => $composableBuilder(
    column: $table.serverSurveyId,
    builder: (column) => column,
  );

  GeneratedColumn<int> get serverSyncVersion => $composableBuilder(
    column: $table.serverSyncVersion,
    builder: (column) => column,
  );

  GeneratedColumn<String> get wvCode =>
      $composableBuilder(column: $table.wvCode, builder: (column) => column);

  GeneratedColumn<String> get houseNo =>
      $composableBuilder(column: $table.houseNo, builder: (column) => column);

  GeneratedColumn<String> get headName =>
      $composableBuilder(column: $table.headName, builder: (column) => column);

  GeneratedColumn<String> get gender =>
      $composableBuilder(column: $table.gender, builder: (column) => column);

  GeneratedColumn<String> get education =>
      $composableBuilder(column: $table.education, builder: (column) => column);

  GeneratedColumn<String> get phone =>
      $composableBuilder(column: $table.phone, builder: (column) => column);

  GeneratedColumn<int> get age =>
      $composableBuilder(column: $table.age, builder: (column) => column);

  GeneratedColumn<DateTime> get answerDate => $composableBuilder(
    column: $table.answerDate,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get deleted =>
      $composableBuilder(column: $table.deleted, builder: (column) => column);

  GeneratedColumn<bool> get dirty =>
      $composableBuilder(column: $table.dirty, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  Expression<T> animalAnswerRefs<T extends Object>(
    Expression<T> Function($$AnimalAnswerTableAnnotationComposer a) f,
  ) {
    final $$AnimalAnswerTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.localRowId,
      referencedTable: $db.animalAnswer,
      getReferencedColumn: (t) => t.localRowId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$AnimalAnswerTableAnnotationComposer(
            $db: $db,
            $table: $db.animalAnswer,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$HouseholdTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $HouseholdTable,
          HouseholdData,
          $$HouseholdTableFilterComposer,
          $$HouseholdTableOrderingComposer,
          $$HouseholdTableAnnotationComposer,
          $$HouseholdTableCreateCompanionBuilder,
          $$HouseholdTableUpdateCompanionBuilder,
          (HouseholdData, $$HouseholdTableReferences),
          HouseholdData,
          PrefetchHooks Function({bool animalAnswerRefs})
        > {
  $$HouseholdTableTableManager(_$AppDatabase db, $HouseholdTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$HouseholdTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$HouseholdTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$HouseholdTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> localRowId = const Value.absent(),
                Value<int?> serverSurveyId = const Value.absent(),
                Value<int?> serverSyncVersion = const Value.absent(),
                Value<String> wvCode = const Value.absent(),
                Value<String?> houseNo = const Value.absent(),
                Value<String> headName = const Value.absent(),
                Value<String> gender = const Value.absent(),
                Value<String> education = const Value.absent(),
                Value<String> phone = const Value.absent(),
                Value<int> age = const Value.absent(),
                Value<DateTime> answerDate = const Value.absent(),
                Value<bool> deleted = const Value.absent(),
                Value<bool> dirty = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => HouseholdCompanion(
                localRowId: localRowId,
                serverSurveyId: serverSurveyId,
                serverSyncVersion: serverSyncVersion,
                wvCode: wvCode,
                houseNo: houseNo,
                headName: headName,
                gender: gender,
                education: education,
                phone: phone,
                age: age,
                answerDate: answerDate,
                deleted: deleted,
                dirty: dirty,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String localRowId,
                Value<int?> serverSurveyId = const Value.absent(),
                Value<int?> serverSyncVersion = const Value.absent(),
                Value<String> wvCode = const Value.absent(),
                Value<String?> houseNo = const Value.absent(),
                required String headName,
                required String gender,
                required String education,
                required String phone,
                required int age,
                required DateTime answerDate,
                Value<bool> deleted = const Value.absent(),
                Value<bool> dirty = const Value.absent(),
                required DateTime createdAt,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => HouseholdCompanion.insert(
                localRowId: localRowId,
                serverSurveyId: serverSurveyId,
                serverSyncVersion: serverSyncVersion,
                wvCode: wvCode,
                houseNo: houseNo,
                headName: headName,
                gender: gender,
                education: education,
                phone: phone,
                age: age,
                answerDate: answerDate,
                deleted: deleted,
                dirty: dirty,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$HouseholdTable, HouseholdData>(table),
                  $$HouseholdTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({animalAnswerRefs = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [if (animalAnswerRefs) db.animalAnswer],
              addJoins: null,
              getPrefetchedDataCallback: (items) async {
                return [
                  if (animalAnswerRefs)
                    await $_getPrefetchedData<
                      HouseholdData,
                      $HouseholdTable,
                      AnimalAnswerData
                    >(
                      currentTable: table,
                      referencedTable: $$HouseholdTableReferences
                          ._animalAnswerRefsTable(db),
                      managerFromTypedResult: (p0) =>
                          $$HouseholdTableReferences(
                            db,
                            table,
                            p0,
                          ).animalAnswerRefs,
                      referencedItemsForCurrentItem: (item, referencedItems) =>
                          referencedItems.where(
                            (e) => e.localRowId == item.localRowId,
                          ),
                      typedResults: items,
                    ),
                ];
              },
            );
          },
        ),
      );
}

typedef $$HouseholdTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $HouseholdTable,
      HouseholdData,
      $$HouseholdTableFilterComposer,
      $$HouseholdTableOrderingComposer,
      $$HouseholdTableAnnotationComposer,
      $$HouseholdTableCreateCompanionBuilder,
      $$HouseholdTableUpdateCompanionBuilder,
      (HouseholdData, $$HouseholdTableReferences),
      HouseholdData,
      PrefetchHooks Function({bool animalAnswerRefs})
    >;
typedef $$AnimalAnswerTableCreateCompanionBuilder =
    AnimalAnswerCompanion Function({
      Value<int> id,
      required String localRowId,
      required String groupCode,
      required int categoryId,
      required String ageLimit,
      required String sex,
      required int count,
      Value<int> sortOrder,
    });
typedef $$AnimalAnswerTableUpdateCompanionBuilder =
    AnimalAnswerCompanion Function({
      Value<int> id,
      Value<String> localRowId,
      Value<String> groupCode,
      Value<int> categoryId,
      Value<String> ageLimit,
      Value<String> sex,
      Value<int> count,
      Value<int> sortOrder,
    });

final class $$AnimalAnswerTableReferences
    extends
        BaseReferences<_$AppDatabase, $AnimalAnswerTable, AnimalAnswerData> {
  $$AnimalAnswerTableReferences(super.$_db, super.$_table, super.$_typedResult);

  static $HouseholdTable _localRowIdTable(_$AppDatabase db) => db.household
      .createAlias('animal_answer__local_row_id__household__local_row_id');

  $$HouseholdTableProcessedTableManager get localRowId {
    final $_column = $_itemColumn<String>('local_row_id')!;

    final manager = $$HouseholdTableTableManager(
      $_db,
      $_db.household,
    ).filter((f) => f.localRowId.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_localRowIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$AnimalAnswerTableFilterComposer
    extends Composer<_$AppDatabase, $AnimalAnswerTable> {
  $$AnimalAnswerTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get groupCode => $composableBuilder(
    column: $table.groupCode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get categoryId => $composableBuilder(
    column: $table.categoryId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get ageLimit => $composableBuilder(
    column: $table.ageLimit,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sex => $composableBuilder(
    column: $table.sex,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get count => $composableBuilder(
    column: $table.count,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnFilters(column),
  );

  $$HouseholdTableFilterComposer get localRowId {
    final $$HouseholdTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.localRowId,
      referencedTable: $db.household,
      getReferencedColumn: (t) => t.localRowId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$HouseholdTableFilterComposer(
            $db: $db,
            $table: $db.household,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$AnimalAnswerTableOrderingComposer
    extends Composer<_$AppDatabase, $AnimalAnswerTable> {
  $$AnimalAnswerTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<int> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get groupCode => $composableBuilder(
    column: $table.groupCode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get categoryId => $composableBuilder(
    column: $table.categoryId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get ageLimit => $composableBuilder(
    column: $table.ageLimit,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sex => $composableBuilder(
    column: $table.sex,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get count => $composableBuilder(
    column: $table.count,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get sortOrder => $composableBuilder(
    column: $table.sortOrder,
    builder: (column) => ColumnOrderings(column),
  );

  $$HouseholdTableOrderingComposer get localRowId {
    final $$HouseholdTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.localRowId,
      referencedTable: $db.household,
      getReferencedColumn: (t) => t.localRowId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$HouseholdTableOrderingComposer(
            $db: $db,
            $table: $db.household,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$AnimalAnswerTableAnnotationComposer
    extends Composer<_$AppDatabase, $AnimalAnswerTable> {
  $$AnimalAnswerTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<int> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get groupCode =>
      $composableBuilder(column: $table.groupCode, builder: (column) => column);

  GeneratedColumn<int> get categoryId => $composableBuilder(
    column: $table.categoryId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get ageLimit =>
      $composableBuilder(column: $table.ageLimit, builder: (column) => column);

  GeneratedColumn<String> get sex =>
      $composableBuilder(column: $table.sex, builder: (column) => column);

  GeneratedColumn<int> get count =>
      $composableBuilder(column: $table.count, builder: (column) => column);

  GeneratedColumn<int> get sortOrder =>
      $composableBuilder(column: $table.sortOrder, builder: (column) => column);

  $$HouseholdTableAnnotationComposer get localRowId {
    final $$HouseholdTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.localRowId,
      referencedTable: $db.household,
      getReferencedColumn: (t) => t.localRowId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$HouseholdTableAnnotationComposer(
            $db: $db,
            $table: $db.household,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$AnimalAnswerTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $AnimalAnswerTable,
          AnimalAnswerData,
          $$AnimalAnswerTableFilterComposer,
          $$AnimalAnswerTableOrderingComposer,
          $$AnimalAnswerTableAnnotationComposer,
          $$AnimalAnswerTableCreateCompanionBuilder,
          $$AnimalAnswerTableUpdateCompanionBuilder,
          (AnimalAnswerData, $$AnimalAnswerTableReferences),
          AnimalAnswerData,
          PrefetchHooks Function({bool localRowId})
        > {
  $$AnimalAnswerTableTableManager(_$AppDatabase db, $AnimalAnswerTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$AnimalAnswerTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$AnimalAnswerTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$AnimalAnswerTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                Value<String> localRowId = const Value.absent(),
                Value<String> groupCode = const Value.absent(),
                Value<int> categoryId = const Value.absent(),
                Value<String> ageLimit = const Value.absent(),
                Value<String> sex = const Value.absent(),
                Value<int> count = const Value.absent(),
                Value<int> sortOrder = const Value.absent(),
              }) => AnimalAnswerCompanion(
                id: id,
                localRowId: localRowId,
                groupCode: groupCode,
                categoryId: categoryId,
                ageLimit: ageLimit,
                sex: sex,
                count: count,
                sortOrder: sortOrder,
              ),
          createCompanionCallback:
              ({
                Value<int> id = const Value.absent(),
                required String localRowId,
                required String groupCode,
                required int categoryId,
                required String ageLimit,
                required String sex,
                required int count,
                Value<int> sortOrder = const Value.absent(),
              }) => AnimalAnswerCompanion.insert(
                id: id,
                localRowId: localRowId,
                groupCode: groupCode,
                categoryId: categoryId,
                ageLimit: ageLimit,
                sex: sex,
                count: count,
                sortOrder: sortOrder,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$AnimalAnswerTable, AnimalAnswerData>(table),
                  $$AnimalAnswerTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({localRowId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (localRowId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.localRowId,
                                referencedTable: $$AnimalAnswerTableReferences
                                    ._localRowIdTable(db),
                                referencedColumn: $$AnimalAnswerTableReferences
                                    ._localRowIdTable(db)
                                    .localRowId,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$AnimalAnswerTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $AnimalAnswerTable,
      AnimalAnswerData,
      $$AnimalAnswerTableFilterComposer,
      $$AnimalAnswerTableOrderingComposer,
      $$AnimalAnswerTableAnnotationComposer,
      $$AnimalAnswerTableCreateCompanionBuilder,
      $$AnimalAnswerTableUpdateCompanionBuilder,
      (AnimalAnswerData, $$AnimalAnswerTableReferences),
      AnimalAnswerData,
      PrefetchHooks Function({bool localRowId})
    >;
typedef $$UploadLedgerTableCreateCompanionBuilder =
    UploadLedgerCompanion Function({
      required String contentHash,
      required String status,
      Value<int> attempts,
      Value<int> bytes,
      Value<int> rowCount,
      Value<String?> responseJson,
      Value<String?> errorJson,
      required DateTime createdAt,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$UploadLedgerTableUpdateCompanionBuilder =
    UploadLedgerCompanion Function({
      Value<String> contentHash,
      Value<String> status,
      Value<int> attempts,
      Value<int> bytes,
      Value<int> rowCount,
      Value<String?> responseJson,
      Value<String?> errorJson,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$UploadLedgerTableFilterComposer
    extends Composer<_$AppDatabase, $UploadLedgerTable> {
  $$UploadLedgerTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get contentHash => $composableBuilder(
    column: $table.contentHash,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get attempts => $composableBuilder(
    column: $table.attempts,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get bytes => $composableBuilder(
    column: $table.bytes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get rowCount => $composableBuilder(
    column: $table.rowCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get responseJson => $composableBuilder(
    column: $table.responseJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get errorJson => $composableBuilder(
    column: $table.errorJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$UploadLedgerTableOrderingComposer
    extends Composer<_$AppDatabase, $UploadLedgerTable> {
  $$UploadLedgerTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get contentHash => $composableBuilder(
    column: $table.contentHash,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get attempts => $composableBuilder(
    column: $table.attempts,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get bytes => $composableBuilder(
    column: $table.bytes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get rowCount => $composableBuilder(
    column: $table.rowCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get responseJson => $composableBuilder(
    column: $table.responseJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get errorJson => $composableBuilder(
    column: $table.errorJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$UploadLedgerTableAnnotationComposer
    extends Composer<_$AppDatabase, $UploadLedgerTable> {
  $$UploadLedgerTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get contentHash => $composableBuilder(
    column: $table.contentHash,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get attempts =>
      $composableBuilder(column: $table.attempts, builder: (column) => column);

  GeneratedColumn<int> get bytes =>
      $composableBuilder(column: $table.bytes, builder: (column) => column);

  GeneratedColumn<int> get rowCount =>
      $composableBuilder(column: $table.rowCount, builder: (column) => column);

  GeneratedColumn<String> get responseJson => $composableBuilder(
    column: $table.responseJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get errorJson =>
      $composableBuilder(column: $table.errorJson, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$UploadLedgerTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $UploadLedgerTable,
          UploadLedgerData,
          $$UploadLedgerTableFilterComposer,
          $$UploadLedgerTableOrderingComposer,
          $$UploadLedgerTableAnnotationComposer,
          $$UploadLedgerTableCreateCompanionBuilder,
          $$UploadLedgerTableUpdateCompanionBuilder,
          (
            UploadLedgerData,
            BaseReferences<_$AppDatabase, $UploadLedgerTable, UploadLedgerData>,
          ),
          UploadLedgerData,
          PrefetchHooks Function()
        > {
  $$UploadLedgerTableTableManager(_$AppDatabase db, $UploadLedgerTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$UploadLedgerTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$UploadLedgerTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$UploadLedgerTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> contentHash = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<int> attempts = const Value.absent(),
                Value<int> bytes = const Value.absent(),
                Value<int> rowCount = const Value.absent(),
                Value<String?> responseJson = const Value.absent(),
                Value<String?> errorJson = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => UploadLedgerCompanion(
                contentHash: contentHash,
                status: status,
                attempts: attempts,
                bytes: bytes,
                rowCount: rowCount,
                responseJson: responseJson,
                errorJson: errorJson,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String contentHash,
                required String status,
                Value<int> attempts = const Value.absent(),
                Value<int> bytes = const Value.absent(),
                Value<int> rowCount = const Value.absent(),
                Value<String?> responseJson = const Value.absent(),
                Value<String?> errorJson = const Value.absent(),
                required DateTime createdAt,
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => UploadLedgerCompanion.insert(
                contentHash: contentHash,
                status: status,
                attempts: attempts,
                bytes: bytes,
                rowCount: rowCount,
                responseJson: responseJson,
                errorJson: errorJson,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$UploadLedgerTable, UploadLedgerData>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $UploadLedgerTable,
                    UploadLedgerData
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$UploadLedgerTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $UploadLedgerTable,
      UploadLedgerData,
      $$UploadLedgerTableFilterComposer,
      $$UploadLedgerTableOrderingComposer,
      $$UploadLedgerTableAnnotationComposer,
      $$UploadLedgerTableCreateCompanionBuilder,
      $$UploadLedgerTableUpdateCompanionBuilder,
      (
        UploadLedgerData,
        BaseReferences<_$AppDatabase, $UploadLedgerTable, UploadLedgerData>,
      ),
      UploadLedgerData,
      PrefetchHooks Function()
    >;
typedef $$ReferenceCacheTableCreateCompanionBuilder =
    ReferenceCacheCompanion Function({
      required String cacheKey,
      required String payload,
      required DateTime fetchedAt,
      Value<int> rowid,
    });
typedef $$ReferenceCacheTableUpdateCompanionBuilder =
    ReferenceCacheCompanion Function({
      Value<String> cacheKey,
      Value<String> payload,
      Value<DateTime> fetchedAt,
      Value<int> rowid,
    });

class $$ReferenceCacheTableFilterComposer
    extends Composer<_$AppDatabase, $ReferenceCacheTable> {
  $$ReferenceCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get fetchedAt => $composableBuilder(
    column: $table.fetchedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ReferenceCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $ReferenceCacheTable> {
  $$ReferenceCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get cacheKey => $composableBuilder(
    column: $table.cacheKey,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get fetchedAt => $composableBuilder(
    column: $table.fetchedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ReferenceCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $ReferenceCacheTable> {
  $$ReferenceCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get cacheKey =>
      $composableBuilder(column: $table.cacheKey, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<DateTime> get fetchedAt =>
      $composableBuilder(column: $table.fetchedAt, builder: (column) => column);
}

class $$ReferenceCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ReferenceCacheTable,
          ReferenceCacheData,
          $$ReferenceCacheTableFilterComposer,
          $$ReferenceCacheTableOrderingComposer,
          $$ReferenceCacheTableAnnotationComposer,
          $$ReferenceCacheTableCreateCompanionBuilder,
          $$ReferenceCacheTableUpdateCompanionBuilder,
          (
            ReferenceCacheData,
            BaseReferences<
              _$AppDatabase,
              $ReferenceCacheTable,
              ReferenceCacheData
            >,
          ),
          ReferenceCacheData,
          PrefetchHooks Function()
        > {
  $$ReferenceCacheTableTableManager(
    _$AppDatabase db,
    $ReferenceCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ReferenceCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ReferenceCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ReferenceCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> cacheKey = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<DateTime> fetchedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ReferenceCacheCompanion(
                cacheKey: cacheKey,
                payload: payload,
                fetchedAt: fetchedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String cacheKey,
                required String payload,
                required DateTime fetchedAt,
                Value<int> rowid = const Value.absent(),
              }) => ReferenceCacheCompanion.insert(
                cacheKey: cacheKey,
                payload: payload,
                fetchedAt: fetchedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable<$ReferenceCacheTable, ReferenceCacheData>(table),
                  BaseReferences<
                    _$AppDatabase,
                    $ReferenceCacheTable,
                    ReferenceCacheData
                  >(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ReferenceCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ReferenceCacheTable,
      ReferenceCacheData,
      $$ReferenceCacheTableFilterComposer,
      $$ReferenceCacheTableOrderingComposer,
      $$ReferenceCacheTableAnnotationComposer,
      $$ReferenceCacheTableCreateCompanionBuilder,
      $$ReferenceCacheTableUpdateCompanionBuilder,
      (
        ReferenceCacheData,
        BaseReferences<_$AppDatabase, $ReferenceCacheTable, ReferenceCacheData>,
      ),
      ReferenceCacheData,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$HouseholdTableTableManager get household =>
      $$HouseholdTableTableManager(_db, _db.household);
  $$AnimalAnswerTableTableManager get animalAnswer =>
      $$AnimalAnswerTableTableManager(_db, _db.animalAnswer);
  $$UploadLedgerTableTableManager get uploadLedger =>
      $$UploadLedgerTableTableManager(_db, _db.uploadLedger);
  $$ReferenceCacheTableTableManager get referenceCache =>
      $$ReferenceCacheTableTableManager(_db, _db.referenceCache);
}
