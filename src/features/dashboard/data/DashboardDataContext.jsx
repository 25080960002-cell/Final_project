import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  groups as mockGroups,
  plots as mockPlots,
  teamMembers as mockMembers,
} from './dashboard';
import { fetchDashboardSnapshot, fetchSession, googleAuthenticate as apiGoogleAuthenticate, login as apiLogin, logout as apiLogout } from './apiClient';

const DashboardDataContext = createContext(null);

const ROLE_CODES = {
  Administrator: 'administrator',
  'Manajer lapangan': 'manajer_lapangan',
  Petani: 'petani',
  Penyuluh: 'penyuluh',
};

function parseArea(value) {
  const number = Number(String(value ?? '').replace(/[^\d,.]/g, '').replace(',', '.'));
  return Number.isFinite(number) ? number : 0;
}

const mockArea = mockPlots.reduce((total, plot) => total + parseArea(plot.area), 0);

/** Ringkasan dari data contoh, dipakai saat API belum/tidak tersedia. */
const mockSummary = {
  plot_total: mockPlots.length,
  area_ha: mockArea,
  member_active: mockMembers.length,
  group_total: mockGroups.length,
  invitation_pending: mockMembers.filter((member) => member.status === 'Undangan').length,
  health_average: Math.round(
    mockPlots.reduce((total, plot) => total + (plot.health || 0), 0) / mockPlots.length,
  ),
  health_latest_at: null,
  plot_status: mockPlots.reduce((result, plot) => {
    result[plot.status] = (result[plot.status] ?? 0) + 1;
    return result;
  }, {}),
  member_role: mockMembers.reduce((result, member) => {
    const code = ROLE_CODES[member.role] ?? member.role;
    result[code] = (result[code] ?? 0) + 1;
    return result;
  }, {}),
};

const mockOrganization = {
  id: 1,
  name: 'Koperasi Subak Sari',
  type: 'Koperasi pertanian',
  region: 'Tabanan, Bali',
  email: 'halo@subaksari.id',
  registration_no: 'KOP-2018-0472',
  founded_year: 2018,
  status: 'Aktif',
  plot_total: mockPlots.length,
  area_ha: mockArea,
  member_active: mockMembers.length,
  group_total: mockGroups.length,
  pending_invitations: mockSummary.invitation_pending,
};

const mockCommodities = ['Padi', 'Jagung', 'Cabai Merah', 'Kopi Robusta'].map((name, index) => ({
  id: index + 1,
  name,
}));

const initialState = {
  status: 'loading',
  source: 'mock',
  error: null,
  summary: mockSummary,
  organization: mockOrganization,
  commodities: mockCommodities,
  plots: mockPlots,
  groups: mockGroups,
  teamMembers: mockMembers,
  fetchedAt: null,
  session: null,
};

export function DashboardDataProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchSession(controller.signal)
      .then(async (session) => {
        if (!active) return;
        if (!session) {
          setState({ ...initialState, status: 'ready', error: null });
          return;
        }
        const snapshot = await fetchDashboardSnapshot(controller.signal);
        if (active) setState({ status: 'ready', source: 'api', error: null, session, ...snapshot });
      })
      .catch((error) => {
        if (!active || error.name === 'AbortError') return;
        setState({
          ...initialState,
          status: 'ready',
          source: 'mock',
          error: error.status === 401 ? null : error.message,
          session: null,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  useEffect(() => {
    if (state.status !== 'ready' || state.organization?.raw?.settings?.auto_sync !== true) return undefined;
    let active = true;
    let syncing = false;
    const sync = async () => {
      if (!active || syncing || !navigator.onLine) return;
      syncing = true;
      try {
        const snapshot = await fetchDashboardSnapshot();
        if (active) setState((current) => current.session
          ? { ...current, ...snapshot, status: 'ready', source: 'api', error: null }
          : current);
      } catch (error) {
        if (active) setState((current) => ({ ...current, error: error.message }));
      } finally {
        syncing = false;
      }
    };
    const timer = window.setInterval(sync, 60_000);
    window.addEventListener('online', sync);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('online', sync);
    };
  }, [state.status, state.organization?.raw?.settings?.auto_sync]);

  const value = useMemo(
    () => ({
      ...state,
      reload: () => setAttempt((count) => count + 1),
      refresh: async () => {
        const snapshot = await fetchDashboardSnapshot();
        setState((current) => current.session
          ? { ...current, ...snapshot, status: 'ready', source: 'api', error: null }
          : current);
        return snapshot;
      },
      signIn: async (credentials) => {
        await apiLogin(credentials);
        setAttempt((count) => count + 1);
      },
      signInWithGoogle: async (details) => {
        const result = await apiGoogleAuthenticate(details);
        setAttempt((count) => count + 1);
        return result;
      },
      signOut: async () => {
        try {
          await apiLogout();
        } finally {
          setState(initialState);
        }
      },
    }),
    [state],
  );

  return (
    <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error('useDashboardData harus dipakai di dalam DashboardDataProvider.');
  }
  return context;
}
