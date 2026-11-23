import { ChevronDown, Search } from "lucide-react";

export function matchesQuery(query, ...values) {
  const search = query.trim().toLowerCase();
  if (!search) return true;
  return values.some((value) =>
    String(value ?? "").toLowerCase().includes(search),
  );
}

function TableHeader({
  title,
  count,
  total,
  icon: Icon,
  query,
  onQueryChange,
  placeholder = "Search...",
  filter,
}) {
  const filtered = total !== undefined && total !== count;
  return (
    <div className="table-header">
      {onQueryChange && (
        <div className="table-header-tools">
          <label className="table-header-search">
            <Search size={17} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
            />
          </label>
          {filter && (
            <label className="table-header-filter">
              <select
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
                aria-label={filter.label || "Filter"}
              >
                {filter.options.map((option) => {
                  const [value, label] = Array.isArray(option)
                    ? option
                    : [option, option];
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown size={16} aria-hidden="true" />
            </label>
          )}
        </div>
      )}
      <div className="table-header-title">
        <div>
          <h3>{title}</h3>
          <p>
            {count} {count === 1 ? "record" : "total records"}
            {filtered ? ` of ${total}` : ""}
          </p>
        </div>
        {Icon && <Icon size={22} aria-hidden="true" />}
      </div>
    </div>
  );
}

export default TableHeader;
