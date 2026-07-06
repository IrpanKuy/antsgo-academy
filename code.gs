// =========================================================================
// CONFIGURATION
// =========================================================================
// Masukkan ID Google Spreadsheet Anda di sini. 
// Jika dikosongkan, script akan otomatis menggunakan spreadsheet tempat script ini terikat (Container-Bound).
var SPREADSHEET_ID = ""; 

// =========================================================================
// SCHEMA DEFINITIONS (15 TABLES)
// =========================================================================
var SCHEMAS = {
  "Users": ["user_id", "username", "password_hash", "role", "display_name", "linked_id", "status"],
  "Siswa": ["siswa_id", "nama", "tempat_lahir", "tanggal_lahir", "asal_sekolah", "nama_orang_tua", "alamat", "parent_email", "kelompok_id"],
  "KelompokBelajar": ["kelompok_id", "nama_kelompok", "tingkat", "keterangan"],
  "Pegawai": ["pegawai_id", "nama", "tempat_lahir", "tanggal_lahir", "alamat", "jabatan_id", "email", "gaji_per_sesi", "status"],
  "Jabatan": ["jabatan_id", "nama_jabatan", "keterangan"],
  "KonfigurasiAkademik": ["konfig_id", "tahun_ajaran", "semester", "status"],
  "Mapel": ["mapel_id", "nama_mapel", "keterangan"],
  "Jadwal": ["jadwal_id", "kelompok_id", "pegawai_id", "mapel_id", "hari", "jam_mulai", "jam_selesai", "ruangan"],
  "PresensiSiswa": ["presensi_siswa_id", "jadwal_id", "siswa_id", "tanggal", "status_kehadiran", "keterangan"],
  "PresensiPegawai": ["presensi_pegawai_id", "pegawai_id", "jadwal_id", "tanggal", "status_kehadiran", "keterangan"],
  "JurnalMengajar": ["jurnal_id", "jadwal_id", "tanggal", "pegawai_id", "materi_pembahasan", "catatan_evaluasi"],
  "RescheduleJadwal": ["reschedule_id", "jadwal_id", "tanggal_original", "tanggal_baru", "jam_mulai_baru", "jam_selesai_baru", "alasan", "status", "disetujui_oleh"],
  "PosBayar": ["pos_bayar_id", "nama_pos", "nominal_tarif", "siswa_id", "status_bayar", "keterangan"],
  "KeuanganTrans": ["transaksi_id", "tanggal", "tipe", "kategori", "nominal", "metode_pembayaran", "pos_bayar_id", "pegawai_id", "keterangan"],
  "Pengumuman": ["pengumuman_id", "judul", "konten", "target_role", "tanggal_kirim", "pembuat_id"]
};

// Prefix kode primary key untuk penomoran otomatis
var ID_PREFIXES = {
  "Users": "USR",
  "Siswa": "SSW",
  "KelompokBelajar": "KLM",
  "Pegawai": "PGW",
  "Jabatan": "JAB",
  "KonfigurasiAkademik": "KNF",
  "Mapel": "MPL",
  "Jadwal": "JDW",
  "PresensiSiswa": "PRS",
  "PresensiPegawai": "PRP",
  "JurnalMengajar": "JRN",
  "RescheduleJadwal": "RSC",
  "PosBayar": "POS",
  "KeuanganTrans": "TXN",
  "Pengumuman": "PGM"
};

// =========================================================================
// SHA-256 HASHING UTILITY
// =========================================================================
function hashSHA256(input) {
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  var hex = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byte = rawHash[i];
    if (byte < 0) byte += 256;
    var hexByte = byte.toString(16);
    if (hexByte.length === 1) hexByte = '0' + hexByte;
    hex += hexByte;
  }
  return hex;
}

// =========================================================================
// GOOGLE APPS SCRIPT WEB APP ENTRY POINTS (doGet & doPost API Router)
// =========================================================================

