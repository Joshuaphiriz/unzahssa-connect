import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';

export interface Branding {
  name: string;
  associationName: string;
  shortName: string;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  contactEmail: string;
  affiliationFee: number;
}

const DEFAULT: Branding = {
  name: 'UNZAHSSA Connect',
  associationName: 'University of Zambia Humanities & Social Sciences Student Association',
  shortName: 'UNZAHSSA',
  logo: null,
  primaryColor: '#1E3A5F',
  accentColor: '#D4A33D',
  heroTitle: 'Welcome to UNZAHSSA Connect',
  heroSubtitle: 'Your gateway to academic excellence, student welfare, and career opportunities.',
  footerText: '© 2024 UNZAHSSA Connect. All rights reserved.',
  contactEmail: 'unzahssa@unza.zm',
  affiliationFee: 50,
};

interface BrandingContextType {
  branding: Branding;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({ branding: DEFAULT, loading: false, refresh: async () => {} });

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const data = await api('/branding');
      if (data && Object.keys(data).length > 0) setBranding({ ...DEFAULT, ...data });
    } catch { /* keep default */ }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() { return useContext(BrandingContext); }
