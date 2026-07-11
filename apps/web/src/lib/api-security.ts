// Typed client for /api/security/export.
//
// The Security page's "Export Data" button calls `downloadBusinessExport`,
// which fetches the JSON dump with a bearer token, triggers a browser
// file download via a temporary `<a download>` link, and tolerantly
// falls back to the `attachment; filename="…"` header the server set.
//
// Browser auto-download occurs because the backend sets
// `Content-Disposition: attachment`. We don't need any DOM injection
// for the canonical path — the browser handles it. The fallback uses
// a Blob + object URL anchor for environments that strip headers
// (e.g. some proxies / certain service-worker configurations).

export type ApiError = {
  status: number;
  message: string;
  error?: string;
};

async function authedFetchRaw(
  path: string,
  init: RequestInit & { token: string },
): Promise<Response> {
  const { token, headers, ...rest } = init;
  return fetch(path, {
    ...rest,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(headers as Record<string, string> | undefined),
    },
  });
}

/**
 * Downloads the business data dump.
 *
 * @param token    Clerk session JWT
 * @param filename Optional override; defaults to extracting from the
 *                 Content-Disposition header, otherwise
 *                 `flowfix-export.json`.
 */
export async function downloadBusinessExport(
  token: string,
  filename?: string,
): Promise<string> {
  const res = await authedFetchRaw('/api/security/export', {
    method: 'GET',
    token,
  });
  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      /* ignore */
    }
    const err: ApiError = {
      status: res.status,
      message: body?.message ?? body?.error ?? res.statusText,
    };
    throw err;
  }

  // Prefer the server-provided filename via Content-Disposition.
  let resolvedName = filename ?? 'flowfix-export.json';
  const disposition = res.headers.get('Content-Disposition');
  if (disposition && !filename) {
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    if (match?.[1]) resolvedName = match[1];
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = resolvedName;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(url);
  }
  return resolvedName;
}
