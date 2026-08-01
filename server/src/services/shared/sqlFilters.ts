// Small helper for building parameterised WHERE clauses.
//
// The same hand-rolled "push a param, append `col = $n`" loop appeared in
// services/cases.ts and services/publicRead.ts, where the placeholder numbers
// had to be tracked by hand. Getting that arithmetic wrong silently binds a
// value to the wrong predicate, so it is worth having one tested shape for it.
//
// SAFETY: column names and raw predicates are interpolated into the statement
// verbatim. Only ever pass literals defined in the source - never user input.
// Values passed to `eq`/`bind` are always bound parameters and are safe.

export class SqlFilters {
  private readonly predicates: string[] = [];
  private readonly values: unknown[] = [];

  /**
   * Adds `column = $n`. Skips undefined/null so optional filters can be passed
   * through without a conditional at every call site.
   */
  eq(column: string, value: unknown): this {
    if (value === undefined || value === null) return this;
    this.predicates.push(`${column} = ${this.bind(value)}`);
    return this;
  }

  /**
   * Adds `column = $n` unconditionally, including when the value is null.
   *
   * Use this for security-critical tenant scoping. Binding null produces
   * `column = NULL`, which matches no rows - failing closed. `eq` would instead
   * omit the predicate and WIDEN the result set, which for a scope check means
   * leaking other tenants' rows.
   */
  eqStrict(column: string, value: unknown): this {
    this.predicates.push(`${column} = ${this.bind(value)}`);
    return this;
  }

  /** Adds a predicate that needs no bound values. */
  raw(predicate: string): this {
    this.predicates.push(predicate);
    return this;
  }

  /**
   * Binds a value and returns its placeholder (`$3`), for predicates that don't
   * fit `eq` - and for trailing LIMIT/OFFSET, which must be numbered after the
   * WHERE parameters.
   */
  bind(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }

  /** `WHERE a AND b`, or an empty string when no predicates were added. */
  whereClause(): string {
    return this.predicates.length
      ? `WHERE ${this.predicates.join(" AND ")}`
      : "";
  }

  /** Bound parameters, in placeholder order. */
  params(): unknown[] {
    return [...this.values];
  }
}
