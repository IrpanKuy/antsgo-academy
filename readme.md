Ini untuk aplikasi manajeman bimbel kak namanya "AntsGo Academy".

Menggunakan Google App Script Dan Database spreedshets, 

Arsitektur Aplikasi "AntsGo Academy" (Sistem Informasi Manajemen Bimbel)

Aplikasi ini dirancang menggunakan arsitektur Multi Page Application (MPA) berbasis Google Apps Script (backend & vue js cdn) dengan Google Sheets sebagai database utama denga frontend Menyediakan GAS_URL untuk menembak ke api Google App Script, Desain antarmuka mengusung konsep Navy cerah tanpa gradasi dan flat desain dan pastikan responsif di semua device

1. Sistem Role & Hak Akses

Sistem membagi pengguna ke dalam 3 tingkat otoritas dengan kontrol akses dinamis di frontend (UI menyembunyikan menu non-otoritas) dan backend (validasi API server-side):

-Pengelola (Super Admin)

Akses penuh (View, Create, Update, Delete) ke seluruh menu aplikasi.

Mengelola akun pengguna (User Management), pengaturan aplikasi, dan konfigurasi keuangan.

-Tentor (Guru/Instruktur)

Dapat melihat jadwal mengajar pribadi secara real-time.

Mengisi presensi kehadiran tentor dan presensi siswa yang diajar.

Membuat dan menyimpan Jurnal Mengajar.

Mengakses modul akademik dasar (materi pembelajaran) dan modul kepegawaian internal (profil pribadi & presensi pribadi).

-Orang Tua Siswa (Wali Murid)

Menu personalisasi khusus (dashboard personal).

Melihat jadwal belajar khusus anak yang bersangkutan (bukan jadwal umum).

Mengakses materi pembelajaran di menu Akademik.

Melihat status tagihan, riwayat pembayaran, dan mencetak bukti pembayaran digital.

2. Rencana Fitur Utama & Sub-Fitur (Berdasarkan Referensi image_2a069e.jpg)

A. Dashboard

Stat Cards (Ringkasan KPI): Total Siswa Aktif, Total Tentor, Pendapatan Bulan Ini, Pengeluaran Bulan Ini.

Grafik Visual (Chart.js): Tren Keuangan bulanan (Kas Masuk vs Kas Keluar) dan persentase kehadiran siswa.

Pengumuman Terbaru: Papan info penting untuk seluruh pengguna sesuai segmen target.

B. Kesiswaan

Kelompok Belajar: Pengaturan kelas/kelompok (misal: "SD Kelas 6 - Regular", "SMA Kelas 12 - UTBK").

Manajemen Siswa (CRUD): Pengelolaan data detail siswa.

Kirim Pengumuman: Fitur untuk mempublikasikan pengumuman ke dasbor orang tua siswa.

C. Kepegawaian

Jabatan Pegawai: Pengaturan posisi (Pengelola, Tentor, Staf Operasional).

Data Pegawai (CRUD - Unlimited): Pengelolaan profil detail karyawan dan tentor.

Presensi Pegawai: Log kehadiran harian/saat mengajar.

D. Akademik

Konfigurasi Dasar: Tahun Ajaran, Semester, Kenaikan Kelas, Program Bimbel, dan Mata Pelajaran.

Jadwal Guru: Kalender penjadwalan terpadu (Hari, Jam, Ruang, Mapel, Tentor).

Presensi Harian Siswa: Absensi kehadiran per kelas yang diisi oleh tentor/pengelola.

Jurnal Mengajar: Catatan materi yang diajarkan, tanggal, dan evaluasi singkat kelas oleh tentor.

Reschedule Jadwal: Form pengajuan perubahan jadwal mengajar oleh tentor (butuh persetujuan Pengelola).

E. Keuangan

Setting Pembayaran: Pengaturan POS Pembayaran (SPP, Pendaftaran, Buku), akun biaya, serta jenis & pos bayar siswa.