function doGet(e) {
  // Routing API untuk request GET (Read Data)
  if (e.parameter.action) {
    try {
      var action = e.parameter.action;
      var sheetName = e.parameter.sheet;
      
      if (action === "read") {
        if (!sheetName || !SCHEMAS[sheetName]) {
          return jsonResponse({ status: "error", message: "Nama sheet tidak valid" });
        }
        var data = getTableRows(sheetName);
        return jsonResponse({ status: "success", data: data });
      }
      
      return jsonResponse({ status: "error", message: "Aksi GET tidak dikenali" });
    } catch(err) {
      return jsonResponse({ status: "error", message: err.toString() });
    }
  }

  // Jika diakses langsung tanpa parameter API, serve UI Dashboard (index.html)
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('AntsGo Academy')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
  try {
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    var sheetName = requestData.sheet;
    var payload = requestData.data;

    // 1. Aksi Khusus: Autentikasi / Login
    if (action === "login") {
      var username = requestData.username;
      var password = requestData.password;
      var authResult = validateLogin(username, password);
      return jsonResponse(authResult);
    }

    // 2. Aksi Khusus: Setup Database
    if (action === "setup") {
      var setupResult = setupDatabase();
      return jsonResponse(setupResult);
    }

    // 2b. Aksi Khusus: Ganti Password Aman (server-side hash compare)
    if (action === "change_password") {
      var userId = requestData.user_id;
      var oldPasswordHash = requestData.old_password_hash;
      var newPasswordHash = requestData.new_password_hash;
      var newUsername = requestData.new_username;

      var users = getTableRows("Users");
      var targetUser = null;
      for (var i = 0; i < users.length; i++) {
        if (users[i].user_id === userId) {
          targetUser = users[i];
          break;
        }
      }
      if (!targetUser) {
        return jsonResponse({ status: "error", message: "User tidak ditemukan." });
      }
      if (targetUser.password_hash !== oldPasswordHash) {
        return jsonResponse({ status: "error", message: "Password lama yang Anda masukkan salah." });
      }

      var updatePayload = {
        user_id: userId,
        password_hash: newPasswordHash
      };
      if (newUsername && newUsername.trim() !== "") {
        updatePayload.username = newUsername;
      }
      updateTableRow("Users", "user_id", userId, updatePayload);
      return jsonResponse({ status: "success", message: "Password berhasil diubah." });
    }

    // Validasi standard sheet untuk CRUD
    if (!sheetName || !SCHEMAS[sheetName]) {
      return jsonResponse({ status: "error", message: "Nama sheet tidak terdaftar di skema" });
    }

    // 3. Routing Aksi CRUD Generik
    if (action === "create") {
      var usernameVal = payload.username;
      var passwordVal = payload.password;
      
      // Hapus virtual fields agar tidak ikut masuk ke sheet utama
      delete payload.username;
      delete payload.password;
      
      var newRecord = insertTableRow(sheetName, payload);
      
      // Jika Siswa atau Pegawai, buat akun user baru jika terisi
      if ((sheetName === "Siswa" || sheetName === "Pegawai") && usernameVal && passwordVal) {
        var userRole = "tentor";
        if (sheetName === "Siswa") {
          userRole = "parent";
        } else if (payload.jabatan_id === "JAB-001") {
          userRole = "pengelola";
        }
        
        var userPayload = {
          username: usernameVal,
          password_hash: hashSHA256(passwordVal),
          role: userRole,
          display_name: payload.nama || payload.nama_orang_tua || "User",
          linked_id: newRecord[SCHEMAS[sheetName][0]],
          status: "Aktif"
        };
        insertTableRow("Users", userPayload);
      }
      
      return jsonResponse({ status: "success", data: newRecord });
    }
    
    if (action === "update") {
      var idCol = SCHEMAS[sheetName][0]; // Kolom pertama selalu PK ID
      var idVal = payload[idCol];
      if (!idVal) {
        return jsonResponse({ status: "error", message: "Primary key ID tidak ditemukan dalam data update" });
      }
      
      var usernameVal = payload.username;
      var passwordVal = payload.password;
      
      // Hapus virtual fields agar tidak ikut masuk ke sheet utama
      delete payload.username;
      delete payload.password;
      
      updateTableRow(sheetName, idCol, idVal, payload);
      
      // Jika Siswa atau Pegawai, update akun user terkait
      if (sheetName === "Siswa" || sheetName === "Pegawai") {
        var users = getTableRows("Users");
        var userRecord = null;
        for (var i = 0; i < users.length; i++) {
          if (users[i].linked_id === idVal) {
            userRecord = users[i];
            break;
          }
        }
        
        if (userRecord) {
          var userUpdatePayload = {};
          if (usernameVal) userUpdatePayload.username = usernameVal;
          if (passwordVal && passwordVal.trim() !== "") userUpdatePayload.password_hash = hashSHA256(passwordVal);
          userUpdatePayload.display_name = payload.nama || payload.nama_orang_tua || userRecord.display_name;
          
          var userRole = "tentor";
          if (sheetName === "Siswa") {
            userRole = "parent";
          } else if (payload.jabatan_id === "JAB-001") {
            userRole = "pengelola";
          }
          userUpdatePayload.role = userRole;
          
          updateTableRow("Users", "user_id", userRecord.user_id, userUpdatePayload);
        } else if (usernameVal && passwordVal) {
          // Buat baru jika sebelumnya tidak ada akun
          var userRole = "tentor";
          if (sheetName === "Siswa") {
            userRole = "parent";
          } else if (payload.jabatan_id === "JAB-001") {
            userRole = "pengelola";
          }
          
          var userPayload = {
            username: usernameVal,
            password_hash: hashSHA256(passwordVal),
            role: userRole,
            display_name: payload.nama || payload.nama_orang_tua || "User",
            linked_id: idVal,
            status: "Aktif"
          };
          insertTableRow("Users", userPayload);
        }
      }
      
      return jsonResponse({ status: "success", message: "Data berhasil diperbarui" });
    }
    
    if (action === "delete") {
      var idCol = SCHEMAS[sheetName][0];
      var idVal = payload[idCol];
      if (!idVal) {
        return jsonResponse({ status: "error", message: "Primary key ID tidak ditemukan untuk dihapus" });
      }
      
      // Jika menghapus Siswa/Pegawai, hapus juga akun User terkait
      if (sheetName === "Siswa" || sheetName === "Pegawai") {
        var users = getTableRows("Users");
        for (var i = 0; i < users.length; i++) {
          if (users[i].linked_id === idVal) {
            deleteTableRow("Users", "user_id", users[i].user_id);
            break;
          }
        }
      }
      
      deleteTableRow(sheetName, idCol, idVal);
      return jsonResponse({ status: "success", message: "Data berhasil dihapus" });
    }

    return jsonResponse({ status: "error", message: "Aksi POST tidak dikenali" });

  } catch(err) {
    return jsonResponse({ status: "error", message: err.toString() });
  }
}

