import { STORAGE_KEYS } from "./lib/constants";

// Thin HTTP client for a future PenguWave backend (Track A). The dashboard
// currently runs frontend-only on mock data via src/services/eventsService.ts,
// so these calls are unused today — they document the intended contract.
//
// Security notes (fixes from the starter):
//  - No hardcoded API key. A static "pw_live_sk_…" secret committed to a frontend
//    bundle is readable by anyone; it was removed. Real auth uses the per-session
//    bearer token below, issued by the backend at login.
//  - Credentials are never logged. The starter console.log'd the password.
const API_URL = "http://localhost:3001";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(STORAGE_KEYS.token);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.token) localStorage.setItem(STORAGE_KEYS.token, data.token);
  return data;
}

export async function getEvents() {
  const res = await fetch(`${API_URL}/api/events`, { headers: authHeaders() });
  return res.json();
}

export async function getUsers() {
  const res = await fetch(`${API_URL}/api/users`, { headers: authHeaders() });
  return res.json();
}

export async function createUser(user: { email: string; password: string; role: string }) {
  const res = await fetch(`${API_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(user),
  });
  return res.json();
}

export async function deleteUser(id: string) {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
}
