import type { StudyController } from '../../useStudyController';

export function StudyHeader({ study }: { study: StudyController }) {
  const { setDrawer, save, share } = study;
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-mark">▱</span>plot
          <span className="brand-divider" />{' '}
          <span className="brand-subtitle">Bangkok feasibility lab</span>
        </a>
        <div className="topbar-actions">
          <span className="preview-badge">Reference study · legal checks incomplete</span>
          <button className="quiet-button" onClick={() => setDrawer(true)}>
            Research & sources
          </button>
          <button className="save-button" onClick={save}>
            Save scenario
          </button>
          <button className="save-button" onClick={share}>
            Copy link
          </button>
        </div>
      </header>
    </>
  );
}
