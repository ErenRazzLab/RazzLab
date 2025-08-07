// scripts/load-razzes.js

const razzList = document.getElementById("razz-list");

async function loadRazzes() {
  try {
    const snapshot = await firebase.firestore()
      .collection("razzes")
      .where("isActive", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      razzList.innerHTML = "<p>No active razzes found.</p>";
      return;
    }

    razzList.innerHTML = ""; // Clear before rendering

    snapshot.forEach((doc) => {
      const razz = doc.data();
      const item = document.createElement("div");
      item.className = "bg-white shadow rounded p-4 mb-4";

      item.innerHTML = `
        <h3 class="text-lg font-semibold">${razz.title}</h3>
        <p class="text-sm text-gray-600">Category: ${razz.category} • ${razz.slots} spots at $${razz.price.toFixed(2)} each</p>
        <p class="text-sm text-gray-500">Ends: ${new Date(razz.endTime).toLocaleString()}</p>
      `;

      razzList.appendChild(item);
    });
  } catch (err) {
    console.error("Failed to load razzes:", err);
    razzList.innerHTML = "<p class='text-red-500'>Error loading razzes.</p>";
  }
}

firebase.auth().onAuthStateChanged((user) => {
  loadRazzes();
});