// Helper untuk format JSON Response & CORS bypass
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
}

// Helper untuk include file terpisah jika dibutuhkan template
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =========================================================================
// DATABASE CORE FUNCTIONS (Generic Spreadsheet ORM Engine)
// =========================================================================

// Mengambil Object Spreadsheet Aktif
function getDb() {
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Inisialisasi awal database (Membuat semua sheet & headers + seed data)
function setupDatabase() {
  try {
    var db = getDb();
    
    // Jalankan migrasi jika tabel PresensiPegawai masih berformat 5 kolom lama
    migratePresensiPegawaiSchema(db);
    
    var results = [];
    
    for (var sheetName in SCHEMAS) {
      var sheet = db.getSheetByName(sheetName);
      if (!sheet) {
        // Buat sheet jika belum ada
        sheet = db.insertSheet(sheetName);
        results.push("Tabel " + sheetName + " berhasil dibuat.");
      } else {
        results.push("Tabel " + sheetName + " sudah ada.");
      }
      
      // Tulis ulang headers di baris pertama
      var headers = SCHEMAS[sheetName];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }

    // Memasukkan Seed Data Default (Super Admin & Master Jabatan) jika tabel kosong
    seedDefaultData(db);

    // Jalankan fungsi rehash untuk mengamankan data sandi jika ada yang masih berupa plaintext
    rehashAllPlaintextPasswords();

    return { status: "success", details: results };
  } catch(err) {
    return { status: "error", message: err.toString() };
  }
}

// Utilitas khusus untuk memindai dan men-hash ulang sandi plaintext di sheet Users
function rehashAllPlaintextPasswords() {
  try {
    var db = getDb();
    var sheet = db.getSheetByName("Users");
    if (!sheet) return;
    
    var range = sheet.getDataRange();
    var values = range.getValues();
    if (values.length <= 1) return;
    
    var headers = values[0];
    var passIdx = headers.indexOf("password_hash");
    if (passIdx === -1) return;
    
    for (var i = 1; i < values.length; i++) {
      var rawPass = values[i][passIdx].toString().trim();
      // Jika berisi sandi polos (bukan format heksadesimal SHA-256 sepanjang 64 karakter)
      if (rawPass && rawPass.length !== 64) {
        var hashed = hashSHA256(rawPass);
        sheet.getRange(i + 1, passIdx + 1).setValue(hashed);
      }
    }
  } catch(e) {
    Logger.log("Gagal melakukan rehash password: " + e.toString());
  }
}

// Utilitas migrasi otomatis untuk menyisipkan kolom jadwal_id pada tabel PresensiPegawai jika bertipe lama (5 kolom)
function migratePresensiPegawaiSchema(db) {
  try {
    var sheet = db.getSheetByName("PresensiPegawai");
    if (!sheet) return;
    
    var range = sheet.getDataRange();
    var values = range.getValues();
    if (values.length <= 1) return; // Kosong / hanya header
    
    var oldHeaders = values[0];
    // Jika tidak ada kolom "jadwal_id" dan jumlah kolom asal adalah 5
    if (oldHeaders.indexOf("jadwal_id") === -1 && oldHeaders.length === 5) {
      var migratedRows = [];
      for (var i = 1; i < values.length; i++) {
        var row = values[i];
        // format lama: [id, pegawai_id, tanggal, status, keterangan]
        // format baru: [id, pegawai_id, jadwal_id, tanggal, status, keterangan]
        // Gunakan "JDW-001" sebagai jadwal_id default/fallback untuk baris lama
        migratedRows.push([
          row[0], // presensi_pegawai_id
          row[1], // pegawai_id
          "JDW-001", // jadwal_id (fallback)
          row[2], // tanggal
          row[3], // status_kehadiran
          row[4]  // keterangan
        ]);
      }
      
      // Bersihkan isi sheet
      sheet.clearContents();
      
      // Tulis header baru sepanjang 6 kolom
      var newHeaders = SCHEMAS["PresensiPegawai"];
      sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
      sheet.getRange(1, 1, 1, newHeaders.length).setFontWeight("bold");
      
      // Tulis baris data hasil migrasi
      sheet.getRange(2, 1, migratedRows.length, newHeaders.length).setValues(migratedRows);
    }
  } catch(e) {
    Logger.log("Gagal melakukan migrasi skema PresensiPegawai: " + e.toString());
  }
}

// Memasukkan Data Awal (Seeds) untuk semua tabel
function seedDefaultData(db) {
  // 1. Seed Jabatan
  var sheetJab = db.getSheetByName("Jabatan");
  if (sheetJab.getDataRange().getValues().length <= 1) {
    sheetJab.getRange(2, 1, 3, 3).setValues([
      ["JAB-001", "Pengelola", "Super Admin dengan kontrol penuh keuangan & sistem"],
      ["JAB-002", "Tentor", "Tenaga pengajar/guru bimbel"],
      ["JAB-003", "Staf Operasional", "Mengurus administrasi harian dan kepegawaian"]
    ]);
  }

  // 2. Seed Pegawai
  var sheetPeg = db.getSheetByName("Pegawai");
  if (sheetPeg.getDataRange().getValues().length <= 1) {
    sheetPeg.getRange(2, 1, 3, 9).setValues([
      ["PGW-001", "Fahmi Hidayat, M.Pd", "Jakarta", "1990-05-15", "Jl. Jenderal Sudirman No. 45, Jakarta", "JAB-002", "fahmi@example.com", 150000, "Aktif"],
      ["PGW-002", "Budi Santoso, S.Kom", "Bandung", "1988-10-22", "Jl. Merdeka No. 12, Bandung", "JAB-001", "budi@example.com", 0, "Aktif"],
      ["PGW-003", "Siti Rahma, S.Pd", "Surabaya", "1993-02-08", "Jl. Pemuda No. 78, Surabaya", "JAB-002", "siti@example.com", 150000, "Aktif"]
    ]);
  }

  // 3. Seed Users
  var sheetUsr = db.getSheetByName("Users");
  if (sheetUsr.getDataRange().getValues().length <= 1) {
    sheetUsr.getRange(2, 1, 3, 7).setValues([
      ["USR-001", "admin", hashSHA256("admin123"), "pengelola", "Budi Santoso", "PGW-002", "Aktif"],
      ["USR-002", "tentor1", hashSHA256("tentor123"), "tentor", "Fahmi Hidayat", "PGW-001", "Aktif"],
      ["USR-003", "parent1", hashSHA256("parent123"), "parent", "Irfan Hakim", "SSW-001", "Aktif"]
    ]);
  }

  // 4. Seed KelompokBelajar
  var sheetKlm = db.getSheetByName("KelompokBelajar");
  if (sheetKlm.getDataRange().getValues().length <= 1) {
    sheetKlm.getRange(2, 1, 2, 4).setValues([
      ["KLM-001", "SD Kelas 6 - Regular", "SD", "Kelas persiapan ujian sekolah dasar"],
      ["KLM-002", "SMA Kelas 12 - UTBK", "SMA", "Kelas intensif persiapan UTBK SNBT"]
    ]);
  }

  // 5. Seed Siswa
  var sheetSis = db.getSheetByName("Siswa");
  if (sheetSis.getDataRange().getValues().length <= 1) {
    sheetSis.getRange(2, 1, 2, 9).setValues([
      ["SSW-001", "Rian Saputra", "Jakarta", "2014-08-12", "SDN Menteng 01", "Irfan Hakim", "Jl. Menteng Raya No. 10, Jakarta", "parent1@example.com", "KLM-001"],
      ["SSW-002", "Anisa Putri", "Bandung", "2013-03-24", "SDN Cihampelas 02", "Hendrawan", "Jl. Cihampelas No. 5, Bandung", "anisa.parent@example.com", "KLM-001"]
    ]);
  }

  // 6. Seed KonfigurasiAkademik
  var sheetKon = db.getSheetByName("KonfigurasiAkademik");
  if (sheetKon.getDataRange().getValues().length <= 1) {
    sheetKon.getRange(2, 1, 1, 4).setValues([
      ["KNF-001", "2025/2026", "Ganjil", "Aktif"]
    ]);
  }

  // 7. Seed Mapel
  var sheetMap = db.getSheetByName("Mapel");
  if (sheetMap.getDataRange().getValues().length <= 1) {
    sheetMap.getRange(2, 1, 2, 3).setValues([
      ["MPL-001", "Matematika", "Mata pelajaran perhitungan matematika dasar & rumus cepat"],
      ["MPL-002", "IPA (Sains)", "Pelajaran fisika dan biologi dasar"]
    ]);
  }

  // 8. Seed Jadwal
  var sheetJdw = db.getSheetByName("Jadwal");
  if (sheetJdw.getDataRange().getValues().length <= 1) {
    sheetJdw.getRange(2, 1, 2, 8).setValues([
      ["JDW-001", "KLM-001", "PGW-001", "MPL-001", "Senin", "15:00", "16:30", "Ruang 101"],
      ["JDW-002", "KLM-001", "PGW-003", "MPL-002", "Rabu", "15:00", "16:30", "Ruang 102"]
    ]);
  }

  // 9. Seed PresensiSiswa
  var sheetPrs = db.getSheetByName("PresensiSiswa");
  if (sheetPrs.getDataRange().getValues().length <= 1) {
    sheetPrs.getRange(2, 1, 2, 6).setValues([
      ["PRS-001", "JDW-001", "SSW-001", "2026-06-01", "Hadir", "Hadir tepat waktu"],
      ["PRS-002", "JDW-001", "SSW-002", "2026-06-01", "Hadir", "Hadir tepat waktu"]
    ]);
  }

  // 10. Seed PresensiPegawai
  var sheetPrp = db.getSheetByName("PresensiPegawai");
  if (sheetPrp.getDataRange().getValues().length <= 1) {
    sheetPrp.getRange(2, 1, 1, 6).setValues([
      ["PRP-001", "PGW-001", "JDW-001", "2026-06-01", "Hadir", "Mengajar kelas Matematika KLM-001"]
    ]);
  }

  // 11. Seed JurnalMengajar
  var sheetJrn = db.getSheetByName("JurnalMengajar");
  if (sheetJrn.getDataRange().getValues().length <= 1) {
    sheetJrn.getRange(2, 1, 1, 6).setValues([
      ["JRN-001", "JDW-001", "2026-06-01", "PGW-001", "Membahas Operasi Hitung Campuran", "Siswa aktif berpartisipasi dan memahami materi kuis"]
    ]);
  }

  // 12. Seed RescheduleJadwal
  var sheetRsc = db.getSheetByName("RescheduleJadwal");
  if (sheetRsc.getDataRange().getValues().length <= 1) {
    sheetRsc.getRange(2, 1, 1, 9).setValues([
      ["RSC-001", "JDW-002", "2026-06-03", "2026-06-04", "16:00", "17:30", "Ada keperluan darurat", "Disetujui", "USR-001"]
    ]);
  }

  // 13. Seed PosBayar
  var sheetPos = db.getSheetByName("PosBayar");
  if (sheetPos.getDataRange().getValues().length <= 1) {
    sheetPos.getRange(2, 1, 2, 6).setValues([
      ["POS-001", "SPP Juli 2026", 350000, "SSW-001", "Belum Lunas", "Tagihan SPP Rian Saputra diatur Pengelola"],
      ["POS-002", "SPP Juli 2026", 350000, "SSW-002", "Lunas", "Tagihan SPP Anisa Putri diatur Pengelola"]
    ]);
  }

  // 14. Seed KeuanganTrans
  var sheetTxn = db.getSheetByName("KeuanganTrans");
  if (sheetTxn.getDataRange().getValues().length <= 1) {
    sheetTxn.getRange(2, 1, 2, 9).setValues([
      ["TXN-001", "2026-06-05", "Kas Masuk", "SPP", 350000, "Kas Bank", "POS-002", "", "Pembayaran SPP Juli 2026 Anisa Putri"],
      ["TXN-002", "2026-06-28", "Kas Keluar", "Gaji", 150000, "Kas Tunai", "", "PGW-001", "Fee mengajar sesi 1 Fahmi Hidayat"]
    ]);
  }

  // 15. Seed Pengumuman
  var sheetPgm = db.getSheetByName("Pengumuman");
  if (sheetPgm.getDataRange().getValues().length <= 1) {
    sheetPgm.getRange(2, 1, 2, 6).setValues([
      ["PGM-001", "Ujian Try Out Akbar SD", "Diberitahukan kepada seluruh wali murid bahwa Try Out Akbar akan dilaksanakan tanggal 15 Juli 2026.", "Parent", "2026-07-01", "USR-001"],
      ["PGM-002", "Rapat Kurikulum Baru Bimbel", "Rapat koordinasi kurikulum baru untuk seluruh tentor ditiadakan hari ini.", "Tentor", "2026-07-02", "USR-001"]
    ]);
  }
}

// Membaca Data Baris & Konversi ke Object Array
function getTableRows(sheetName) {
  var db = getDb();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) return []; // Hanya header
  
  var headers = values[0];
  var result = [];
  
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      if (val instanceof Date) {
        if (val.getFullYear() === 1899) {
          obj[headers[j]] = Utilities.formatDate(val, db.getSpreadsheetTimeZone(), "HH:mm");
        } else {
          obj[headers[j]] = Utilities.formatDate(val, db.getSpreadsheetTimeZone(), "yyyy-MM-dd");
        }
      } else {
        obj[headers[j]] = val === undefined ? "" : val;
      }
    }
    result.push(obj);
  }
  return result;
}

