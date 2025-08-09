// firebaseConfig.js
// Replace the values below with your Firebase project's configuration
// You can find these in your Firebase console under Project settings → General → Web app
<<<<<<< HEAD
// The configuration for your Razzify Firebase project.
=======
// The configuration for your RazzLab Firebase project.
>>>>>>> d885342 (Initial Firebase launch version)
// These values come from the Firebase console (Project settings → General).
const firebaseConfig = {
  apiKey: "AIzaSyAayohp64v8A7TKxwWSt18lY9OccKU9Ynk",
  authDomain: "razzify.firebaseapp.com",
  projectId: "razzify",
  storageBucket: "razzify.appspot.com",
  messagingSenderId: "938393032363",
  appId: "1:938393032363:web:7035a7ee298debcf1699ee",
  measurementId: "G-9KDD3X30TY",
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

export { firebase, auth, db, storage };