import AsyncStorage from '@react-native-async-storage/async-storage';
import { authorizedFetch, isOffline } from './api';
import type { InspectorClearance } from './types';

/* audit.tsx stamps submissions with this name, so it has to survive the move
 * off the access-key flow that used to write it. */
const INSPECTOR_NAME_KEY = 'inspector_name';
const INSPECTOR_ID_KEY = 'inspector_id';
const CLEARANCE_KEY = 'inspector_clearance';

export type GateRoute = '/login' | '/homepage' | '/awaiting-approval';

/** Opens the HR record behind a freshly created auth user. Server-side write:
 *  the device never gets to choose its own approval status. */
export async function registerInspector(fullName: string, contactNumber: string) {
  return authorizedFetch<{ success: boolean; alreadyRegistered: boolean }>(
    '/api/inspectors/register',
    {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, contact_number: contactNumber }),
    }
  );
}

export async function fetchClearance(): Promise<InspectorClearance> {
  const clearance = await authorizedFetch<InspectorClearance>('/api/inspectors/status');
  await cacheClearance(clearance);
  return clearance;
}

/* Audits are offline-first, so a dead zone must not lock an approved inspector
 * out of the app. The last verified clearance stands in until the device can
 * reach the server again; a pending one still holds them on the queue screen. */
export async function getCachedClearance(): Promise<InspectorClearance | null> {
  try {
    const stored = await AsyncStorage.getItem(CLEARANCE_KEY);
    return stored ? (JSON.parse(stored) as InspectorClearance) : null;
  } catch {
    return null;
  }
}

async function cacheClearance(clearance: InspectorClearance) {
  await AsyncStorage.setItem(CLEARANCE_KEY, JSON.stringify(clearance));

  if (clearance.full_name) await AsyncStorage.setItem(INSPECTOR_NAME_KEY, clearance.full_name);
  if (clearance.inspector_id) await AsyncStorage.setItem(INSPECTOR_ID_KEY, clearance.inspector_id);
}

export async function clearInspectorIdentity() {
  await AsyncStorage.multiRemove([CLEARANCE_KEY, INSPECTOR_NAME_KEY, INSPECTOR_ID_KEY]);
}

/** The inspectors row id — not the auth id — which is what detachments and
 *  audits are keyed on. */
export async function getInspectorId(): Promise<string | null> {
  return AsyncStorage.getItem(INSPECTOR_ID_KEY);
}

export const isCleared = (clearance: InspectorClearance | null) =>
  Boolean(clearance?.registered && clearance.status === 'approved' && clearance.is_active);

/** Where a signed-in inspector belongs right now. Falls back to the cached
 *  clearance when the status call cannot reach the server. */
export async function resolveGateRoute(): Promise<{ route: GateRoute; clearance: InspectorClearance | null; offline: boolean }> {
  try {
    const clearance = await fetchClearance();
    return {
      route: isCleared(clearance) ? '/homepage' : '/awaiting-approval',
      clearance,
      offline: false,
    };
  } catch (error) {
    if (isOffline(error)) {
      const cached = await getCachedClearance();
      return {
        route: isCleared(cached) ? '/homepage' : '/awaiting-approval',
        clearance: cached,
        offline: true,
      };
    }

    // A rejected token means the session is gone, not that access was denied.
    throw error;
  }
}