Pembayaran Siswa: Manajemen transaksi pembayaran masuk dari orang tua siswa (disertai cetak kwitansi).

Penggajian (Payroll): Setting gaji pokok + insentif mengajar per sesi tentor, dan generator slip gaji pegawai.

Kas & Bank: Saldo awal kas, pencatatan transaksi kas masuk & keluar non-SPP, dan fitur transfer kas antar bank/brankas.

F. Akuntansi

Jurnal Umum: Pencatatan double-entry otomatis dari setiap aktivitas keuangan yang terintegrasi.

Buku Besar (General Ledger): Filter transaksi berdasarkan akun akuntansi (Kas, Piutang, Biaya, Gaji, dll).

Laporan Finansial Standar: Neraca Saldo, Laporan Laba Rugi, Arus Kas, dan Perubahan Modal secara otomatis.

G. Laporan (Reporting Module)

Laporan Pembayaran: Rekap pembayaran siswa per kelas/kelompok atau filter rentang tanggal.

Laporan Keuangan: Rekap Laporan Jurnal Umum dan Laporan Penggajian/Gaji Pegawai.

Laporan Debit Kredit: Laporan arus kas harian (Kas Tunai vs Kas Bank).

3. Struktur Navigasi MPA (Multi Page Application)

Aplikasi akan memuat menu navigasi di sidebar kiri secara dinamis berdasarkan hak akses pengguna saat berhasil login, dengan system navigasi terpisah

[AntsGo Academy Sidebar Menu]
├── 📊 Dashboard (Semua Role)
├── 👥 Kesiswaan (Hanya Pengelola)
│   ├── Kelompok Belajar
│   ├── Data Siswa
│   └── Kirim Pengumuman
├── 💼 Kepegawaian (Pengelola & Tentor [Melihat Profil & Presensi])
│   ├── Jabatan Pegawai
│   ├── Data Pegawai
│   └── Presensi Pegawai
├── 🏫 Akademik (Semua Role - Konten Dinamis)
│   ├── Tahun Ajaran & Program (Pengelola)
│   ├── Mata Pelajaran (Pengelola)
│   ├── Jadwal Mengajar (Semua - Filter personal untuk Tentor/Wali)
│   ├── Presensi Harian & Jurnal Mengajar (Pengelola & Tentor)
│   └── Reschedule Jadwal (Pengelola & Tentor)
├── 💰 Keuangan (Hanya Pengelola)
│   ├── Setting & Pos Bayar
│   ├── Transaksi Pembayaran Siswa
│   ├── Penggajian & Slip Gaji
│   └── Kas & Bank
├── 📋 Laporan (Hanya Pengelola)
│   ├── Laporan Pembayaran
│   ├── Laporan Keuangan
│   └── Laporan Debit & Kredit
└── ⚙️ Pengaturan (Semua Role - Pengaturan profil, sandi, konfigurasi instansi)


4. Struktur Data Spreadsheet (Google Sheets ERD)

Spreadsheet akan berfungsi sebagai relational database dengan tabel-tabel berikut:

1. Sheet Users
Menyimpan kredensial autentikasi login pengguna.
Kolom: user_id (PK), username, password_hash, role (Pengelola/Tentor/Parent), display_name, linked_id (ID Pegawai atau ID Siswa untuk relasi login personal), status (Aktif/Nonaktif)

2. Sheet Siswa
Menyimpan data identitas kesiswaan.
Kolom: siswa_id (PK), nama, tempat_lahir, tanggal_lahir (String ISO), asal_sekolah, nama_orang_tua, alamat, parent_email (Untuk login wali murid), kelompok_id (FK)

3. Sheet KelompokBelajar
Menyimpan data rombongan/kelompok belajar kesiswaan (Kelompok Belajar).
Kolom: kelompok_id (PK), nama_kelompok (misal: "SD Kelas 6 - Regular"), tingkat (SD/SMP/SMA), keterangan

