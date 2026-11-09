import type { TemplateManifest } from '../types';
import { nd136_01 } from './nd136-01';
import { tt05_03 } from './tt05-03';
import { tt08_01 } from './tt08-01';
import { tt08_02 } from './tt08-02';
import { tt08_05 } from './tt08-05';
import { tt32_01a } from './tt32-01a';
import { tt32_04 } from './tt32-04';

export { nd136_01, tt05_03, tt08_01, tt08_02, tt08_05, tt32_01a, tt32_04 };

/** Manifest của mọi mẫu đã có template gắn tag trong public/templates/. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MANIFESTS: TemplateManifest<any>[] = [nd136_01, tt08_01, tt08_02, tt08_05, tt32_01a, tt32_04, tt05_03];
