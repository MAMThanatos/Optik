/**
 * Konfigurasi Aplikasi POS Optik
 * Data user dummy untuk login & data produk
 */

const APP_CONFIG = {
  appName: "OptikPOS",
  appVersion: "1.0.0",
  companyName: "Optik Sejahtera",
};

// Data user dummy (nanti diganti dengan database)
const USERS = [
  {
    id: "BM001",
    password: "manager123",
    nama: "Budi Santoso",
    role: "branch_manager",
    cabang: "Cabang Utama",
  },
  {
    id: "KR001",
    password: "kasir123",
    nama: "Andi Pratama",
    role: "karyawan",
    cabang: "Cabang Utama",
  },
];

// Data produk kacamata dummy
const PRODUCTS = [
  {
    id: "PRD001",
    nama: "Frame Titanium Classic",
    kategori: "Frame",
    merek: "RayOptic",
    harga: 1500000,
    stok: 15,
    ukuranLensa: "52-18-140",
    deskripsi: "Frame titanium ringan dan tahan lama",
  },
  {
    id: "PRD002",
    nama: "Frame Acetate Bold",
    kategori: "Frame",
    merek: "VisionPro",
    harga: 850000,
    stok: 22,
    ukuranLensa: "54-20-145",
    deskripsi: "Frame acetate tebal bergaya retro",
  },
  {
    id: "PRD003",
    nama: "Frame Half-Rim Silver",
    kategori: "Frame",
    merek: "OptiMax",
    harga: 650000,
    stok: 18,
    ukuranLensa: "50-17-135",
    deskripsi: "Frame setengah bingkai elegan",
  },
  {
    id: "PRD004",
    nama: "Lensa Progresif Premium",
    kategori: "Lensa",
    merek: "ClearVision",
    harga: 2000000,
    stok: 30,
    ukuranLensa: "-",
    deskripsi: "Lensa progresif anti radiasi blue light",
  },
  {
    id: "PRD005",
    nama: "Lensa Minus Single Vision",
    kategori: "Lensa",
    merek: "ClearVision",
    harga: 500000,
    stok: 50,
    ukuranLensa: "-",
    deskripsi: "Lensa single vision untuk minus/plus/silinder",
  },
  {
    id: "PRD006",
    nama: "Lensa Photochromic",
    kategori: "Lensa",
    merek: "TransLens",
    harga: 1200000,
    stok: 25,
    ukuranLensa: "-",
    deskripsi: "Lensa berubah warna otomatis saat terkena sinar UV",
  },
  {
    id: "PRD007",
    nama: "Sunglasses Polarized Aviator",
    kategori: "Sunglasses",
    merek: "SunShield",
    harga: 1800000,
    stok: 10,
    ukuranLensa: "58-14-140",
    deskripsi: "Kacamata hitam polarized model aviator",
  },
  {
    id: "PRD008",
    nama: "Sunglasses Sport Wrap",
    kategori: "Sunglasses",
    merek: "ActiveEye",
    harga: 950000,
    stok: 12,
    ukuranLensa: "62-15-130",
    deskripsi: "Kacamata sport untuk aktivitas outdoor",
  },
  {
    id: "PRD009",
    nama: "Kacamata Anak Flexi",
    kategori: "Frame",
    merek: "KiddoVision",
    harga: 450000,
    stok: 20,
    ukuranLensa: "44-16-120",
    deskripsi: "Frame fleksibel khusus anak-anak",
  },
  {
    id: "PRD010",
    nama: "Lensa Kontak Harian (30pcs)",
    kategori: "Lensa Kontak",
    merek: "DailyFresh",
    harga: 350000,
    stok: 40,
    ukuranLensa: "-",
    deskripsi: "Lensa kontak harian nyaman seharian",
  },
  {
    id: "PRD011",
    nama: "Lensa Kontak Bulanan (2pcs)",
    kategori: "Lensa Kontak",
    merek: "MonthlyComfort",
    harga: 250000,
    stok: 35,
    ukuranLensa: "-",
    deskripsi: "Lensa kontak bulanan dengan kadar air tinggi",
  },
  {
    id: "PRD012",
    nama: "Cairan Pembersih Lensa 120ml",
    kategori: "Aksesoris",
    merek: "LensClean",
    harga: 75000,
    stok: 60,
    ukuranLensa: "-",
    deskripsi: "Cairan pembersih multi-purpose untuk lensa kontak",
  },
  {
    id: "PRD013",
    nama: "Case Kacamata Premium",
    kategori: "Aksesoris",
    merek: "OptikPOS",
    harga: 120000,
    stok: 45,
    ukuranLensa: "-",
    deskripsi: "Tempat kacamata kulit sintetis premium",
  },
  {
    id: "PRD014",
    nama: "Kain Microfiber Pembersih",
    kategori: "Aksesoris",
    merek: "OptikPOS",
    harga: 25000,
    stok: 100,
    ukuranLensa: "-",
    deskripsi: "Kain microfiber lembut untuk membersihkan lensa",
  },
  {
    id: "PRD015",
    nama: "Frame Cat Eye Vintage",
    kategori: "Frame",
    merek: "RetroLook",
    harga: 780000,
    stok: 8,
    ukuranLensa: "53-17-140",
    deskripsi: "Frame cat eye gaya vintage untuk wanita",
  },
];

