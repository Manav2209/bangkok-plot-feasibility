import type { StudyController } from '../../useStudyController';
import { RULESET_VERSION, sources } from '@bangkok/rules';

export function StudyDialogs({ study }: { study: StudyController }) {
  const { storageMessage, setStorageMessage, shareUrl, setShareUrl, drawer, setDrawer } = study;
  return (
    <>
      {storageMessage && (
        <div className="toast" role="status">
          {storageMessage}
          <button onClick={() => setStorageMessage('')} aria-label="Dismiss notification">
            ×
          </button>
        </div>
      )}
      {shareUrl && (
        <dialog
          className="share-dialog"
          aria-labelledby="share-title"
          ref={(node) => node?.showModal()}
          onCancel={() => setShareUrl('')}
        >
          <h2 id="share-title">Copy scenario link</h2>
          <p>This link contains the plot and assumptions. Legal feasibility remains unresolved.</p>
          <label htmlFor="scenario-link">Scenario URL</label>
          <textarea
            id="scenario-link"
            readOnly
            value={shareUrl}
            onFocus={(event) => event.currentTarget.select()}
            autoFocus
          />
          <button onClick={() => setShareUrl('')}>Close link</button>
        </dialog>
      )}
      {drawer && (
        <dialog
          className="drawer-dialog"
          ref={(node) => {
            node?.showModal();
            node?.querySelector<HTMLButtonElement>('.close-button')?.focus();
          }}
          aria-labelledby="research-title"
          onCancel={() => setDrawer(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setDrawer(false);
          }}
        >
          <section
            className="research-drawer"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setDrawer(false);
            }}
          >
            <div className="section-heading">
              <span className="panel-eyebrow">EVIDENCE & SCOPE</span>
              <button
                autoFocus
                className="close-button"
                onClick={() => setDrawer(false)}
                aria-label="Close research"
              >
                ×
              </button>
            </div>
            <h2 id="research-title">
              Know what’s measured.
              <br />
              Know what’s missing.
            </h2>
            <p>
              This implementation combines real context, sourced historical reference constraints
              and shared area accounting. It does not establish zoning or permit feasibility.
            </p>
            <h3>What works now</h3>
            <ul>
              <li>Concave plot drawing and boundary editing</li>
              <li>Millimetre-grid offsets that preserve holes and disconnected components</li>
              <li>UTM zone 47N measurements, georeferenced 3D floor geometry and area totals</li>
              <li>Compact and stepped concepts under explicit design assumptions</li>
              <li>Ten source-based core checks for the declared whole-site low-rise model</li>
            </ul>
            <h3>Evidence still needed</h3>
            <p>
              Actual site conditions, additional amendments and overlays, legal road boundaries,
              access rights, waterways, parking, fire access and review requirements. Core numeric
              checks use the cited editions and your explicit model declarations. A vacant-site
              certificate is not required to explore a hypothetical proposal.
            </p>
            <h3>How measurements work</h3>
            <ul>
              <li>
                Plot coordinates are projected into UTM zone 47N metres. Polygon area is calculated
                from the boundary; holes are subtracted.
              </li>
              <li>
                Total floor area is the sum of the actual floor polygons. Parking floors remain
                counted. No FAR bonus or area deduction is claimed.
              </li>
              <li>
                Uncovered ground is plot area minus the union of all modeled overhead cover.
                Planting is an allocation within that ground, not a site inspection.
              </li>
              <li>
                Road clearance is the shortest perpendicular distance from any modeled floor to the
                declared near road boundary. The assumed centreline is half the entered road width
                outside that boundary. The shaded corridor uses the same geometry.
              </li>
              <li>
                Height comes from floor elevations in metres. The 3D view extrudes those same floor
                polygons between their base and top elevations; it does not estimate dimensions from
                screen pixels.
              </li>
              <li>
                Estimated usable area excludes reserved parking floors and then deducts the chosen
                core/circulation fraction. It is not a verified lettable-area measurement.
              </li>
              <li>
                Clipping uses a 1 mm numeric grid; containment checks allow 0.01 m² of numerical
                tolerance. Displayed values are rounded. These tolerances describe computation, not
                survey accuracy.
              </li>
            </ul>
            <h3>Source register</h3>
            {sources.map((source) => (
              <article className="source-card" key={source.id}>
                <span>
                  {source.status === 'verified'
                    ? 'Verified source — read its scope'
                    : source.status === 'located'
                      ? 'Source located — applicability varies'
                      : 'Not verified'}
                </span>
                <h4>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </h4>
                <small>{source.locator}</small>
                <p>{source.note}</p>
              </article>
            ))}
            <h3>Context & measurement</h3>
            <p>
              The neighbourhood is a bundled OpenStreetMap extract under ODbL, with original source
              IDs and tags. All context heights are labelled estimates. The zone comes from BMA's
              2013 GIS. Its catalog leaves the dataset licence unspecified; the portal also links
              general{' '}
              <a
                href="https://data.go.th/th/pages/dga-open-government-license"
                target="_blank"
                rel="noreferrer"
              >
                DGA reuse terms
              </a>
              . Their coverage of this independently served extract is not confirmed. Surveyed
              positional accuracy is unknown; the 1 m study guard is an application assumption.
              Current legal status is a separate check.
            </p>
            <p>
              The example is a 2,500 m² illustrative L-shaped outline near the research area. It is
              not a verified parcel or vacant-site finding. The reference envelope uses historical
              candidates and the chosen study assumptions; it is not a verified maximum legal
              envelope.
            </p>
            <p>
              Gross modelled area is not yet regulated FAR area. Uncovered ground is not a finding
              of open-space or permeability compliance. Concepts have no verified core, access or
              parking allocation.
            </p>
            <p className="drawer-version">
              Ruleset: {RULESET_VERSION} · Scenario format: v3 (v1/v2 saved scenarios are migrated)
            </p>
          </section>
        </dialog>
      )}
    </>
  );
}
