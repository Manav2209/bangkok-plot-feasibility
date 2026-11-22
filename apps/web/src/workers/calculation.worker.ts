import type { SiteInput } from '@bangkok/domain';
import { calculate } from '@bangkok/engine';

self.onmessage = (event: MessageEvent<SiteInput>) => {
  try {
    self.postMessage({ revision: event.data.revision, result: calculate(event.data) });
  } catch {
    self.postMessage({
      revision: event.data.revision,
      error: 'This geometry could not be calculated. Edit the boundary or reset the example.',
    });
  }
};
