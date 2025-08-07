// scripts/user-info.js

firebase.auth().onAuthStateChanged((user) => {
  const nameEl = document.getElementById("user-name");
  const emailEl = document.getElementById("user-email");

  if (!user) return;

  if (nameEl) {
    nameEl.textContent = user.displayName || "(No display name)";
  }

  if (emailEl) {
    emailEl.textContent = user.email;
  }
});
