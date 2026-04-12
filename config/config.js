const APP_CONFIG = {
  appName: "Optik",
  appVersion: "1.0.0",
  companyName: "Optik",
};

// Data user dummy
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

/**
 * Fungsi untuk autentikasi user
 * @param {string} userId - ID user
 * @param {string} password - Password user
 * @returns {object|null} - Data user jika valid, null jika tidak
 */
function authenticateUser(userId, password) {
  const user = USERS.find(
    (u) => u.id === userId && u.password === password
  );
  return user || null;
}

/**
 * Simpan session user ke localStorage
 * @param {object} user - Data user
 */
function setSession(user) {
  localStorage.setItem("pos_session", JSON.stringify(user));
}

/**
 * Ambil session user dari localStorage
 * @returns {object|null}
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