// listings.js
import { auth, db, storage, firebase } from './firebaseConfig.js';
import { formatCountdown } from './util.js';

let allRazzes = [];

// Fetch all active razzes on page load
async function fetchActiveRazzes() {
  try {
    const snapshot = await db.collection('razzes').where('status', '==', 'active').get();
    allRazzes = snapshot.docs.map((doc) => {
      const data = doc.data();
      data.id = doc.id;
      return data;
    });
  } catch (err) {
    console.error('Error fetching razzes', err);
  }
}

// Apply category filter and sorting
function applyFilters() {
  const categorySel = document.getElementById('category-filter');
  const sortSel = document.getElementById('sort-by');
  const category = categorySel ? categorySel.value : 'all';
  const sort = sortSel ? sortSel.value : 'ending';
  let filtered = allRazzes.slice();
  if (category !== 'all') {
    filtered = filtered.filter((r) => (r.category || 'other') === category);
  }
  // Compute derived values for sorting
  filtered.sort((a, b) => {
    if (sort === 'ending') {
      const aTime = a.endTime?.toDate ? a.endTime.toDate().getTime() : new Date(a.endTime).getTime();
      const bTime = b.endTime?.toDate ? b.endTime.toDate().getTime() : new Date(b.endTime).getTime();
      return aTime - bTime;
    } else if (sort === 'spots') {
      const aFilled = (a.participantsCount || 0) / (a.spots || 1);
      const bFilled = (b.participantsCount || 0) / (b.spots || 1);
      return bFilled - aFilled;
    } else if (sort === 'newest') {
      const aCreated = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
      const bCreated = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
      return bCreated - aCreated;
    }
    return 0;
  });
  return filtered;
}

// Helper to fetch download URL from storage if necessary
async function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  try {
    const url = await storage.ref(path).getDownloadURL();
    return url;
  } catch (err) {
    console.warn('Could not get image URL', err);
    return '';
  }
}

// Render the grid of razzes
async function renderRazzGrid() {
  const grid = document.getElementById('razz-grid');
  const emptyMsg = document.getElementById('empty-message');
  if (!grid) return;
  grid.innerHTML = '';
  const list = applyFilters();
  if (list.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  } else {
    emptyMsg.classList.add('hidden');
  }
  for (const data of list) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow overflow-hidden flex flex-col transform transition hover:-translate-y-1 hover:shadow-lg';
    // image
    const img = document.createElement('img');
    img.alt = data.title || 'Card image';
    img.className = 'w-full h-40 object-cover';
    // asynchronous load image
    getImageUrl(data.imageUrl).then((url) => {
      img.src = url;
    });
    card.appendChild(img);
    // body
    const body = document.createElement('div');
    body.className = 'p-4 flex flex-col flex-1';
    const title = document.createElement('h3');
    title.className = 'text-lg font-semibold mb-1';
    title.textContent = data.title;
    body.appendChild(title);
    const price = document.createElement('p');
    price.className = 'text-sm mb-1';
    price.innerHTML = `<strong>$${data.pricePerSpot}</strong> / spot`;
    body.appendChild(price);
    const participantsCount = data.participantsCount || 0;
    const spotsInfo = document.createElement('p');
    spotsInfo.className = 'text-sm mb-2';
    spotsInfo.textContent = `${participantsCount}/${data.spots} spots filled`;
    body.appendChild(spotsInfo);
    // progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'w-full bg-gray-200 rounded-full h-2 mb-2';
    const progress = document.createElement('div');
    progress.className = 'bg-purple-600 h-2 rounded-full';
    const ratio = participantsCount / data.spots;
    progress.style.width = `${Math.min(100, ratio * 100)}%`;
    progressContainer.appendChild(progress);
    body.appendChild(progressContainer);
    // countdown
    const countdown = document.createElement('p');
    countdown.className = 'text-xs text-gray-600 mb-2';
    function updateCountdown() {
      const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
      countdown.textContent = formatCountdown(endTime);
    }
    updateCountdown();
    body.appendChild(countdown);
    // join button
    const joinBtn = document.createElement('button');
    joinBtn.className = 'mt-auto bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition';
    joinBtn.textContent = 'Join';
    joinBtn.addEventListener('click', async () => {
      await joinRazz(data);
    });
    body.appendChild(joinBtn);
    card.appendChild(body);
    grid.appendChild(card);
  }
}

// Join a razz by adding participant document
async function joinRazz(razz) {
  const user = auth.currentUser;
  if (!user) {
    // redirect to login
    window.location.href = 'login.html';
    return;
  }
  const razzId = razz.id;
  const participantsRef = db.collection('razzes').doc(razzId).collection('participants').doc(user.uid);
  const participantDoc = await participantsRef.get();
  if (participantDoc.exists) {
    alert('You have already joined this razz.');
    return;
  }
  // assign next spot number sequentially
  const currentCount = razz.participantsCount || 0;
  const nextSpotNumber = currentCount + 1;
  if (nextSpotNumber > razz.spots) {
    alert('This razz is full.');
    return;
  }
  try {
    await participantsRef.set({
      userId: user.uid,
      displayName: user.displayName || '',
      joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
      spotNumber: nextSpotNumber,
    });
    // update participantsCount atomically
    await db.collection('razzes').doc(razzId).update({
      participantsCount: firebase.firestore.FieldValue.increment(1),
    });
    alert('Successfully joined! Good luck!');
    // update local state and re-render
    razz.participantsCount = nextSpotNumber;
    renderRazzGrid();
  } catch (err) {
    console.error('Error joining razz', err);
    alert('Error joining razz. Please try again later.');
  }
}

// Event listeners for filter and sort
function setUpControls() {
  const categorySel = document.getElementById('category-filter');
  const sortSel = document.getElementById('sort-by');
  if (categorySel) categorySel.addEventListener('change', renderRazzGrid);
  if (sortSel) sortSel.addEventListener('change', renderRazzGrid);
}

document.addEventListener('DOMContentLoaded', async () => {
  await fetchActiveRazzes();
  setUpControls();
  renderRazzGrid();
});