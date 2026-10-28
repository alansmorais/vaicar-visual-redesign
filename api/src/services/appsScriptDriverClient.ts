/**
 * Server-side client for the isolated VaiCar driver Apps Script adapter.
 *
 * SAFETY: disabled by default. This module does not change any route by itself.
 * Never call from browser code and never expose the shared secret to VITE_* variables.
 * Enable only against a dedicated test spreadsheet after authentication/authorization review.
 */
import { config } from '../config/index.js';

type DriverAction = 'driver.health' | 'driver.register' | 'driver.get' | 'driver.adminList' | 'driver.adminSetStatus';

export interface AppsScriptDriverResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

function integrationEnabled(): boolean {
  return process.env.VAICAR_DRIVER_SHEETS_ENABLED === 'true' &&
    process.env.NODE_ENV !== 'production' &&
    Boolean(process.env.VAICAR_DRIVER_APPS_SCRIPT_URL) &&
    Boolean(process.env.VAICAR_DRIVER_APPS_SCRIPT_SECRET);
}

/**
 * Makes a server-to-server request only when the integration is explicitly enabled
 * in a non-production environment. It is intentionally not wired to registration,
 * login, profile, or admin routes yet.
 */
export async function callDriverAppsScript(
  action: DriverAction,
  payload: Record<string, unknown> = {},
): Promise<AppsScriptDriverResponse> {
  if (!integrationEnabled()) {
    throw new Error('VaiCar Driver Sheets integration is disabled; no request was sent.');
  }

  const endpoint = process.env.VAICAR_DRIVER_APPS_SCRIPT_URL!;
  const sharedSecret = process.env.VAICAR_DRIVER_APPS_SCRIPT_SECRET!;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...payload, action, sharedSecret }),
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    throw new Error('Não foi possível contactar o Apps Script. Nenhum fallback de gravação foi executado.');
  }

  if (!response.ok) {
    throw new Error('Apps Script respondeu com estado HTTP ' + response.status + '.');
  }

  let result: AppsScriptDriverResponse;
  try {
    result = await response.json() as AppsScriptDriverResponse;
  } catch {
    throw new Error('Resposta inválida do Apps Script.');
  }

  if (!result || result.success !== true) {
    throw new Error(typeof result?.error === 'string' ? result.error : 'Apps Script não confirmou a operação.');
  }
  return result;
}

/** Diagnostic only; does not call Google or reveal secrets. */
export function getDriverAppsScriptIntegrationStatus(): {
  enabled: boolean;
  configured: boolean;
  environment: string;
} {
  return {
    enabled: integrationEnabled(),
    configured: Boolean(
      process.env.VAICAR_DRIVER_APPS_SCRIPT_URL &&
      process.env.VAICAR_DRIVER_APPS_SCRIPT_SECRET
    ),
    environment: config.env,
  };
}