// Membuat ID Otomatis Berdasarkan Max ID Sebelumnya
function generateNextId(sheet, prefix) {
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length <= 1) {
    return prefix + "-001";
  }
  
  var maxNum = 0;
  for (var i = 1; i < values.length; i++) {
    var idVal = values[i][0].toString(); // Kolom pertama (ID)
    if (idVal.indexOf(prefix + "-") === 0) {
      var numPart = parseInt(idVal.substring(prefix.length + 1), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  
  var nextNum = maxNum + 1;
  var padding = "000";
  var numStr = nextNum.toString();
  var nextId = prefix + "-" + (padding.substring(0, padding.length - numStr.length) + numStr);
  return nextId;
}

// Menambahkan Baris Baru (Create)
function insertTableRow(sheetName, data) {
  var db = getDb();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) throw new Error("Tabel tidak ditemukan: " + sheetName);
  
  var headers = SCHEMAS[sheetName];
  var pkCol = headers[0];
  var prefix = ID_PREFIXES[sheetName] || "ID";
  
  // Generate ID baru otomatis
  var newId = generateNextId(sheet, prefix);
  data[pkCol] = newId;
  
  // Konstruksi array baris sesuai dengan urutan headers skema
  var rowValues = [];
  for (var i = 0; i < headers.length; i++) {
    var val = data[headers[i]];
    rowValues.push(val === undefined ? "" : val);
  }
  
  sheet.appendRow(rowValues);
  return data;
}

// Memperbarui Baris (Update)
function updateTableRow(sheetName, idCol, idVal, updatedData) {
  var db = getDb();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) throw new Error("Tabel tidak ditemukan: " + sheetName);
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  var headers = values[0];
  
  var idIndex = headers.indexOf(idCol);
  if (idIndex === -1) throw new Error("Kolom ID tidak ditemukan: " + idCol);
  
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][idIndex].toString() === idVal.toString()) {
      rowIndex = i + 1; // 1-indexed row number di Excel/Sheets
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error("Data dengan ID " + idVal + " tidak ditemukan.");
  
  // Perbarui cell per cell berdasarkan data yang dikirim
  for (var key in updatedData) {
    var colIndex = headers.indexOf(key);
    if (colIndex !== -1 && key !== idCol) {
      sheet.getRange(rowIndex, colIndex + 1).setValue(updatedData[key]);
    }
  }
  return true;
}

