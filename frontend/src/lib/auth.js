// frontend/src/lib/auth.js

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Google OAuth login
// Sends Google id_token to backend, receives NotesMind JWT
// ---------------------------------------------------------------------------

export async function loginWithGoogle(idToken) {
  const res = await fetch(`${BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Google login failed.");
  }

  return await res.json(); // { token, name, email }
}

// ---------------------------------------------------------------------------
// Demo credentials login
// Sends email + password to backend, receives NotesMind JWT
// ---------------------------------------------------------------------------

export async function loginWithDemo(email, password) {
  const res = await fetch(`${BASE}/auth/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Demo login failed.");
  }

  return await res.json(); // { token, name, email }
}