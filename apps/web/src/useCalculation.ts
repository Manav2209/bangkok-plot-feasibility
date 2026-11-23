import { useEffect, useRef, useState } from 'react';
import type { CalculationResult, SiteInput } from '@bangkok/domain';
import { calculateEnvelope } from '@bangkok/engine';

export function useCalculation(input: SiteInput) {
  const latestRevision = useRef(input.revision);
  latestRevision.current = input.revision;
  const workerRef = useRef<Worker | null>(null);
  const busyRef = useRef(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [preview, setPreview] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<{ revision: number; message: string } | null>(null);
  const spawnRef = useRef<() => Worker>(() => {
    throw new Error('Worker lifecycle has not started.');
  });
  useEffect(() => {
    function spawn() {
      const worker = new Worker(new URL('./workers/calculation.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;
      busyRef.current = false;
      worker.onmessage = (
        event: MessageEvent<{ revision: number; result?: CalculationResult; error?: string }>,
      ) => {
        if (workerRef.current !== worker) return;
        busyRef.current = false;
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
      worker.onerror = () => {
        if (workerRef.current !== worker) return;
        worker.terminate();
        workerRef.current = null;
        busyRef.current = false;
        setError({
          revision: latestRevision.current,
          message: 'Calculation unavailable. Edit an input or reset to retry.',
        });
      };
      return worker;
    }
    spawnRef.current = spawn;
    spawn();
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      busyRef.current = false;
    };
  }, []);
  useEffect(() => {
    // Keep an idle worker warm. Only terminate when obsolete search is actually running.
    if (busyRef.current) {
      workerRef.current?.terminate();
      workerRef.current = null;
      busyRef.current = false;
    }
    if (!workerRef.current) spawnRef.current();
    let envelope: CalculationResult | undefined;
    try {
      envelope = calculateEnvelope(input);
      setPreview(envelope);
    } catch {
      setPreview(null);
    }
    const timeout = window.setTimeout(() => {
      const worker = workerRef.current ?? spawnRef.current();
      busyRef.current = true;
      worker.postMessage({ input, envelope });
    }, 32);
    return () => window.clearTimeout(timeout);
  }, [input]);
  return {
    result: result?.revision === input.revision ? result : null,
    preview: preview?.revision === input.revision ? preview : null,
    error: error?.revision === input.revision ? error.message : null,
    pending: result?.revision !== input.revision && error?.revision !== input.revision,
  };
}
