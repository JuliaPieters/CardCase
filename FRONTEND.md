# Frontend-conventies

- Standalone components, geen NgModules.
- Elk domein heeft zijn eigen `ui/`-map met componenten die alleen de bijbehorende `Service` injecteren — nooit een `Repo` of `Provider` rechtstreeks.
- State: signals voor lokale/domein-state. Geen aparte state-library tenzij een domein dat expliciet nodig blijkt te hebben (dan vastleggen in het bijbehorende product-spec waarom).
- Styling: <in te vullen — bv. Tailwind of SCSS, kies bewust en leg de keuze hier vast zodra bepaald>.
- Componentnamen: enkelvoud, geen afkortingen (`CardSearchComponent`, niet `CardSrchCmp`).
