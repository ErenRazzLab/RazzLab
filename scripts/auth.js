<<<<<<< HEAD
// auth.js
import { firebase, auth, db } from './firebaseConfig.js';

/**
 * Register a new user with email and password.  Creates a user document in Firestore
 * to store profile information such as display name and seller status.
 * @param {string} name display name
 * @param {string} email email address
 * @param {string} password password
 */
export async function registerWithEmailPassword(name, email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  if (!cred || !cred.user) throw new Error('Registration failed');
  const user = cred.user;
  await user.updateProfile({ displayName: name });
  // create user doc
  const userRef = db.collection('users').doc(user.uid);
  await userRef.set({
    displayName: name,
    email: email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    isSeller: false,
    sellerTier: 'basic',
    joinDate: firebase.firestore.FieldValue.serverTimestamp(),
    profilePic: '',
  });
  return user;
}

/**
 * Login with email and password
 * @param {string} email email address
 * @param {string} password password
 */
export async function loginWithEmailPassword(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

/**
 * Sign in using Google provider
 */
export async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await auth.signInWithPopup(provider);
  const user = result.user;
  // create user document if it doesn't exist
  const userRef = db.collection('users').doc(user.uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({
      displayName: user.displayName || '',
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isSeller: false,
      sellerTier: 'basic',
      joinDate: firebase.firestore.FieldValue.serverTimestamp(),
      profilePic: user.photoURL || '',
    });
  }
  return user;
}

/**
 * Sign in using Facebook provider.
 * If the user is new, create a corresponding user document in Firestore.
 */
export async function loginWithFacebook() {
  const provider = new firebase.auth.FacebookAuthProvider();
  const result = await auth.signInWithPopup(provider);
  const user = result.user;
  // create user document if it doesn't exist
  const userRef = db.collection('users').doc(user.uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    await userRef.set({
      displayName: user.displayName || '',
      email: user.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      isSeller: false,
      sellerTier: 'basic',
      joinDate: firebase.firestore.FieldValue.serverTimestamp(),
      profilePic: user.photoURL || '',
    });
  }
  return user;
}

/**
 * Log out the current user
 */
export async function logoutCurrentUser() {
  return auth.signOut();
}

/**
 * Listen for authentication state changes.  Passes the current user
 * or null to the provided callback whenever the sign‑in state changes.
 * @param {function} callback function to run when auth state changes
 */
export function onAuthStateChangedCustom(callback) {
  return auth.onAuthStateChanged(callback);
}

/**
 * Populate the navigation links based on the current authentication state.  Should be
 * called from each page to ensure the nav bar reflects the user's login status.
 */
export async function populateNav() {
  const nav = document.getElementById('nav-links');
  if (!nav) return;
  const user = auth.currentUser;
  nav.innerHTML = '';
  if (user) {
    // fetch seller status
    let isSeller = false;
    try {
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists) {
        isSeller = doc.data().isSeller || false;
      }
    } catch (err) {
      console.error('Error fetching user doc for nav', err);
    }
    // Always show link to listings
    const listingsLink = document.createElement('a');
    listingsLink.href = 'listings.html';
    listingsLink.className = 'text-gray-700 hover:underline';
    listingsLink.textContent = 'Razzes';
    nav.appendChild(listingsLink);
    if (isSeller) {
      const createLink = document.createElement('a');
      createLink.href = 'create.html';
      createLink.className = 'text-gray-700 hover:underline';
      createLink.textContent = 'Create';
      nav.appendChild(createLink);
    }
    const profileLink = document.createElement('a');
    profileLink.href = 'profile.html';
    profileLink.className = 'text-gray-700 hover:underline';
    profileLink.textContent = 'My Profile';
    nav.appendChild(profileLink);
    // Logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'text-gray-700 hover:underline';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', async () => {
      await logoutCurrentUser();
      window.location.href = 'index.html';
    });
    nav.appendChild(logoutBtn);
  } else {
    const listingsLink = document.createElement('a');
    listingsLink.href = 'listings.html';
    listingsLink.className = 'text-gray-700 hover:underline';
    listingsLink.textContent = 'Razzes';
    nav.appendChild(listingsLink);
    const loginLink = document.createElement('a');
    loginLink.href = 'login.html';
    loginLink.className = 'text-gray-700 hover:underline';
    loginLink.textContent = 'Login';
    nav.appendChild(loginLink);
    const registerLink = document.createElement('a');
    registerLink.href = 'register.html';
    registerLink.className = 'text-gray-700 hover:underline';
    registerLink.textContent = 'Register';
    nav.appendChild(registerLink);
  }
}

// Automatically populate nav on auth state change
onAuthStateChangedCustom(() => populateNav());
=======
// scripts/auth.js

// Register form
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = registerForm.email.value;
    const password = registerForm.password.value;

    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "/dashboard.html";
      })
      .catch((err) => alert(err.message));
  });
}

// Login form
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "/dashboard.html";
      })
      .catch((err) => alert(err.message));
  });
}
>>>>>>> d885342 (Initial Firebase launch version)
