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



let RUNTIME_SESSION = null;

/**
 * Ambil session user dari server
 */
async function fetchSession() {
  try {
    const response = await fetch("../api/me.php");
    const result = await response.json();
    if (result.status === "success") {
      RUNTIME_SESSION = result.data;
    } else {
      RUNTIME_SESSION = null;
    }
  } catch (e) {
    RUNTIME_SESSION = null;
  }
}

/**
 * Simpan session user ke runtime
 */
function setSession(user) {
  RUNTIME_SESSION = user;
}

/**
 * Ambil session user dari runtime (sync)
 */
function getSession() {
  return RUNTIME_SESSION;
}

/**
 * Hapus session (logout)
 */
async function clearSession() {
  RUNTIME_SESSION = null;
  try {
    await fetch("../api/logout.php");
  } catch(e) {}
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