import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { BrandingStore, DEFAULT_BRANDING } from "../../lib/data";
import type { Branding } from "../../lib/types";

interface BrandingContextType {
  branding: Branding;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: DEFAULT_BRANDING,
  refresh: async () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);

  const refresh = useCallback(async () => {
    try {
      setBranding(await BrandingStore.get());
    } catch {
      /* keep defaults */
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <BrandingContext.Provider value={{ branding, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
