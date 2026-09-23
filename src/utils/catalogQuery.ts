// Retry transient reads once; never convert a failed read into an empty list.
export async function catalogQuery<T>(query: () => PromiseLike<{ data: T; error: unknown }>) {
  for (let attempt = 0; ; attempt++) {
    try {
      const result = await query();
      if (!result.error || attempt === 1) return result;
    } catch (error) {
      if (attempt === 1) return { data: null, error };
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export async function catalogPages<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  const pageSize = 10;
  for (let from = 0; ; from += pageSize) {
    const result = await catalogQuery(() => query(from, from + pageSize - 1));
    if (result.error) return { data: null, error: result.error };
    const page = result.data || [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
}
