// create.js
import { auth, db, storage, firebase } from './firebaseConfig.js';

const notSellerDiv = document.getElementById('not-seller');
const form = document.getElementById('create-form');
const errorEl = document.getElementById('create-error');
const successEl = document.getElementById('create-success');
const createBtn = document.getElementById('create-btn');

async function initPage() {
  const user = auth.currentUser;
  if (!user) {
    // redirect to login
    window.location.href = 'login.html';
    return;
  }
  // Check seller status
  try {
    const userDoc = await db.collection('users').doc(user.uid).get();
    const data = userDoc.data();
    if (!data || !data.isSeller) {
      notSellerDiv.classList.remove('hidden');
      form.classList.add('hidden');
      return;
    }
  } catch (err) {
    console.error('Error checking seller status', err);
  }
  // Setup form submit handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.add('hidden');
    successEl.classList.add('hidden');
    createBtn.disabled = true;
    try {
      // Get inputs
      const fileInput = document.getElementById('card-image');
      const file = fileInput.files[0];
      if (!file) throw new Error('Please select an image.');
      const title = document.getElementById('title').value.trim();
      const category = document.getElementById('category').value;
      const spots = parseInt(document.getElementById('spots').value, 10);
      const price = parseFloat(document.getElementById('price').value);
      const endTimeStr = document.getElementById('end-time').value;
      if (!endTimeStr) throw new Error('Please select an end time.');
      const endTime = new Date(endTimeStr);
      const isMini = document.getElementById('is-mini').checked;
      const miniWinnersVal = parseInt(document.getElementById('mini-winners')?.value, 10) || 1;
      if (spots <= 1) throw new Error('Number of spots must be at least 2.');
      if (price < 0) throw new Error('Price must be non‑negative.');
      if (endTime <= new Date()) throw new Error('End time must be in the future.');
      if (isMini && miniWinnersVal < 1) throw new Error('Mini winners must be at least 1.');
      // Upload image to Storage
      const storagePath = `razzes/${user.uid}_${Date.now()}_${file.name}`;
      const snapshot = await storage.ref(storagePath).put(file);
      // We store storagePath rather than URL; retrieval uses getDownloadURL later
      const razzData = {
        title,
        category,
        spots,
        pricePerSpot: price,
        endTime: firebase.firestore.Timestamp.fromDate(endTime),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        sellerId: user.uid,
        participantsCount: 0,
        status: 'active',
        imageUrl: storagePath,
        isMini: isMini,
        miniWinners: isMini ? miniWinnersVal : null,
        parentId: '',
        winners: [],
      };
      await db.collection('razzes').add(razzData);
      successEl.textContent = 'Razz created successfully!';
      successEl.classList.remove('hidden');
      form.reset();
    } catch (err) {
      console.error(err);
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      createBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initPage();
});