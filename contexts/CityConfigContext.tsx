import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { type CityConfig, fetchCityConfig, getCityConfigSync, setCityConfig } from "@/constants/city";

interface CityConfigContextValue {
  cityConfig: CityConfig;
  isLoaded: boolean;
}

const CityConfigContext = createContext<CityConfigContextValue>({
  cityConfig: getCityConfigSync(),
  isLoaded: false,
});

export function CityConfigProvider({ children }: { children: ReactNode }) {
  const [cityConfig, setCityConfigState] = useState<CityConfig>(getCityConfigSync());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    fetchCityConfig().then((config) => {
      setCityConfig(config);
      setCityConfigState(config);
      setIsLoaded(true);
    });
  }, []);

  return (
    <CityConfigContext.Provider value={{ cityConfig, isLoaded }}>
      {children}
    </CityConfigContext.Provider>
  );
}

export function useCityConfig(): CityConfigContextValue {
  return useContext(CityConfigContext);
}
