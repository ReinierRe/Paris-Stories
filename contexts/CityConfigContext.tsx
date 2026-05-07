import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  type CityConfig,
  fetchCityConfig,
  getCityConfigSync,
  setActiveCityIdInModule,
} from "@/constants/city";
import {
  CITY_REGISTRY,
  DEFAULT_CURRENT_CITY_ID,
  getDefaultActiveCityIds,
  getRegistryEntry,
} from "@/constants/cityRegistry";
import { setActiveCityId } from "@/lib/query-client";

const STORAGE_KEY_ACTIVE_CITIES = "cs.activeCities";
const STORAGE_KEY_CURRENT_CITY = "cs.currentCityId";
const STORAGE_KEY_FIRST_LAUNCH_DONE = "cs.firstLaunchDone";

export interface CityConfigContextValue {
  /** All active (installed) cities for the current user */
  activeCityIds: string[];
  /** The city currently in focus (drives Library, podcast generation, API calls) */
  currentCityId: string;
  /** Loaded configs for active cities, keyed by cityId */
  cityConfigs: Record<string, CityConfig>;
  /** Convenience: config for the currentCityId */
  cityConfig: CityConfig;
  /** True once initial async load from storage + first config fetch is done */
  isLoaded: boolean;
  /** True if this is the user's first launch (no prior state in storage) */
  isFirstLaunch: boolean;

  /** Switch the focused city. cityId must be in activeCityIds. */
  setCurrentCity: (cityId: string) => Promise<void>;
  /** Add a city to the active list and fetch its config. */
  addCity: (cityId: string) => Promise<void>;
  /** Remove a city from the active list. Cannot remove the last remaining city. */
  removeCity: (cityId: string) => Promise<void>;
  /** Mark first-launch as completed (call after user lands on Profile post-install). */
  markFirstLaunchDone: () => Promise<void>;
}

const initialCityId = DEFAULT_CURRENT_CITY_ID;
const initialConfig = getCityConfigSync(initialCityId);

const CityConfigContext = createContext<CityConfigContextValue>({
  activeCityIds: [initialCityId],
  currentCityId: initialCityId,
  cityConfigs: { [initialCityId]: initialConfig },
  cityConfig: initialConfig,
  isLoaded: false,
  isFirstLaunch: false,
  setCurrentCity: async () => {},
  addCity: async () => {},
  removeCity: async () => {},
  markFirstLaunchDone: async () => {},
});

/**
 * Sync the current cityId to all module-level holders so non-React code
 * (sync helpers, API client) sees the right value.
 */
function syncCityIdToModules(cityId: string): void {
  setActiveCityId(cityId); // lib/query-client (X-City-Id header)
  setActiveCityIdInModule(cityId); // constants/city (getCityConfigSync, getThemes, etc.)
}

async function loadActiveCitiesFromStorage(): Promise<{
  activeCityIds: string[];
  currentCityId: string;
  isFirstLaunch: boolean;
}> {
  try {
    const [activeRaw, currentRaw, firstLaunchRaw] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEY_ACTIVE_CITIES),
      AsyncStorage.getItem(STORAGE_KEY_CURRENT_CITY),
      AsyncStorage.getItem(STORAGE_KEY_FIRST_LAUNCH_DONE),
    ]);

    const isFirstLaunch = firstLaunchRaw !== "true";

    let activeCityIds: string[] = [];
    if (activeRaw) {
      try {
        const parsed = JSON.parse(activeRaw);
        if (Array.isArray(parsed)) {
          activeCityIds = parsed.filter(
            (id): id is string => typeof id === "string" && getRegistryEntry(id) !== undefined,
          );
        }
      } catch {}
    }
    if (activeCityIds.length === 0) {
      activeCityIds = getDefaultActiveCityIds();
    }

    let currentCityId = currentRaw && activeCityIds.includes(currentRaw) ? currentRaw : activeCityIds[0];
    if (!currentCityId) {
      currentCityId = DEFAULT_CURRENT_CITY_ID;
      activeCityIds = [DEFAULT_CURRENT_CITY_ID];
    }

    return { activeCityIds, currentCityId, isFirstLaunch };
  } catch (err) {
    console.warn("Failed to load city state from storage:", err);
    return {
      activeCityIds: getDefaultActiveCityIds(),
      currentCityId: DEFAULT_CURRENT_CITY_ID,
      isFirstLaunch: true,
    };
  }
}

