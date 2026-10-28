import type { GameModule } from '../registry';
import { config } from './config';
import { OnePieceSource } from './source';

export default { config, source: new OnePieceSource() } satisfies GameModule;