4. Sheet Pegawai
Menyimpan data profil karyawan dan tentor.
Kolom: pegawai_id (PK), nama, tempat_lahir, tanggal_lahir (String ISO), alamat, jabatan_id (FK), email, gaji_per_sesi, status (Aktif/Nonaktif)

5. Sheet Jabatan
Menyimpan tingkat jabatan kepegawaian (Jabatan Pegawai).
Kolom: jabatan_id (PK), nama_jabatan (Pengelola, Tentor, Staf Operasional), keterangan

6. Sheet KonfigurasiAkademik
Menyimpan pengaturan tahun ajaran dan semester aktif (Tahun Ajaran & Program).
Kolom: konfig_id (PK), tahun_ajaran (misal: "2025/2026"), semester (Ganjil/Genap), status (Aktif/Nonaktif)

7. Sheet Mapel
Menyimpan daftar mata pelajaran akademik (Mata Pelajaran).
Kolom: mapel_id (PK), nama_mapel, keterangan

8. Sheet Jadwal
Menyimpan penjadwalan akademik terpadu (Jadwal Mengajar).
Kolom: jadwal_id (PK), kelompok_id (FK), pegawai_id (FK - Tentor), mapel_id (FK), hari, jam_mulai, jam_selesai, ruangan

9. Sheet PresensiSiswa
Pencatatan kehadiran siswa per sesi bimbingan belajar (Presensi Harian Siswa).
Kolom: presensi_siswa_id (PK), jadwal_id (FK), siswa_id (FK), tanggal (String ISO), status_kehadiran (Hadir/Izin/Sakit/Alpa), keterangan

10. Sheet PresensiPegawai
Pencatatan kehadiran harian/saat mengajar pegawai dan tentor (Presensi Pegawai).
Kolom: presensi_pegawai_id (PK), pegawai_id (FK), tanggal (String ISO), status_kehadiran (Hadir/Izin/Sakit/Alpa), keterangan

11. Sheet JurnalMengajar
Catatan materi yang diajarkan oleh tentor (Jurnal Mengajar).
Kolom: jurnal_id (PK), jadwal_id (FK), tanggal (String ISO), pegawai_id (FK - Tentor), materi_pembahasan, catatan_evaluasi

12. Sheet RescheduleJadwal
Catatan pengajuan perubahan jadwal mengajar oleh tentor (Reschedule Jadwal).
Kolom: reschedule_id (PK), jadwal_id (FK), tanggal_original (String ISO), tanggal_baru (String ISO), jam_mulai_baru, jam_selesai_baru, alasan, status (Pending/Disetujui/Ditolak), disetujui_oleh (FK - User ID)

13. Sheet PosBayar
Konfigurasi POS Pembayaran dan tagihan/invoice siswa (Setting & Pos Bayar). Ketika Pengelola membuat tagihan (baik personal maupun massal per kelompok belajar), sistem akan membuat baris tagihan individu untuk setiap siswa di sheet ini.
Kolom: pos_bayar_id (PK), nama_pos (misal: "SPP Juli 2026", "Buku Pegangan"), nominal_tarif, siswa_id (FK - penerima tagihan), status_bayar (Belum Lunas / Lunas), keterangan

14. Sheet KeuanganTrans
Catatan transaksi kas masuk, kas keluar, gaji, dan pembayaran SPP siswa.
Kolom: transaksi_id (PK), tanggal (String ISO), tipe (Kas Masuk/Kas Keluar), kategori (SPP / Gaji / Operasional / Pembelian), nominal, metode_pembayaran (Kas Tunai/Kas Bank), pos_bayar_id (FK - PosBayar ID, NULL jika transaksi umum non-SPP), pegawai_id (FK - Pegawai ID, NULL jika transaksi non-Gaji), keterangan

15. Sheet Pengumuman
Menyimpan pesan/informasi penting (Kirim Pengumuman & Pengumuman Terbaru).
Kolom: pengumuman_id (PK), judul, konten, target_role (Semua/Tentor/Parent), tanggal_kirim (String ISO), pembuat_id (FK - User ID)