export function CityConfigProvider({ children }: { children: ReactNode }) {
  const [activeCityIds, setActiveCityIds] = useState<string[]>(getDefaultActiveCityIds());
  const [currentCityId, setCurrentCityIdState] = useState<string>(initialCityId);
  const [cityConfigs, setCityConfigs] = useState<Record<string, CityConfig>>({
    [initialCityId]: initialConfig,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  // Initial load: hydrate from AsyncStorage and fetch fresh configs for active cities
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { activeCityIds: storedActive, currentCityId: storedCurrent, isFirstLaunch: firstLaunch } =
        await loadActiveCitiesFromStorage();

      if (cancelled) return;

      setActiveCityIds(storedActive);
      setCurrentCityIdState(storedCurrent);
      setIsFirstLaunch(firstLaunch);
      syncCityIdToModules(storedCurrent);

      // Fetch configs for all active cities
      const configs: Record<string, CityConfig> = {};
      await Promise.all(
        storedActive.map(async (cityId) => {
          try {
            configs[cityId] = await fetchCityConfig(cityId);
          } catch (err) {
            console.warn(`Failed to fetch config for ${cityId}:`, err);
            configs[cityId] = getCityConfigSync(cityId);
          }
        }),
      );

      if (cancelled) return;
      setCityConfigs(configs);
      setIsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist activeCityIds whenever it changes
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY_ACTIVE_CITIES, JSON.stringify(activeCityIds)).catch(() => {});
  }, [activeCityIds, isLoaded]);

  // Persist currentCityId + sync to module-level holders
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY_CURRENT_CITY, currentCityId).catch(() => {});
    syncCityIdToModules(currentCityId);
  }, [currentCityId, isLoaded]);

  const setCurrentCity = useCallback(
    async (cityId: string) => {
      if (!activeCityIds.includes(cityId)) {
        console.warn(`setCurrentCity: ${cityId} is not in active cities`);
        return;
      }
      setCurrentCityIdState(cityId);
    },
    [activeCityIds],
  );

  const addCity = useCallback(
    async (cityId: string) => {
      const entry = getRegistryEntry(cityId);
      if (!entry) {
        console.warn(`addCity: unknown city ${cityId}`);
        return;
      }
      if (activeCityIds.includes(cityId)) return;

      try {
        const config = await fetchCityConfig(cityId);
        setCityConfigs((prev) => ({ ...prev, [cityId]: config }));
      } catch (err) {
        console.warn(`addCity: failed to fetch config for ${cityId}:`, err);
        setCityConfigs((prev) => ({ ...prev, [cityId]: getCityConfigSync(cityId) }));
      }

      setActiveCityIds((prev) => (prev.includes(cityId) ? prev : [...prev, cityId]));
    },
    [activeCityIds],
  );

  const removeCity = useCallback(
    async (cityId: string) => {
      if (activeCityIds.length <= 1) {
        console.warn("Cannot remove last active city");
        return;
      }
      setActiveCityIds((prev) => prev.filter((id) => id !== cityId));
      if (currentCityId === cityId) {
        const fallback = activeCityIds.find((id) => id !== cityId) ?? DEFAULT_CURRENT_CITY_ID;
        setCurrentCityIdState(fallback);
      }
    },
    [activeCityIds, currentCityId],
  );

  const markFirstLaunchDone = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY_FIRST_LAUNCH_DONE, "true").catch(() => {});
    setIsFirstLaunch(false);
  }, []);

  const cityConfig = cityConfigs[currentCityId] ?? getCityConfigSync(currentCityId);

  const value = useMemo<CityConfigContextValue>(
    () => ({
      activeCityIds,
      currentCityId,
      cityConfigs,
      cityConfig,
      isLoaded,
      isFirstLaunch,
      setCurrentCity,
      addCity,
      removeCity,
      markFirstLaunchDone,
    }),
    [
      activeCityIds,
      currentCityId,
      cityConfigs,
      cityConfig,
      isLoaded,
      isFirstLaunch,
      setCurrentCity,
      addCity,
      removeCity,
      markFirstLaunchDone,
    ],
  );

  return <CityConfigContext.Provider value={value}>{children}</CityConfigContext.Provider>;
}

export function useCityConfig(): CityConfigContextValue {
  return useContext(CityConfigContext);
}

// Re-export registry helpers for convenience
export { CITY_REGISTRY, getRegistryEntry } from "@/constants/cityRegistry";
