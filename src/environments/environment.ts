// Productie-omgeving, zie docs/governance/ENVIRONMENTS.md. Firebase's client-side
// webconfig (apiKey/authDomain/appId/...) is geen secret — Firestore-toegang wordt
// afgedwongen door firestore.rules, niet door geheimhouding van deze waarden (zie
// docs/governance/SECURITY.md). Webconfig komt uit de Firebase-console (Project
// instellingen → Je apps → web-app "cardcase").
export const environment = {
  production: true,
  useFirebaseEmulator: false,
  firebase: {
    apiKey: 'AIzaSyAJiak1iIcuk0Qt1lPkiy4tgwLWvMvC66c',
    authDomain: 'cardcase-549a7.firebaseapp.com',
    projectId: 'cardcase-549a7',
    storageBucket: 'cardcase-549a7.firebasestorage.app',
    messagingSenderId: '514798692066',
    appId: '1:514798692066:web:8d6de3d579e89cee5660bb',
  },
};
