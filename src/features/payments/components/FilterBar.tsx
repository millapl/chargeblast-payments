"use client";

import {
  clearedFilters,
  hasActiveFilters,
  summarizeAmount,
  summarizeCurrency,
  summarizeDate,
  summarizeMethod,
  summarizeStatus,
} from "../domain/filter-summary";
import { METHOD_LABELS, STATUS_LABELS } from "../domain/labels";
import { toPaymentsQuery } from "../domain/url-state";
import { CURRENCIES, METHOD_TYPES, PAYMENT_STATUSES } from "../domain/types";
import { usePaymentsUrlState } from "../hooks/usePaymentsUrlState";
import { AmountFilter } from "./filters/AmountFilter";
import { DateFilter } from "./filters/DateFilter";
import { FilterChip } from "./filters/FilterChip";
import { MultiSelectFilter } from "./filters/MultiSelectFilter";
import { SearchFilter } from "./filters/SearchFilter";

const STATUS_OPTIONS = PAYMENT_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}));
const METHOD_OPTIONS = METHOD_TYPES.map((value) => ({
  value,
  label: METHOD_LABELS[value],
}));
const CURRENCY_OPTIONS = CURRENCIES.map((value) => ({ value, label: value }));

export function FilterBar() {
  const [values, setValues] = usePaymentsUrlState();
  const query = toPaymentsQuery(values);

  return (
    <div
      role="group"
      aria-label="Filters"
      className="flex flex-wrap items-center gap-1.5"
    >
      <FilterChip
        label="Date and time"
        summary={summarizeDate(query)}
        onClear={() =>
          void setValues({ range: "all", from: null, to: null, page: 1 })
        }
      >
        {(close) => (
          <DateFilter
            value={{ range: query.range, from: query.from, to: query.to }}
            onApply={(next) => {
              void setValues({ ...next, page: 1 });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="Amount"
        summary={summarizeAmount(query)}
        onClear={() => void setValues({ min: null, max: null, page: 1 })}
      >
        {(close) => (
          <AmountFilter
            min={query.min}
            max={query.max}
            onApply={(next) => {
              void setValues({ ...next, page: 1 });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="Currency"
        summary={summarizeCurrency(query)}
        onClear={() => void setValues({ currency: [], page: 1 })}
      >
        {(close) => (
          <MultiSelectFilter
            title="Currency"
            options={CURRENCY_OPTIONS}
            selected={query.currency}
            onApply={(currency) => {
              void setValues({ currency, page: 1 });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="Status"
        summary={summarizeStatus(query)}
        onClear={() => void setValues({ status: [], page: 1 })}
      >
        {(close) => (
          <MultiSelectFilter
            title="Status"
            options={STATUS_OPTIONS}
            selected={query.status}
            onApply={(status) => {
              void setValues({ status, page: 1 });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="Payment method"
        summary={summarizeMethod(query)}
        onClear={() => void setValues({ method: [], page: 1 })}
      >
        {(close) => (
          <MultiSelectFilter
            title="Payment method"
            options={METHOD_OPTIONS}
            selected={query.method}
            onApply={(method) => {
              void setValues({ method, page: 1 });
              close();
            }}
          />
        )}
      </FilterChip>

      <FilterChip
        label="More filters"
        summary={query.q}
        onClear={() => void setValues({ q: "", page: 1 })}
      >
        {(close) => (
          <SearchFilter
            value={query.q}
            onApply={(q) => {
              void setValues({ q, page: 1 });
              close();
            }}
          />
        )}
      </FilterChip>

      {hasActiveFilters(query) && (
        <button
          type="button"
          onClick={() => void setValues(clearedFilters())}
          className="h-6 rounded-sm px-1 text-xs font-semibold text-accent-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
