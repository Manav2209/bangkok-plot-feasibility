import type { StudyController } from '../../useStudyController';

export function StudyHeader({ study }: { study: StudyController }) {
  const { setDrawer, save, share, setInputsCollapsed, setResultsCollapsed } = study;
  function navigate(section: string) {
    if (section === 'site-inputs') setInputsCollapsed(false);
    if (section === 'design-results') setResultsCollapsed(false);
    requestAnimationFrame(() => {
      const target = document.getElementById(section);
      target?.scrollIntoView({ block: 'start' });
      target?.focus({ preventScroll: true });
    });
  }
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
      <nav className="workspace-navigation" aria-label="Workspace sections">
        <button onClick={() => navigate('site-inputs')}>Site inputs</button>
        <button onClick={() => navigate('site-view')}>Map view</button>
        <button onClick={() => navigate('design-results')}>Design results</button>
      </nav>
    </>
  );
}
