// scripts/logout.js

const logoutBtn = document.getElementById("logout-btn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await firebase.auth().signOut();
      window.location.href = "/login.html";
    } catch (err) {
      console.error("Logout error:", err);
    }
  });
}
