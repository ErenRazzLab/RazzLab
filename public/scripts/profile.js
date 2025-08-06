// profile.js
import { auth, db, storage, firebase } from './firebaseConfig.js';
import { formatCountdown } from './util.js';

async function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  try {
    const url = await storage.ref(path).getDownloadURL();
    return url;
  } catch (err) {
    console.warn('Image not found:', err);
    return '';
  }
}

async function renderProfile() {
  const user = auth.currentUser;
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const profileHeader = document.getElementById('profile-header');
  const collectionGrid = document.getElementById('collection-grid');
  const noCollection = document.getElementById('no-collection');
  const hostedList = document.getElementById('hosted-list');
  const noHosted = document.getElementById('no-hosted');
  const joinedList = document.getElementById('joined-list');
  const noJoined = document.getElementById('no-joined');
  try {
    // Fetch user document
    const userDoc = await db.collection('users').doc(user.uid).get();
    const uData = userDoc.data();
    // Build profile header
    profileHeader.innerHTML = '';
    const headerFlex = document.createElement('div');
    headerFlex.className = 'flex items-center space-x-4';
    const avatar = document.createElement('div');
    avatar.className = 'h-16 w-16 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xl overflow-hidden';
    if (uData.profilePic) {
      const img = document.createElement('img');
      img.src = uData.profilePic;
      img.alt = 'Avatar';
      img.className = 'h-full w-full object-cover rounded-full';
      avatar.appendChild(img);
    } else {
      const initials = (user.displayName || user.email || '?').substring(0, 2).toUpperCase();
      avatar.textContent = initials;
    }
    headerFlex.appendChild(avatar);
    const info = document.createElement('div');
    const nameEl = document.createElement('h2');
    nameEl.className = 'text-xl font-semibold';
    nameEl.textContent = uData.displayName || user.displayName || user.email;
    info.appendChild(nameEl);
    const emailEl = document.createElement('p');
    emailEl.className = 'text-sm text-gray-600';
    emailEl.textContent = user.email;
    info.appendChild(emailEl);
    const joinDate = uData.joinDate?.toDate ? uData.joinDate.toDate() : new Date(uData.joinDate);
    if (joinDate) {
      const joinEl = document.createElement('p');
      joinEl.className = 'text-xs text-gray-500';
      joinEl.textContent = `Joined: ${joinDate.toLocaleDateString()}`;
      info.appendChild(joinEl);
    }
    if (uData.isSeller) {
      const sellerEl = document.createElement('span');
      sellerEl.className = 'inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mt-1';
      sellerEl.textContent = `Seller Tier: ${uData.sellerTier || 'basic'}`;
      info.appendChild(sellerEl);
    }
    headerFlex.appendChild(info);
    profileHeader.appendChild(headerFlex);
    // Collection: razzes where user is winner
    const collectionSnapshot = await db.collection('razzes').where('winners', 'array-contains', user.uid).get();
    collectionGrid.innerHTML = '';
    if (collectionSnapshot.empty) {
      noCollection.classList.remove('hidden');
    } else {
      noCollection.classList.add('hidden');
      collectionSnapshot.forEach(async (doc) => {
        const data = doc.data();
        const cardDiv = document.createElement('div');
        cardDiv.className = 'bg-white rounded-lg shadow overflow-hidden flex flex-col transform transition hover:-translate-y-1 hover:shadow-lg';
        const img = document.createElement('img');
        getImageUrl(data.imageUrl).then((url) => {
          img.src = url;
        });
        img.alt = data.title;
        img.className = 'w-full h-40 object-cover';
        cardDiv.appendChild(img);
        const body = document.createElement('div');
        body.className = 'p-4 flex flex-col flex-1';
        const titleEl = document.createElement('h4');
        titleEl.className = 'text-lg font-semibold mb-2 flex-1';
        titleEl.textContent = data.title;
        body.appendChild(titleEl);
        // Tag selector
        const label = document.createElement('label');
        label.className = 'text-xs mb-1';
        label.textContent = 'Tag:';
        body.appendChild(label);
        const select = document.createElement('select');
        select.className = 'text-sm border rounded px-2 py-1';
        ['PC', 'FS', 'NFT'].forEach((opt) => {
          const option = document.createElement('option');
          option.value = opt;
          option.textContent = opt;
          select.appendChild(option);
        });
        // Load existing tag from user's collection subcollection
        const collDocRef = db.collection('users').doc(user.uid).collection('collection').doc(doc.id);
        const collDoc = await collDocRef.get();
        if (collDoc.exists) {
          select.value = collDoc.data().tag;
        }
        select.addEventListener('change', async () => {
          try {
            await collDocRef.set({
              tag: select.value,
              title: data.title,
              imageUrl: data.imageUrl,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            });
          } catch (err) {
            console.error('Error updating tag', err);
          }
        });
        body.appendChild(select);
        cardDiv.appendChild(body);
        collectionGrid.appendChild(cardDiv);
      });
    }
    // Hosted razzes
    const hostedSnapshot = await db.collection('razzes').where('sellerId', '==', user.uid).get();
    hostedList.innerHTML = '';
    if (hostedSnapshot.empty) {
      noHosted.classList.remove('hidden');
    } else {
      noHosted.classList.add('hidden');
      hostedSnapshot.forEach(async (doc) => {
        const data = doc.data();
        const item = document.createElement('div');
        item.className = 'border rounded p-4 bg-white';
        const titleEl = document.createElement('h4');
        titleEl.className = 'font-semibold mb-1';
        titleEl.textContent = data.title;
        item.appendChild(titleEl);
        const status = document.createElement('p');
        status.className = 'text-sm mb-1';
        status.textContent = `Status: ${data.status}`;
        item.appendChild(status);
        const participantsEl = document.createElement('p');
        participantsEl.className = 'text-sm mb-1';
        participantsEl.textContent = `${data.participantsCount || 0}/${data.spots} spots filled`;
        item.appendChild(participantsEl);
        if (data.status === 'active') {
          const countdownEl = document.createElement('p');
          countdownEl.className = 'text-xs text-gray-600';
          const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
          countdownEl.textContent = `Ends in ${formatCountdown(endTime)}`;
          item.appendChild(countdownEl);
        } else if (data.status === 'completed') {
          const winners = data.winners || [];
          const winnersEl = document.createElement('p');
          winnersEl.className = 'text-sm';
          winnersEl.textContent = `Winner: ${winners.join(', ') || 'TBD'}`;
          item.appendChild(winnersEl);
        }
        hostedList.appendChild(item);
      });
    }
    // Joined razzes using collectionGroup
    joinedList.innerHTML = '';
    const joinedSnapshot = await db.collectionGroup('participants').where('userId', '==', user.uid).get();
    if (joinedSnapshot.empty) {
      noJoined.classList.remove('hidden');
    } else {
      noJoined.classList.add('hidden');
      // get unique razz ids
      const razzIds = new Set();
      joinedSnapshot.forEach((doc) => {
        const razzId = doc.ref.parent.parent.id;
        razzIds.add(razzId);
      });
      for (const id of razzIds) {
        try {
          const razzDoc = await db.collection('razzes').doc(id).get();
          if (!razzDoc.exists) continue;
          const data = razzDoc.data();
          const item = document.createElement('div');
          item.className = 'border rounded p-4 bg-white';
          const titleEl = document.createElement('h4');
          titleEl.className = 'font-semibold mb-1';
          titleEl.textContent = data.title;
          item.appendChild(titleEl);
          const statusEl = document.createElement('p');
          statusEl.className = 'text-sm mb-1';
          statusEl.textContent = `Status: ${data.status}`;
          item.appendChild(statusEl);
          if (data.status === 'active') {
            const endTime = data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime);
            const countEl = document.createElement('p');
            countEl.className = 'text-xs text-gray-600 mb-1';
            countEl.textContent = `Ends in ${formatCountdown(endTime)}`;
            item.appendChild(countEl);
            const fillEl = document.createElement('p');
            fillEl.className = 'text-sm';
            fillEl.textContent = `${data.participantsCount || 0}/${data.spots} spots filled`;
            item.appendChild(fillEl);
          } else if (data.status === 'completed') {
            const winners = data.winners || [];
            const winnersEl = document.createElement('p');
            winnersEl.className = 'text-sm';
            winnersEl.textContent = `Winner: ${winners.join(', ') || 'TBD'}`;
            item.appendChild(winnersEl);
          }
          joinedList.appendChild(item);
        } catch (err) {
          console.error('Error fetching joined razz', err);
        }
      }
    }
  } catch (err) {
    console.error('Error rendering profile', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderProfile();
});