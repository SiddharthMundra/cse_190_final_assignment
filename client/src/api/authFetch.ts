import { getFirebaseAuth } from "../firebase/init";

async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

type AuthFetchInit = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown>;
};

/** POST JSON to the API with Firebase ID token when signed in. */
export async function authFetch(
  url: string,
  init: AuthFetchInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = await getIdToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const { body, ...rest } = init;
  return fetch(url, {
    ...rest,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
}

/** Parse JSON API responses; surface readable errors when the server returns HTML (e.g. 404). */
export async function parseApiJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    if (res.status === 404) {
      throw new Error(
        "This API route was not found. Restart npm run dev locally, or redeploy the latest server to Render.",
      );
    }
    throw new Error(
      `Server returned non-JSON (${res.status}). Is the API running on the latest code?`,
    );
  }
}
