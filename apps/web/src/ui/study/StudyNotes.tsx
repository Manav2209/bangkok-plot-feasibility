import type { StudyController } from '../../useStudyController';
import { number } from './format';

/** Blocking problems stay visible; supporting notes are available on demand. */
export function StudyNotes({ study }: { study: StudyController }) {
  const { result } = study;
  const messages = result?.diagnostics ?? [];
  const notes = messages.map((message) => (
    <div className="state-message" role="status" key={message}>
      {message}
    </div>
  ));
  if (!result?.designs.length) return <>{notes}</>;
  return (
    <details className="study-notes">
      <summary>
        Study notes <span>{messages.length}</span>
      </summary>
      <p className="field-hint">Scope, input limitations and calculation details for this study.</p>
      {notes}
      {result.search && (
        <p className="field-hint">
          Search: {result.search.tested.toLocaleString()} bounded trials · {result.search.outcome}.
          {result.timingMs &&
            ` Envelope ${number(result.timingMs.envelope, 1)} ms; designs ${number(result.timingMs.designs, 1)} ms.`}
        </p>
      )}
    </details>
  );
}
