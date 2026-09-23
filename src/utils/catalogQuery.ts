// Retry transient reads once; never convert a failed read into an empty list.
export async function catalogQuery<T>(query: (signal: AbortSignal) => PromiseLike<{ data: T; error: unknown }>, timeoutMs = 12000) {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error('O servidor demorou para responder. Tente novamente em instantes.'));
        }, timeoutMs);
      });
      const result = await Promise.race([query(controller.signal), timeout]);
      if (!result.error || attempt === 1) return result;
    } catch (error) {
      if (attempt === 1) return { data: null, error };
    } finally {
      clearTimeout(timer);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export async function catalogPages<T>(query: (from: number, to: number, signal: AbortSignal) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  const pageSize = 10;
  for (let from = 0; ; from += pageSize) {
    const result = await catalogQuery(signal => query(from, from + pageSize - 1, signal));
    if (result.error) return { data: null, error: result.error };
    const page = result.data || [];
    rows.push(...page);
    if (page.length < pageSize) return { data: rows, error: null };
  }
}
