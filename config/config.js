/**
 * Konfigurasi Aplikasi POS Optik
 * Data user dummy untuk login & data produk
 */

const APP_CONFIG = {
  appName: "Optik Lucky Prastica",
  appVersion: "1.0.0",
  companyName: "Optik Sejahtera",
};




const PAYMENT_METHODS = [
  { id: "tunai", nama: "Tunai", icon: "💵", desc: "Pembayaran cash" },
  { id: "kartu", nama: "Kartu Debit/Kredit", icon: "💳", desc: "Visa, Mastercard, dll" },
  { id: "transfer", nama: "Transfer Bank", icon: "🏦", desc: "BCA, Mandiri, BNI, BRI" },
  { id: "qris", nama: "QRIS", icon: "📱", desc: "Scan QR Code" },
];



/**
 * Simpan session user ke localStorage
 */
function setSession(user) {
  localStorage.setItem("pos_session", JSON.stringify(user));
}

/**
 * Ambil session user dari localStorage
 */
function getSession() {
  const session = localStorage.getItem("pos_session");
  return session ? JSON.parse(session) : null;
}

/**
 * Hapus session (logout)
 */
function clearSession() {
  localStorage.removeItem("pos_session");
}

/**
 * Format angka ke Rupiah
 */
function formatRupiah(angka) {
  return "Rp " + angka.toLocaleString("id-ID");
}

/**
 * Generate invoice number
 */
function generateInvoice() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return "INV-" + date + "-" + rand;
}



let RUNTIME_STORE_PROFILE = {
  nama: "OPTIK SEJAHTERA",
  alamat: "Jl. Merdeka No. 123, Jakarta",
  telepon: "(021) 1234-5678",
  pesan_struk: "Terima kasih atas kunjungan Anda.\nBarang yang sudah dibeli tidak dapat dikembalikan.\nGaransi frame 1 tahun."
};

/**
 * Fungsi untuk mendapatkan Profil Toko (Nama, Alamat, Pesan Struk) dari runtime
 */
function getStoreProfile() {
  return RUNTIME_STORE_PROFILE;
}

/**
 * Fungsi untuk menyimpan Profil Toko ke runtime memory
 */
function saveStoreProfile(profile) {
  RUNTIME_STORE_PROFILE = { ...RUNTIME_STORE_PROFILE, ...profile };
}