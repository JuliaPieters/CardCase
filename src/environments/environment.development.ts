// Lokaal/dev: draait altijd tegen de Firebase-emulator, nooit tegen het echte project
// (zie docs/governance/ENVIRONMENTS.md — "harde regel"). Dezelfde projectId als
// productie is de standaard Firebase-aanpak voor emulators: de SDK verbindt expliciet met
// de emulator-poorten (zie providers/firebase) en raakt daardoor nooit het echte project.
// apiKey is een placeholder — de emulator valideert 'm niet.
export const environment = {
  production: false,
  useFirebaseEmulator: true,
  firebase: {
    apiKey: 'demo-cardcase-emulator-key',
    authDomain: 'localhost',
    projectId: 'cardcase-549a7',
    storageBucket: '',
    messagingSenderId: '',
    appId: 'demo-cardcase-emulator-app',
  },
};
