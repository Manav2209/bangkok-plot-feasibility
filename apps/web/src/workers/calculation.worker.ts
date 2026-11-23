import type { CalculationResult, SiteInput } from '@bangkok/domain';
import { calculate } from '@bangkok/engine';

self.onmessage = (event: MessageEvent<{ input: SiteInput; envelope?: CalculationResult }>) => {
  try {
    self.postMessage({
      revision: event.data.input.revision,
      result: calculate(event.data.input, event.data.envelope),
    });
  } catch {
    self.postMessage({
      revision: event.data.input.revision,
      error: 'This geometry could not be calculated. Edit the boundary or reset the example.',
    });
  }
};
