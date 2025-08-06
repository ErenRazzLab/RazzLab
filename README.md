# Razzify

Welcome to **Razzify**, a peer‑to‑peer platform for “razzing” (raffling) collectible cards including NBA, NFL, Soccer and Pokémon cards.  This repository contains a ready‑to‑deploy Firebase web application written using plain HTML, Tailwind CSS and vanilla JavaScript.  It showcases a fun, energetic design inspired by the Razzify brand and implements core functionality such as user authentication, listing and joining razzes, creating new razzes (for approved sellers), user profiles and fair draw execution using cryptographic randomness.

## Project structure

```
razzify/
├── firebase.json         # Firebase hosting configuration
├── firestore.rules       # Sample Firestore security rules
├── .firebaserc           # Placeholder Firebase project mapping
├── README.md             # This file
└── public/               # Web application served by Firebase Hosting
    ├── index.html        # Landing page
    ├── login.html        # User login page
    ├── register.html     # User registration page
    ├── listings.html     # Active razzes listing page
    ├── create.html       # Razz creation page (seller only)
    ├── profile.html      # User profile page
    ├── terms.html        # Terms of service
    ├── privacy.html      # Privacy policy
    ├── fee-policy.html   # Fee policy
    ├── seller-agreement.html # Seller agreement
    └── scripts/          # Client‑side JavaScript modules
        ├── firebaseConfig.js # Placeholder Firebase configuration and initialization
        ├── auth.js        # Authentication and user state management
        ├── index.js       # Logic for the landing page
        ├── listings.js    # Logic for the listings page
        ├── create.js      # Logic for creating a new razz
        ├── profile.js     # Logic for the user profile page
        ├── util.js        # Shared helper functions (e.g. fairness draw)
        └── vendors/       # Vendor scripts if needed
```

## Getting started

1. **Install the Firebase CLI** and initialize your project:

   ```sh
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

   Choose “Hosting” when prompted, and point it to the `public/` directory.  You can also configure Firestore and Storage as needed.

2. **Add your Firebase configuration**

   Replace the placeholder values in `public/scripts/firebaseConfig.js` with your actual Firebase project credentials.  You can find these in your Firebase console under **Project settings → General → Your apps**.

3. **Deploy to Firebase**

   After you’ve customized the app and tested it locally, deploy it to Firebase Hosting:

   ```sh
   firebase deploy --only hosting
   ```

## Notes

* This project uses the Firebase v9 compat libraries via the CDN for simplicity.  You can migrate to the modular syntax if you prefer.
* The draw execution is configured to use [random.org](https://api.random.org) by default.  By adding your random.org API key to `public/scripts/util.js`, the application will request truly random integers from random.org’s JSON‑RPC service for draw execution.  If the request fails or no key is supplied, it gracefully falls back to the browser’s `crypto.getRandomValues()` API.
* The user interface uses Tailwind CSS via its CDN build (`https://cdn.tailwindcss.com`).  Feel free to customize the styling and components to match your brand.

Enjoy building with Razzify!  💜