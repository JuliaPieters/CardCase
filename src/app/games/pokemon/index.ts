import type { GameModule } from '../registry';
import { config } from './config';
import { PokemonSource } from './source';

export default { config, source: new PokemonSource() } satisfies GameModule;
