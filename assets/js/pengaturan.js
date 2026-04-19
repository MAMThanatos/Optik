document.addEventListener("DOMContentLoaded", function () {
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  // Hanya Branch Manager yang boleh akses pengaturan
  if (session.role !== "branch_manager") {
    window.location.href = "dashboard-kasir.html";
    return;
  }

  const form = document.getElementById("storeProfileForm");
  const storeName = document.getElementById("storeName");
  const storeAddress = document.getElementById("storeAddress");
  const storePhone = document.getElementById("storePhone");
  const receiptMessage = document.getElementById("receiptMessage");

  // Load existing data
  const profile = getStoreProfile();
  storeName.value = profile.nama;
  storeAddress.value = profile.alamat;
  storePhone.value = profile.telepon;
  receiptMessage.value = profile.pesan_struk;

  // Handle Save
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const newProfile = {
      nama: storeName.value.trim(),
      alamat: storeAddress.value.trim(),
      telepon: storePhone.value.trim(),
      pesan_struk: receiptMessage.value.trim()
    };

    saveStoreProfile(newProfile);
    alert("Profil Optik berhasil disimpan! Perubahan akan langsung terlihat pada struk kasir.");
  });

});
