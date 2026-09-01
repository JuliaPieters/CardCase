import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

// Repo-laag test tegen de Firebase-emulator (zie docs/governance/QUALITY.md), nooit tegen
// het echte project. Draai met: npm run test:rules — dat start de emulator via
// `firebase emulators:exec`, wat FIRESTORE_EMULATOR_HOST zet. Zonder emulator (bv. een
// gewone `npm test`) wordt deze suite overgeslagen, niet stilzwijgend "groen".
const emulatorAvailable = Boolean(process.env['FIRESTORE_EMULATOR_HOST']);

describe.skipIf(!emulatorAvailable)('firestore.rules', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'cardcase-rules-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  describe('users/{userId}', () => {
    it('mag door de eigenaar zelf gelezen en geschreven worden', async () => {
      const owner = testEnv.authenticatedContext('user-a');
      await assertSucceeds(setDoc(doc(owner.firestore(), 'users/user-a'), { displayName: 'A' }));
      await assertSucceeds(getDoc(doc(owner.firestore(), 'users/user-a')));
    });

    it('mag niet door een andere gebruiker gelezen worden', async () => {
      await testEnv.withSecurityRulesDisabled((context) =>
        setDoc(doc(context.firestore(), 'users/user-a'), { displayName: 'A' }),
      );

      const otherUser = testEnv.authenticatedContext('user-b');
      await assertFails(getDoc(doc(otherUser.firestore(), 'users/user-a')));
    });

    it('mag niet gelezen worden zonder in te loggen', async () => {
      const anonymous = testEnv.unauthenticatedContext();
      await assertFails(getDoc(doc(anonymous.firestore(), 'users/user-a')));
    });
  });

  describe('portfolios/{portfolioId}', () => {
    it('mag alleen door de eigenaar (ownerId) gelezen worden', async () => {
      await testEnv.withSecurityRulesDisabled((context) =>
        setDoc(doc(context.firestore(), 'portfolios/portfolio-a'), { ownerId: 'user-a' }),
      );

      const owner = testEnv.authenticatedContext('user-a');
      const otherUser = testEnv.authenticatedContext('user-b');

      await assertSucceeds(getDoc(doc(owner.firestore(), 'portfolios/portfolio-a')));
      await assertFails(getDoc(doc(otherUser.firestore(), 'portfolios/portfolio-a')));
    });
  });

  describe('collectionEntries/{entryId}', () => {
    it('mag alleen door de eigenaar van de bijbehorende portfolio gelezen worden', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'portfolios/portfolio-a'), { ownerId: 'user-a' });
        await setDoc(doc(context.firestore(), 'collectionEntries/entry-a'), { portfolioId: 'portfolio-a' });
      });

      const owner = testEnv.authenticatedContext('user-a');
      const otherUser = testEnv.authenticatedContext('user-b');

      await assertSucceeds(getDoc(doc(owner.firestore(), 'collectionEntries/entry-a')));
      await assertFails(getDoc(doc(otherUser.firestore(), 'collectionEntries/entry-a')));
    });
  });

  describe('cardCache/{cardId} (gedeelde cache)', () => {
    it('is leesbaar voor elke ingelogde gebruiker, maar nooit client-side schrijfbaar', async () => {
      await testEnv.withSecurityRulesDisabled((context) =>
        setDoc(doc(context.firestore(), 'cardCache/card-a'), { name: 'Pikachu' }),
      );

      const signedIn = testEnv.authenticatedContext('user-a');
      await assertSucceeds(getDoc(doc(signedIn.firestore(), 'cardCache/card-a')));
      await assertFails(setDoc(doc(signedIn.firestore(), 'cardCache/card-a'), { name: 'Raichu' }));
    });
  });
});
