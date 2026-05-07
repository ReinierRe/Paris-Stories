import { fetch } from "expo/fetch";
import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "@/lib/firebase";
import Constants from "expo-constants";
import { DEFAULT_CURRENT_CITY_ID } from "@/constants/cityRegistry";

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorized(callback: () => void) {
  onUnauthorizedCallback = callback;
}

export function getApiUrl(): string {
  const extra = Constants.expoConfig?.extra ?? {};
  let host = process.env.EXPO_PUBLIC_DOMAIN || extra.apiDomain;

  if (!host) {
    throw new Error("EXPO_PUBLIC_DOMAIN is not set");
  }

  let url = new URL(`https://${host}`);

  return url.href.replace(/\/$/, "");
}

/**
 * Currently active city for outgoing API calls. Set by CityConfigContext when
 * the user switches cities. Falls back to env var, then DEFAULT_CURRENT_CITY_ID.
 */
let _currentCityId: string | null = null;

/**
 * Set by CityConfigContext when the user switches the active city.
 * All subsequent API calls will include this cityId in the X-City-Id header.
 */
export function setActiveCityId(cityId: string): void {
  _currentCityId = cityId;
}

export function getCityId(): string {
  if (_currentCityId) return _currentCityId;
  const extra = Constants.expoConfig?.extra ?? {};
  return process.env.EXPO_PUBLIC_CITY_ID || extra.cityId || DEFAULT_CURRENT_CITY_ID;
}

async function getAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken(forceRefresh);
      return { Authorization: `Bearer ${token}` };
    }
  } catch {}
  return {};
}

export function getCityHeaders(): Record<string, string> {
  return { "X-City-Id": getCityId() };
}

/**
 * Build city headers for a specific city (used when calling the API on behalf
 * of a non-current city — e.g. registering a new city for the user, or fetching
 * its config without changing the current focus).
 */
export function buildCityHeaders(cityId: string): Record<string, string> {
  return { "X-City-Id": cityId };
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    if (res.status === 401 && onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  route: string,
  data?: unknown | undefined,
  options?: { cityId?: string },
): Promise<Response> {
  const baseUrl = getApiUrl();
  const url = new URL(route, baseUrl);
  const authHeaders = await getAuthHeaders();
  const cityHeaders = options?.cityId ? buildCityHeaders(options.cityId) : getCityHeaders();

  const headers: Record<string, string> = {
    ...cityHeaders,
    ...authHeaders,
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (res.status === 401) {
    const refreshedHeaders = await getAuthHeaders(true);
    if (refreshedHeaders.Authorization) {
      const retryRes = await fetch(url.toString(), {
        method,
        headers: { ...cityHeaders, ...refreshedHeaders, ...(data ? { "Content-Type": "application/json" } : {}) },
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });
      if (!retryRes.ok) {
        await throwIfResNotOk(retryRes);
      }
      return retryRes;
    }
    await throwIfResNotOk(res);
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const baseUrl = getApiUrl();
    const url = new URL(queryKey.join("/") as string, baseUrl);
    const authHeaders = await getAuthHeaders();

    const res = await fetch(url.toString(), {
      credentials: "include",
      headers: { ...getCityHeaders(), ...authHeaders },
    });

    if (res.status === 401) {
      const refreshedHeaders = await getAuthHeaders(true);
      if (refreshedHeaders.Authorization) {
        const retryRes = await fetch(url.toString(), {
          credentials: "include",
          headers: { ...getCityHeaders(), ...refreshedHeaders },
        });
        if (retryRes.status === 401) {
          if (unauthorizedBehavior === "returnNull") return null;
          await throwIfResNotOk(retryRes);
        }
        if (!retryRes.ok) {
          await throwIfResNotOk(retryRes);
        }
        return await retryRes.json();
      }
      if (unauthorizedBehavior === "returnNull") return null;
      await throwIfResNotOk(res);
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