// Menghapus Baris (Delete)
function deleteTableRow(sheetName, idCol, idVal) {
  var db = getDb();
  var sheet = db.getSheetByName(sheetName);
  if (!sheet) throw new Error("Tabel tidak ditemukan: " + sheetName);
  
  var range = sheet.getDataRange();
  var values = range.getValues();
  var headers = values[0];
  
  var idIndex = headers.indexOf(idCol);
  if (idIndex === -1) throw new Error("Kolom ID tidak ditemukan: " + idCol);
  
  var rowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][idIndex].toString() === idVal.toString()) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) throw new Error("Data dengan ID " + idVal + " tidak ditemukan.");
  
  sheet.deleteRow(rowIndex);
  return true;
}

// =========================================================================
// SPECIFIC BUSINESS LOGIC FUNCTIONS
// =========================================================================

// Validasi Login Akun Pengguna
function validateLogin(username, password) {
  var users = getTableRows("Users");
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (u.username.toLowerCase() === username.toLowerCase() && u.password_hash === password) {
      if (u.status !== "Aktif") {
        return { status: "error", message: "Akun Anda dinonaktifkan. Silakan hubungi Pengelola." };
      }
      return {
        status: "success",
        user: {
          user_id: u.user_id,
          username: u.username,
          role: u.role,
          display_name: u.display_name,
          linked_id: u.linked_id
        }
      };
    }
  }

  // Rehash migration: jika password plaintext lama ditemukan di DB, bandingkan hash-nya dengan input
  for (var j = 0; j < users.length; j++) {
    var uu = users[j];
    if (uu.username.toLowerCase() === username.toLowerCase()) {
      // Cek apakah password_hash di DB masih plaintext (bukan hex 64 karakter)
      // dan apakah hash dari plaintext tersebut cocok dengan password kiriman client
      if (uu.password_hash && uu.password_hash.toString().length !== 64 && hashSHA256(uu.password_hash.toString()) === password) {
        // Migrasi: simpan hash yang valid ke database
        updateTableRow("Users", "user_id", uu.user_id, { password_hash: password });
        if (uu.status !== "Aktif") {
          return { status: "error", message: "Akun Anda dinonaktifkan. Silakan hubungi Pengelola." };
        }
        return {
          status: "success",
          user: {
            user_id: uu.user_id,
            username: uu.username,
            role: uu.role,
            display_name: uu.display_name,
            linked_id: uu.linked_id
          }
        };
      }
    }
  }

  return { status: "error", message: "Username atau password salah!" };
}

