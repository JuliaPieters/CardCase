import type { GameModule } from '../registry';
import { config } from './config';
import { LorcanaSource } from './source';

export default { config, source: new LorcanaSource() } satisfies GameModule;
