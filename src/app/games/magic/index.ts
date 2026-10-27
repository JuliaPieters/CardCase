import type { GameModule } from '../registry';
import { config } from './config';
import { MagicSource } from './source';

export default { config, source: new MagicSource(config.languages.map((l) => l.code)) } satisfies GameModule;
