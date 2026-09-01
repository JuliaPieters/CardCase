// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const boundaries = require('eslint-plugin-boundaries');

// Laagvolgorde per domein, zie docs/governance/ARCHITECTURE.md: "Types → Config → Repo → Service → UI".
// Afhankelijkheden mogen alleen voorwaarts: een laag mag zichzelf en elke eerdere laag
// importeren, nooit een latere. Providers is de enige cross-cutting laag (Firebase-auth,
// TCG-API's) en mag alleen door Service aangeroepen worden.
const LAYER_ORDER = ['domain-types', 'domain-config', 'domain-repo', 'domain-service', 'domain-ui'];
const forwardLayersFor = (layer) => LAYER_ORDER.slice(0, LAYER_ORDER.indexOf(layer) + 1);
const allowTypes = (types) => types.map((type) => ({ to: { element: { type } } }));

const HTTP_IMPORT_RESTRICTION_MESSAGE =
  'Alleen src/app/providers/** mag een externe HTTP-client of Firebase-SDK direct aanroepen (zie docs/governance/ARCHITECTURE.md).';

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: true },
      // src/app/*.ts (app.ts, app.config.ts, app.routes.ts) is de compositie-root die alles
      // aan elkaar knoopt (DI-registratie van Services en Providers) en blijft bewust
      // buiten deze classificatie — eslint-plugin-boundaries matcht elementen op mappen,
      // niet op losse bestanden.
      'boundaries/include': ['src/**/*.ts'],
      'boundaries/elements': [
        { type: 'domain-types', pattern: 'src/app/domains/*/types/**', capture: ['domain'] },
        { type: 'domain-config', pattern: 'src/app/domains/*/config/**', capture: ['domain'] },
        { type: 'domain-repo', pattern: 'src/app/domains/*/repo/**', capture: ['domain'] },
        { type: 'domain-service', pattern: 'src/app/domains/*/service/**', capture: ['domain'] },
        { type: 'domain-ui', pattern: 'src/app/domains/*/ui/**', capture: ['domain'] },
        { type: 'providers', pattern: 'src/app/providers/**' },
        { type: 'environment', pattern: 'src/environments/**' },
      ],
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],

      // Interface-implementaties (bv. CardProvider) hebben soms een parameter nodig die de
      // huidige (nog niet afgebouwde) implementatie niet gebruikt — zie
      // PokemonTcgProvider.getById/getPrice.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // docs/governance/ARCHITECTURE.md: "Afhankelijkheden mogen alleen voorwaarts" + "Enige laag die
      // Providers mag aanroepen [is Service]". Card/PriceSnapshot (card-catalog/types) zijn
      // het expliciete gedeelde model tussen domeinen (core-beliefs.md #1), dus elke laag
      // mag domain-types uit elk domein importeren — dat is de bewuste uitzondering, geen gat.
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            ...LAYER_ORDER.map((layer) => ({
              from: { element: { type: layer } },
              allow: allowTypes(forwardLayersFor(layer)),
            })),
            {
              from: { element: { type: 'domain-service' } },
              allow: [...allowTypes(forwardLayersFor('domain-service')), { to: { element: { type: 'providers' } } }],
            },
            {
              from: { element: { type: 'providers' } },
              allow: allowTypes(['providers', 'domain-types', 'environment']),
            },
          ],
        },
      ],
    },
  },
  {
    // Exec-plan 00-foundation.md: "alleen bestanden in providers/ mogen externe
    // API-clients (fetch/HTTP) direct aanroepen." `no-restricted-imports` dekt de
    // import-statements (HttpClient, firebase/*); het aparte blok hieronder dekt het
    // fetch()/XMLHttpRequest-globaal, dat geen import-statement is.
    files: ['src/app/**/*.ts'],
    ignores: ['src/app/providers/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@angular/common/http', message: HTTP_IMPORT_RESTRICTION_MESSAGE },
            { name: 'firebase', message: HTTP_IMPORT_RESTRICTION_MESSAGE },
            { name: 'firebase/app', message: HTTP_IMPORT_RESTRICTION_MESSAGE },
            { name: 'firebase/auth', message: HTTP_IMPORT_RESTRICTION_MESSAGE },
            { name: 'firebase/firestore', message: HTTP_IMPORT_RESTRICTION_MESSAGE },
            { name: '@firebase/rules-unit-testing', message: HTTP_IMPORT_RESTRICTION_MESSAGE },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Alleen src/app/providers/** mag fetch() direct aanroepen (zie docs/governance/ARCHITECTURE.md).',
        },
        {
          name: 'XMLHttpRequest',
          message: 'Alleen src/app/providers/** mag XMLHttpRequest direct aanroepen (zie docs/governance/ARCHITECTURE.md).',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
