// =========================================================================
// ANTSGO ACADEMY - PRODUCTION DATABASE CONFIGURATION
// =========================================================================

// URL Web App Google Apps Script hasil Deploy (Production).
// Silakan masukkan URL Web App GAS Anda di sini.
window.GAS_URL = "https://script.google.com/macros/s/AKfycby8gj-OrUUMXExRjLHYW3ZlwWlOiCG2ztHnjICWrv4AOsFqZ2M6QFECeoq6jYUhTdQNPA/exec";

// Skema Kolom Database Relasional (15 Tabel)
window.SCHEMAS = {
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

/**
 * SHA-256 Hash Utility (Client-Side via Web Crypto API)
 * Menghasilkan hex string SHA-256 dari input plaintext.
 * @param {string} message - Plaintext yang akan di-hash.
 * @returns {Promise<string>} Hex string hash SHA-256.
 */
window.sha256Hash = async function (message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Normalisasi data tanggal dan waktu dari format mentah Google Sheets/GAS.
 * Mengatasi pergeseran waktu Batavia LMT 1899 (+07:07:48).
 */
window.normalizeDatabaseRows = function (rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(row => {
    const newRow = { ...row };
    for (const key in newRow) {
      const val = newRow[key];
      if (typeof val === 'string') {
        if (val.startsWith('1899-12-')) {
          try {
            var tPart = val.split('T')[1];
            if (tPart) {
              var parts = tPart.split(':');
              var utcHours = parseInt(parts[0], 10);
              var utcMinutes = parseInt(parts[1], 10);
              var utcSeconds = parseInt(parts[2], 10);

              var localHours = utcHours + 7;
              var localMinutes = utcMinutes + 7;
              var localSeconds = utcSeconds + 48;

              localMinutes += Math.floor(localSeconds / 60);
              localHours += Math.floor(localMinutes / 60);

              var finalHours = localHours % 24;
              var finalMinutes = localMinutes % 60;

              var roundedMm = Math.round(finalMinutes / 5) * 5;
              if (roundedMm === 60) {
                finalHours = (finalHours + 1) % 24;
                roundedMm = 0;
              }

              var hhStr = String(finalHours).padStart(2, '0');
              var mmStr = String(roundedMm).padStart(2, '0');
              newRow[key] = `${hhStr}:${mmStr}`;
            }
          } catch (e) {
            console.error("Gagal menormalisasi waktu:", e);
          }
        } else if (val.match(/^\d{4}-\d{2}-\d{2}T/)) {
          newRow[key] = val.substring(0, 10);
        }
      }
    }
    return newRow;
  });
};

/**
 * Mengambil data baris dari Google Sheets melalui Web App GAS secara real-time.
 * @param {string} sheetName - Nama tabel/sheet yang ingin diambil datanya.
 * @returns {Promise<Array>} Data baris dalam bentuk array of objects.
 */
window.fetchDatabase = async function (sheetName) {
  if (!window.GAS_URL || window.GAS_URL.trim() === "" || window.GAS_URL === "ISI_URL_WEB_APP_GAS_ANDA_DISINI") {
    console.error("GAS_URL belum dikonfigurasi di data.js!");
    return [];
  }

  try {
    const url = `${window.GAS_URL}?action=read&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors'
    });

    const result = await response.json();
    if (result && result.status === "success") {
      const data = result.data || [];
      return window.normalizeDatabaseRows(data);
    } else {
      console.error(`Gagal mengambil data sheet ${sheetName}:`, result.message);
      return [];
    }
  } catch (err) {
    console.error(`Kesalahan jaringan saat mengakses sheet ${sheetName}:`, err);
    return [];
  }
};

/**
 * Mengambil semua data sheet yang dibutuhkan oleh role tertentu secara paralel setelah login.
 * Menyimpan data tersebut ke sessionStorage agar instan saat pindah halaman ke dashboard.
 * @param {Object} user - Object user yang berhasil login.
 */
window.fetchRoleData = async function (user) {
  if (!user || !user.role) return;

  const role = user.role;
  let sheetsToFetch = [];

  // Tentukan daftar sheet yang diperlukan masing-masing role
  if (role === 'pengelola') {
    sheetsToFetch = ["Siswa", "Pegawai", "KeuanganTrans", "PresensiSiswa", "Pengumuman", "KelompokBelajar", "Jabatan", "KonfigurasiAkademik", "Mapel", "Jadwal", "PresensiPegawai", "JurnalMengajar", "RescheduleJadwal", "PosBayar", "Users"];
  } else if (role === 'tentor') {
    sheetsToFetch = ["Pegawai", "Jadwal", "PresensiPegawai", "PresensiSiswa", "Pengumuman", "Siswa", "KelompokBelajar", "Mapel", "JurnalMengajar", "RescheduleJadwal", "Users"];
  } else if (role === 'parent') {
    sheetsToFetch = ["Siswa", "PresensiSiswa", "PresensiPegawai", "PosBayar", "Pengumuman", "Jadwal", "Mapel", "KelompokBelajar", "Pegawai", "JurnalMengajar", "KeuanganTrans", "Users"];
  }

  // Bersihkan data lama di sessionStorage agar data bersih
  const allDbKeys = Object.keys(window.SCHEMAS);
  allDbKeys.forEach(key => sessionStorage.removeItem(`db_${key}`));

  // Ambil seluruh data secara paralel untuk kecepatan optimal
  const fetchPromises = sheetsToFetch.map(async (sheetName) => {
    const data = await window.fetchDatabase(sheetName);
    sessionStorage.setItem(`db_${sheetName}`, JSON.stringify(data));
  });

  await Promise.all(fetchPromises);
};

/**
 * Membaca data sheet yang sudah tersimpan di cache session storage.
 * @param {string} sheetName - Nama sheet yang diinginkan.
 * @returns {Array} Array berisi records dari sheet.
 */
window.getRoleData = function (sheetName) {
  const cached = sessionStorage.getItem(`db_${sheetName}`);
  if (cached) {
    try {
      return JSON.parse(cached) || [];
    } catch (e) {
      console.error(`Gagal parsing cache data db_${sheetName}:`, e);
    }
  }
  return [];
};

/**
 * Menyimpan data (Create / Update) ke Google Sheets dan memperbarui cache lokal.
 * @param {string} sheetName - Nama sheet target.
 * @param {string} action - 'create' atau 'update'.
 * @param {Object} payload - Data baris yang ingin disimpan.
 * @returns {Promise<Object>} Status kembalian server.
 */
window.saveDatabaseRecord = async function (sheetName, action, payload) {
  if (!window.GAS_URL || window.GAS_URL.trim() === "" || window.GAS_URL === "ISI_URL_WEB_APP_GAS_ANDA_DISINI") {
    throw new Error("GAS_URL belum dikonfigurasi di data.js!");
  }

  const response = await fetch(window.GAS_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: action,
      sheet: sheetName,
      data: payload
    })
  });

  const result = await response.json();
  if (result && result.status === "success") {
    // Perbarui cache sessionStorage
    const cache = window.getRoleData(sheetName);
    const pk = window.SCHEMAS[sheetName][0];

    if (action === 'create') {
      // GAS mengembalikan record baru termasuk PK ID baru di result.data
      const normalizedRow = window.normalizeDatabaseRows([result.data])[0];
      cache.push(normalizedRow);
    } else if (action === 'update') {
      const idx = cache.findIndex(item => item[pk].toString() === payload[pk].toString());
      if (idx !== -1) {
        const normalizedRow = window.normalizeDatabaseRows([payload])[0];
        cache[idx] = normalizedRow;
      }
    }
    sessionStorage.setItem(`db_${sheetName}`, JSON.stringify(cache));
    return result;
  } else {
    throw new Error(result.message || "Gagal menyimpan data ke Sheets.");
  }
};

/**
 * Menghapus data dari Google Sheets berdasarkan ID.
 * @param {string} sheetName - Nama sheet target.
 * @param {string} idVal - Nilai primary key ID yang ingin dihapus.
 * @returns {Promise<Object>} Status kembalian server.
 */
window.deleteDatabaseRecord = async function (sheetName, idVal) {
  if (!window.GAS_URL || window.GAS_URL.trim() === "" || window.GAS_URL === "ISI_URL_WEB_APP_GAS_ANDA_DISINI") {
    throw new Error("GAS_URL belum dikonfigurasi di data.js!");
  }

  const pk = window.SCHEMAS[sheetName][0];
  const response = await fetch(window.GAS_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({
      action: 'delete',
      sheet: sheetName,
      data: {
        [pk]: idVal
      }
    })
  });

  const result = await response.json();
  if (result && result.status === "success") {
    // Hapus dari cache sessionStorage
    const cache = window.getRoleData(sheetName);
    const newCache = cache.filter(item => item[pk].toString() !== idVal.toString());
    sessionStorage.setItem(`db_${sheetName}`, JSON.stringify(newCache));
    return result;
  } else {
    throw new Error(result.message || "Gagal menghapus data dari Sheets.");
  }
};
