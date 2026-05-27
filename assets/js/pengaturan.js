document.addEventListener("DOMContentLoaded", async function () {
  await fetchSession();
  const session = getSession();
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  if (session.role !== "manager") {
    window.location.href = "dashboard-kasir.html";
    return;
  }

  const form = document.getElementById("storeProfileForm");
  const storeName = document.getElementById("storeName");
  const storeAddress = document.getElementById("storeAddress");
  const storePhone = document.getElementById("storePhone");
  const receiptMessage = document.getElementById("receiptMessage");

  async function loadProfile() {
    try {
      const response = await fetch("../api/get_pengaturan.php");
      const result = await response.json();
      if (result.status === "success") {
        storeName.value = result.data.nama;
        storeAddress.value = result.data.alamat;
        storePhone.value = result.data.telepon;
        receiptMessage.value = result.data.pesan_struk;
      } else {
        const profile = getStoreProfile(); // fallback
        storeName.value = profile.nama;
        storeAddress.value = profile.alamat;
        storePhone.value = profile.telepon;
        receiptMessage.value = profile.pesan_struk;
      }
    } catch(e) {
      console.error(e);
      const profile = getStoreProfile(); // fallback
      storeName.value = profile.nama;
      storeAddress.value = profile.alamat;
      storePhone.value = profile.telepon;
      receiptMessage.value = profile.pesan_struk;
    }
  }

  loadProfile();

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const btnSubmit = form.querySelector('button[type="submit"]');
    if (btnSubmit) {
       btnSubmit.disabled = true;
       btnSubmit.textContent = "Menyimpan...";
    }

    const newProfile = {
      nama: storeName.value.trim(),
      alamat: storeAddress.value.trim(),
      telepon: storePhone.value.trim(),
      pesan_struk: receiptMessage.value.trim()
    };

    try {
      const response = await fetch("../api/simpan_pengaturan.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile)
      });
      const result = await response.json();
      if(result.status === "success") {
        saveStoreProfile(newProfile); // Update local cache for immediate use in receipt
        alert("Profil Optik berhasil disimpan ke database!");
      } else {
        alert(result.message);
      }
    } catch(err) {
      console.error(err);
      saveStoreProfile(newProfile); // fallback
      alert("Profil Optik disimpan secara lokal karena gagal terhubung ke server.");
    } finally {
      if (btnSubmit) {
         btnSubmit.disabled = false;
         btnSubmit.innerHTML = "<span>💾</span> Simpan Perubahan";
      }
    }
  });

  // ----------------------------------------------------
  // LOGIKA PUSAT RESET & PEMBERSIHAN DATA AMAN
  // ----------------------------------------------------
  const resetForm = document.getElementById("resetDataForm");
  const cbTransactions = document.getElementById("resetTransactions");
  const cbCustomers = document.getElementById("resetCustomers");
  const cbProducts = document.getElementById("resetProducts");
  const confirmInput = document.getElementById("confirmResetInput");
  const btnReset = document.getElementById("btnResetData");

  function validateResetForm() {
    if (!btnReset) return;
    const isOneChecked = cbTransactions.checked || cbCustomers.checked || cbProducts.checked;
    const isConfirmValid = confirmInput.value.trim() === "RESET";
    btnReset.disabled = !(isOneChecked && isConfirmValid);
  }

  if (cbTransactions) cbTransactions.addEventListener("change", validateResetForm);
  if (cbCustomers) cbCustomers.addEventListener("change", validateResetForm);
  if (cbProducts) cbProducts.addEventListener("change", validateResetForm);
  if (confirmInput) confirmInput.addEventListener("input", validateResetForm);

  if (resetForm) {
    resetForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      const selectedData = [];
      if (cbTransactions.checked) selectedData.push("Riwayat Transaksi & Keuangan");
      if (cbCustomers.checked) selectedData.push("Seluruh Data Pelanggan");
      if (cbProducts.checked) selectedData.push("Seluruh Data & Stok Kacamata");

      const confirmMsg = `PERINGATAN KERAS! Anda akan menghapus data berikut secara PERMANEN:\n\n` + 
                         selectedData.map((d, i) => `${i + 1}. ${d}`).join("\n") + 
                         `\n\nApakah Anda benar-benar yakin? Tindakan ini tidak dapat dibatalkan!`;

      if (confirm(confirmMsg)) {
        btnReset.disabled = true;
        btnReset.textContent = "🔥 Menghapus Data...";

        const payload = {
          confirm: "RESET",
          resetTransactions: cbTransactions.checked,
          resetCustomers: cbCustomers.checked,
          resetProducts: cbProducts.checked
        };

        try {
          const response = await fetch("../api/reset_data.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const result = await response.json();
          if (result.status === "success") {
            alert("Sukses! Data terpilih telah berhasil dibersihkan dari database.");
            location.reload();
          } else {
            alert("Gagal melakukan reset: " + result.message);
          }
        } catch (err) {
          console.error(err);
          alert("Terjadi kesalahan jaringan saat menghubungi server.");
        } finally {
          btnReset.disabled = false;
          btnReset.textContent = "🔥 Jalankan Pembersihan Data";
          validateResetForm();
        }
      }
    });
  }

});
