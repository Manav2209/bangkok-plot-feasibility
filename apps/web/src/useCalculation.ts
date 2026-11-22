import { useEffect, useRef, useState } from 'react';
import type { CalculationResult, SiteInput } from '@bangkok/domain';

export function useCalculation(input: SiteInput) {
  const workerRef = useRef<Worker | null>(null);
  const latestRevision = useRef(input.revision);
  latestRevision.current = input.revision;
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<{ revision: number; message: string } | null>(null);
  useEffect(() => {
    const worker = new Worker(new URL('./workers/calculation.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;
    worker.onmessage = (
      event: MessageEvent<{ revision: number; result?: CalculationResult; error?: string }>,
    ) => {
      if (event.data.revision !== latestRevision.current) return;
      if (event.data.result) {
        setResult(event.data.result);
        setError(null);
      } else
        setError({
          revision: event.data.revision,
          message: event.data.error ?? 'Calculation failed.',
        });
    };
    worker.onerror = () =>
      setError({
        revision: latestRevision.current,
        message: 'The calculation worker failed. Refresh the page to retry.',
      });
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);
  useEffect(() => {
    // Coalesce drag events; stale responses never update the displayed geometry or metrics.
    const timeout = window.setTimeout(() => workerRef.current?.postMessage(input), 70);
    return () => window.clearTimeout(timeout);
  }, [input]);
  return {
    result: result?.revision === input.revision ? result : null,
    error: error?.revision === input.revision ? error.message : null,
    pending: result?.revision !== input.revision && error?.revision !== input.revision,
  };
}
