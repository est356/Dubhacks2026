"use client";

import type { SpotFilters } from "@/types";

interface FilterBarProps {
  filters: SpotFilters;
  onChange: (next: SpotFilters) => void;
  resultCount: number;
}

export default function FilterBar({
  filters,
  onChange,
  resultCount,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <label className="filter-bar__search">
        <span className="sr-only">Search spots</span>
        <input
          type="search"
          placeholder="Search cafes, libraries, vibes…"
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
        />
      </label>
      <div className="filter-bar__row">
        <select
          aria-label="Wi-Fi"
          value={filters.wifi}
          onChange={(e) =>
            onChange({
              ...filters,
              wifi: e.target.value as SpotFilters["wifi"],
            })
          }
        >
          <option value="any">Wi-Fi: any</option>
          <option value="fast">Fast</option>
          <option value="med">Medium</option>
          <option value="slow">Slow</option>
        </select>
        <select
          aria-label="Outlets"
          value={filters.outlets}
          onChange={(e) =>
            onChange({
              ...filters,
              outlets: e.target.value as SpotFilters["outlets"],
            })
          }
        >
          <option value="any">Outlets: any</option>
          <option value="every-table">Every table</option>
          <option value="few">Few</option>
          <option value="none">None</option>
        </select>
        <select
          aria-label="Noise"
          value={filters.noise}
          onChange={(e) =>
            onChange({
              ...filters,
              noise: e.target.value as SpotFilters["noise"],
            })
          }
        >
          <option value="any">Noise: any</option>
          <option value="quiet">Quiet</option>
          <option value="chatter">Chatter</option>
          <option value="loud">Loud</option>
        </select>
        <select
          aria-label="Seating"
          value={filters.minSeating}
          onChange={(e) =>
            onChange({ ...filters, minSeating: Number(e.target.value) })
          }
        >
          <option value={1}>Seating: any</option>
          <option value={3}>Roomy (3+)</option>
          <option value={4}>Spacious (4+)</option>
          <option value={5}>Huge (5)</option>
        </select>
      </div>
      <p className="filter-bar__count">{resultCount} spots</p>
    </div>
  );
}
