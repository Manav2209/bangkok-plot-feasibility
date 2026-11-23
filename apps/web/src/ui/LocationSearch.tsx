import { useState } from 'react';
import type { ContextCollection } from '../useSiteData';

export function LocationSearch({
  context,
  onLocate,
}: {
  context: ContextCollection | null;
  onLocate: (point: [number, number]) => void;
}) {
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [found, setFound] = useState<{ label: string; point: [number, number] }[]>([]);
  function search() {
    const coordinates = query.split(',').map(Number);
    if (
      coordinates.length === 2 &&
      coordinates.every(Number.isFinite) &&
      Math.abs(coordinates[0]) <= 180 &&
      Math.abs(coordinates[1]) <= 85
    ) {
      onLocate(coordinates as [number, number]);
      setNotice('Located coordinates. Drawing outside the supported zone disables results.');
      setFound([]);
      return;
    }
    const results: { label: string; point: [number, number] }[] = [];
    const collection = context?.type === 'FeatureCollection' ? context : null;
    for (const feature of collection?.features ?? []) {
      const properties = feature.properties ?? {};
      const tags =
        typeof properties.osmTags === 'string'
          ? JSON.parse(properties.osmTags)
          : (properties.osmTags ?? {});
      const label = [properties.name, tags['addr:housenumber'], tags['addr:street']]
        .filter(Boolean)
        .join(' ');
      if (
        !label ||
        !query.trim() ||
        !label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
      )
        continue;
      const geometry = feature.geometry;
      const first =
        geometry?.type === 'LineString'
          ? geometry.coordinates[0]
          : geometry?.type === 'Polygon'
            ? geometry.coordinates[0]?.[0]
            : undefined;
      if (first && first.length >= 2 && !results.some((r) => r.label === label))
        results.push({ label, point: [first[0], first[1]] });
      if (results.length >= 8) break;
    }
    setFound(results);
    setNotice(
      results.length
        ? 'Mapped addresses/roads from the local extract.'
        : 'No matching local address. Try a mapped road name or longitude, latitude.',
    );
  }
  return (
    <section className="location-search">
      <label htmlFor="location-query">Find a local address or road</label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <input
          id="location-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Soi name or longitude, latitude"
        />
        <button type="submit">Locate</button>
      </form>
      {notice && <p className="field-hint">{notice}</p>}
      {found.length > 0 && (
        <ul>
          {found.map((result) => (
            <li key={result.label}>
              <button onClick={() => onLocate(result.point)}>{result.label}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
