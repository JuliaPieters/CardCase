// Productie-omgeving, zie docs/governance/ENVIRONMENTS.md. Firebase's client-side
// webconfig (apiKey/authDomain/appId/...) is geen secret — Firestore-toegang wordt
// afgedwongen door firestore.rules, niet door geheimhouding van deze waarden (zie
// docs/governance/SECURITY.md). Vul aan zodra de web-app in de Firebase-console is
// geregistreerd (Project instellingen → Je apps), of via `firebase apps:sdkconfig web`.
export const environment = {
  production: true,
  useFirebaseEmulator: false,
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: 'cardcase-549a7',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
};
