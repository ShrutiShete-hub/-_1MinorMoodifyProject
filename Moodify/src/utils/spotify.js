// Minimal Spotify helper using Authorization Code Flow with PKCE.
// Requires VITE_SPOTIFY_CLIENT_ID and that the app is served from a URL
// registered as Redirect URI in the Spotify Dashboard (e.g. http://localhost:5173/)

function base64UrlEncode(str) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(buffer) {
  const msgUint8 = new TextEncoder().encode(buffer);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  return new Uint8Array(hashBuffer);
}

function randomString(length = 64) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let res = "";
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    res += charset[values[i] % charset.length];
  }
  return res;
}

export async function authorizeWithSpotify(clientId, scopes = []) {
  if (!clientId) throw new Error("VITE_SPOTIFY_CLIENT_ID is required");

  const redirectUri = window.location.origin + window.location.pathname;
  const codeVerifier = randomString(128);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  const state = randomString(16);
  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", scopes.join(" "));
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("code_challenge", codeChallenge);

  // store verifier and state locally for exchange
  localStorage.setItem("spotify_code_verifier", codeVerifier);
  localStorage.setItem("spotify_code_state", state);

  // open popup and wait for redirect back to our origin
  const popup = window.open(authUrl.toString(), "spotify_auth", "width=500,height=700");
  if (!popup) throw new Error("Popup blocked");

  return new Promise((resolve, reject) => {
    const interval = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(interval);
          reject(new Error("Auth popup closed"));
        }
        // once the popup navigates back to same origin, we can read its search
        if (popup.location.origin === window.location.origin) {
          const params = new URLSearchParams(popup.location.search);
          const code = params.get("code");
          const returnedState = params.get("state");
          if (code && returnedState === localStorage.getItem("spotify_code_state")) {
            popup.close();
            clearInterval(interval);
            // exchange code for token
            exchangeCodeForToken(code, localStorage.getItem("spotify_code_verifier"), redirectUri, clientId)
              .then((tok) => resolve(tok))
              .catch((err) => reject(err));
          }
          const error = params.get("error");
          if (error) {
            popup.close();
            clearInterval(interval);
            reject(new Error(error));
          }
        }
      } catch (e) {
        // cross-origin until redirected back; ignore
      }
    }, 500);
  });
}

async function exchangeCodeForToken(code, codeVerifier, redirectUri, clientId) {
  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", redirectUri);
  body.set("client_id", clientId);
  body.set("code_verifier", codeVerifier);

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error("Token exchange failed: " + txt);
  }

  const data = await resp.json();
  const token = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + (data.expires_in || 3600) * 1000,
  };
  localStorage.setItem("spotify_token", JSON.stringify(token));
  return token;
}

export function getStoredToken() {
  const raw = localStorage.getItem("spotify_token");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export async function searchTrack(query, token) {
  if (!token || !token.access_token) throw new Error("No access token");
  const q = encodeURIComponent(query);
  const url = `https://api.spotify.com/v1/search?q=${q}&type=track&limit=1`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error("Search failed: " + txt);
  }
  const data = await resp.json();
  const item = data.tracks && data.tracks.items && data.tracks.items[0];
  return item ? item.uri : null;
}

export async function playUri(uri, token) {
  if (!token || !token.access_token) throw new Error("No access token");
  const resp = await fetch("https://api.spotify.com/v1/me/player/play", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ uris: [uri] }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error("Play failed: " + txt);
  }
  return true;
}