// Metode pembayaran
const PAYMENT_METHODS = [
  { id: "tunai", nama: "Tunai", icon: "💵", desc: "Pembayaran cash" },
  { id: "kartu", nama: "Kartu Debit/Kredit", icon: "💳", desc: "Visa, Mastercard, dll" },
  { id: "transfer", nama: "Transfer Bank", icon: "🏦", desc: "BCA, Mandiri, BNI, BRI" },
  { id: "qris", nama: "QRIS", icon: "📱", desc: "Scan QR Code" },
];

/**
 * Fungsi untuk mengambil data users dari localStorage (atau default USERS)
 */
function getUsers() {
  const storedUsers = localStorage.getItem("pos_users");
  if (storedUsers) {
    return JSON.parse(storedUsers);
  }
  // Initialize with default
  localStorage.setItem("pos_users", JSON.stringify(USERS));
  return USERS;
}

/**
 * Fungsi untuk menyimpan data users ke localStorage
 */
function saveUsers(users) {
  localStorage.setItem("pos_users", JSON.stringify(users));
}

/**
 * Fungsi untuk autentikasi user
 */
function authenticateUser(userId, password) {
  const currentUsers = getUsers();
  const user = currentUsers.find(
    (u) => u.id === userId && u.password === password
  );
  return user || null;
}

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

/**
 * Fungsi untuk mengambil data transaksi dari localStorage
 */
function getTransactions() {
  const stored = localStorage.getItem("pos_transactions");
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

/**
 * Fungsi untuk menyimpan data transaksi ke localStorage
 */
function saveTransactions(transactions) {
  localStorage.setItem("pos_transactions", JSON.stringify(transactions));
}

/**
 * Fungsi untuk mengambil data produk dari localStorage (atau default PRODUCTS)
 */
function getProducts() {
  const stored = localStorage.getItem("pos_products");
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with default
  localStorage.setItem("pos_products", JSON.stringify(PRODUCTS));
  return PRODUCTS;
}

/**
 * Fungsi untuk menyimpan data produk ke localStorage
 */
function saveProducts(products) {
  localStorage.setItem("pos_products", JSON.stringify(products));
}

/**
 * Fungsi untuk mengambil data pengeluaran (expenses) dari localStorage
 */
function getExpenses() {
  const stored = localStorage.getItem("pos_expenses");
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

/**
 * Fungsi untuk menyimpan data pengeluaran (expenses) ke localStorage
 */
function saveExpenses(expenses) {
  localStorage.setItem("pos_expenses", JSON.stringify(expenses));
}

/**
 * Fungsi untuk mendapatkan Profil Toko (Nama, Alamat, Pesan Struk)
 */
function getStoreProfile() {
  const defaultProfile = {
    nama: "OPTIK SEJAHTERA",
    alamat: "Jl. Merdeka No. 123, Jakarta",
    telepon: "(021) 1234-5678",
    pesan_struk: "Terima kasih atas kunjungan Anda.\nBarang yang sudah dibeli tidak dapat dikembalikan.\nGaransi frame 1 tahun."
  };
  
  const stored = localStorage.getItem("pos_store_profile");
  if (stored) {
    return { ...defaultProfile, ...JSON.parse(stored) };
  }
  return defaultProfile;
}

/**
 * Fungsi untuk menyimpan Profil Toko
 */
function saveStoreProfile(profile) {
  localStorage.setItem("pos_store_profile", JSON.stringify(profile));
}