// scripts/dynamic-nav.js

firebase.auth().onAuthStateChanged((user) => {
  const nav = document.getElementById("nav-links");
  if (!nav) return;

  nav.innerHTML = "";

  if (user) {
    nav.innerHTML = \`
      <a href="/listings.html" class="text-gray-700 hover:underline">Razzes</a>
      <a href="/create.html" class="text-gray-700 hover:underline">Create</a>
      <a href="/dashboard.html" class="text-gray-700 hover:underline">Dashboard</a>
      <button id="logout-btn" class="text-red-600 hover:underline">Logout</button>
    \`;

    // Attach logout listener
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
  } else {
    nav.innerHTML = \`
      <a href="/listings.html" class="text-gray-700 hover:underline">Razzes</a>
      <a href="/login.html" class="text-gray-700 hover:underline">Login</a>
      <a href="/register.html" class="text-gray-700 hover:underline">Register</a>
    \`;
  }
});
