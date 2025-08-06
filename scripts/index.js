// index.js
import { db, storage } from './firebaseConfig.js';
import { formatCountdown } from './util.js';
// Import navigation helpers so the home page navigation is populated for
// both authenticated and unauthenticated users. Without explicitly calling
// populateNav on this page, the nav bar may remain empty.
import { populateNav, onAuthStateChangedCustom, loginWithEmailPassword, loginWithGoogle, loginWithFacebook } from './auth.js';

// Helper to get image URL from storage path
async function getImageUrl(path) {
  try {
    const url = await storage.ref(path).getDownloadURL();
    return url;
  } catch (err) {
    console.warn('Could not fetch image URL', err);
    return '';
  }
}

// Render live razzes preview (max 4)
async function renderLiveRazzes() {
  const container = document.getElementById('live-razzes');
  if (!container) return;
  container.innerHTML = '';
  try {
    let query = db.collection('razzes').where('status', '==', 'active').orderBy('endTime', 'asc').limit(4);
    const snapshot = await query.get();
    if (snapshot.empty) {
      container.innerHTML = '<p class="col-span-4 text-gray-500">No active razzes right now.</p>';
      return;
    }
    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg shadow overflow-hidden flex flex-col transform transition hover:-translate-y-1 hover:shadow-lg';
      const img = document.createElement('img');
      // If data.imageUrl is stored as a URL, use it directly; otherwise fetch from storage
      if (data.imageUrl && data.imageUrl.startsWith('http')) {
        img.src = data.imageUrl;
      } else if (data.imageUrl) {
        getImageUrl(data.imageUrl).then((url) => {
          img.src = url;
        });
      } else {
        img.src = '';
      }
      img.alt = data.title || 'Card image';
      img.className = 'w-full h-40 object-cover';
      card.appendChild(img);
      const inner = document.createElement('div');
      inner.className = 'p-4 flex flex-col flex-1';
      const title = document.createElement('h3');
      title.className = 'text-lg font-semibold mb-2 flex-1';
      title.textContent = data.title;
      inner.appendChild(title);
      const price = document.createElement('p');
      price.className = 'text-sm mb-1';
      price.innerHTML = `<strong>$${data.pricePerSpot}</strong> per spot`;
      inner.appendChild(price);
      const spotsFilled = document.createElement('p');
      const participantsCount = data.participantsCount || 0;
      spotsFilled.className = 'text-sm mb-2';
      spotsFilled.textContent = `${participantsCount}/${data.spots} spots filled`;
      inner.appendChild(spotsFilled);
      // Countdown
      const countdown = document.createElement('p');
      countdown.className = 'text-xs text-gray-600';
      function updateCountdown() {
        const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
        countdown.textContent = formatCountdown(endTime);
      }
      updateCountdown();
      inner.appendChild(countdown);
      // Append inner
      card.appendChild(inner);
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error fetching live razzes', err);
  }
}

// Render recent winners preview (max 4)
async function renderRecentWinners() {
  const container = document.getElementById('recent-winners');
  if (!container) return;
  container.innerHTML = '';
  try {
    let query = db.collection('razzes').where('status', '==', 'completed').orderBy('completedAt', 'desc').limit(4);
    const snapshot = await query.get();
    if (snapshot.empty) {
      container.innerHTML = '<p class="col-span-4 text-gray-500">No completed razzes yet.</p>';
      return;
    }
    snapshot.forEach(async (doc) => {
      const data = doc.data();
      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg shadow overflow-hidden transform transition hover:-translate-y-1 hover:shadow-lg';
      const img = document.createElement('img');
      if (data.imageUrl && data.imageUrl.startsWith('http')) {
        img.src = data.imageUrl;
      } else if (data.imageUrl) {
        getImageUrl(data.imageUrl).then((url) => {
          img.src = url;
        });
      } else {
        img.src = '';
      }
      img.alt = data.title || 'Card image';
      img.className = 'w-full h-32 object-cover';
      card.appendChild(img);
      const body = document.createElement('div');
      body.className = 'p-4';
      const title = document.createElement('h3');
      title.className = 'text-lg font-semibold mb-2';
      title.textContent = data.title;
      body.appendChild(title);
      const winners = data.winners || [];
      const winnersEl = document.createElement('p');
      winnersEl.className = 'text-sm text-gray-700';
      if (winners.length > 0) {
        winnersEl.textContent = 'Winner: ' + winners.map((w) => w.displayName || w).join(', ');
      } else {
        winnersEl.textContent = 'Winner: TBD';
      }
      body.appendChild(winnersEl);
      card.appendChild(body);
      container.appendChild(card);
    });
  } catch (err) {
    console.error('Error fetching winners', err);
  }
}

// Update footer year
function updateYear() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderLiveRazzes();
  renderRecentWinners();
  updateYear();
  // Populate the navigation links on initial load and respond to
  // authentication state changes. This ensures the nav bar shows login
  // and register links or profile/logout depending on whether the user
  // is signed in. Without this call, the nav on the home page may stay
  // empty.
  onAuthStateChangedCustom(() => populateNav());

  // Home page login handling
  const loginSection = document.getElementById('home-login-section');
  const loginForm = document.getElementById('home-login-form');
  const emailInput = document.getElementById('home-email');
  const passwordInput = document.getElementById('home-password');
  const errorEl = document.getElementById('home-login-error');
  const googleBtn = document.getElementById('home-google-login');
  const facebookBtn = document.getElementById('home-facebook-login');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (errorEl) errorEl.classList.add('hidden');
      try {
        await loginWithEmailPassword(emailInput.value, passwordInput.value);
        // after successful login, redirect to homepage to refresh nav
        window.location.href = 'index.html';
      } catch (err) {
        console.error(err);
        if (errorEl) {
          errorEl.textContent = err.message || 'Login failed';
          errorEl.classList.remove('hidden');
        }
      }
    });
  }

  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      if (errorEl) errorEl.classList.add('hidden');
      try {
        await loginWithGoogle();
        window.location.href = 'index.html';
      } catch (err) {
        console.error(err);
        if (errorEl) {
          errorEl.textContent = err.message || 'Google login failed';
          errorEl.classList.remove('hidden');
        }
      }
    });
  }

  if (facebookBtn) {
    facebookBtn.addEventListener('click', async () => {
      if (errorEl) errorEl.classList.add('hidden');
      try {
        await loginWithFacebook();
        window.location.href = 'index.html';
      } catch (err) {
        console.error(err);
        if (errorEl) {
          errorEl.textContent = err.message || 'Facebook login failed';
          errorEl.classList.remove('hidden');
        }
      }
    });
  }

  // Show or hide the login section based on authentication state
  onAuthStateChangedCustom((user) => {
    if (!loginSection) return;
    if (user) {
      loginSection.classList.add('hidden');
    } else {
      loginSection.classList.remove('hidden');
    }
  });
});