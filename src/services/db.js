// IBM Cloudant NoSQL Database Service for LearnMate
// Connects to live IBM Cloudant instance using Basic Auth and CouchDB document revision (GET/PUT) cycles

/**
 * Route URLs through the Vite development proxy if running locally.
 * Strips any trailing slashes to avoid double-slashes in routes.
 */
function getProxiedUrl(originalUrl, proxyPrefix) {
  if (!originalUrl) return "";
  if (import.meta.env.DEV) {
    try {
      const urlObj = new URL(originalUrl);
      let path = urlObj.pathname;
      if (path.endsWith("/")) {
        path = path.slice(0, -1);
      }
      return `${proxyPrefix}${path}${urlObj.search}`;
    } catch (e) {
      console.warn("Failed to parse URL for proxy, using original:", originalUrl);
      return originalUrl;
    }
  }
  return originalUrl;
}

/**
 * Fetch wrapper that adds an automatic timeout (defaults to 10 seconds)
 * to prevent database connections from hanging indefinitely.
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 10000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Token Cache Manager for Cloudant
let cloudantTokenCache = {
  accessToken: null,
  expiresAt: 0 // Milliseconds timestamp
};

/**
 * Exchanges VITE_CLOUDANT_APIKEY for an IBM Cloud IAM bearer token.
 * Caches the token and automatically refreshes it before expiration.
 */
async function getCloudantIAMToken() {
  const apiKey = import.meta.env.VITE_CLOUDANT_APIKEY;
  if (!apiKey) {
    throw new Error("VITE_CLOUDANT_APIKEY is not defined in environment variables.");
  }

  // If token exists and is valid for at least another 60 seconds, reuse it
  if (cloudantTokenCache.accessToken && cloudantTokenCache.expiresAt > Date.now() + 60000) {
    return cloudantTokenCache.accessToken;
  }

  console.log("Cloudant Service: Exchanging IAM API Key for a fresh OAuth bearer token...");
  
  // Assemble form-encoded body parameters
  const params = new URLSearchParams();
  params.append("grant_type", "urn:ibm:params:oauth:grant-type:apikey");
  params.append("apikey", apiKey);

  // Exchange URL: use dev proxy /api/iam in local development to bypass browser CORS
  const tokenExchangeUrl = import.meta.env.DEV 
    ? "/api/iam/identity/token" 
    : "https://iam.cloud.ibm.com/identity/token";

  const response = await fetch(tokenExchangeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: params.toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudant IAM Token Exchange failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // Cache the token
  cloudantTokenCache.accessToken = data.access_token;
  cloudantTokenCache.expiresAt = Date.now() + (data.expires_in * 1000);
  
  console.log("Cloudant Service: IAM Token acquired and cached successfully.");
  return cloudantTokenCache.accessToken;
}

/**
 * Compiles HTTP headers using an IAM bearer token.
 * Throws if token retrieval fails — callers handle the error so they
 * don't silently send unauthenticated requests that always 401.
 */
async function getCloudantHeaders() {
  const token = await getCloudantIAMToken();
  return {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

export const dbService = {
  // Local Storage Cache Helpers
  getLocalTracksFallback(sessionId) {
    const tracks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`cache_${sessionId}_`)) {
        try {
          tracks.push(JSON.parse(localStorage.getItem(key)));
        } catch (e) {
          console.error("Cloudant Local Cache: Parse error:", e);
        }
      }
    }
    // Sort descending by lastUpdated ISO timestamp
    tracks.sort((a, b) => b.updatedAt - a.updatedAt);
    return tracks;
  },

  syncLocalTracksCache(sessionId, tracks) {
    // Clear old cache entries first — use the same "cache_" prefix
    // that individual saves and the fallback reader both use.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`cache_${sessionId}_`)) {
        localStorage.removeItem(key);
      }
    }
    // Write new cache with keys matching the pattern: cache_{sessionId}_{trackName}
    tracks.forEach((track) => {
      localStorage.setItem(`cache_${track.id}`, JSON.stringify(track));
    });
  },

  /**
   * Checks if the Cloudant database exists on startup.
   * If it returns a 404, triggers a PUT request to create the database once.
   */
  async initializeDatabase() {
    const url = import.meta.env.VITE_CLOUDANT_URL;
    const dbName = import.meta.env.VITE_CLOUDANT_DB;

    if (!url || !dbName) {
      console.warn("Cloudant Service: VITE_CLOUDANT_URL or VITE_CLOUDANT_DB is not defined.");
      return;
    }

    const proxiedUrl = getProxiedUrl(url, "/api/cloudant");
    const dbUrl = `${proxiedUrl}/${dbName}`;
    console.log(`Cloudant CRUD: Initializing database at ${dbUrl}...`);

    try {
      // 1. Fetch DB metadata to verify existence
      const checkRes = await fetchWithTimeout(dbUrl, {
        method: "GET",
        headers: await getCloudantHeaders()
      });

      // 2. If missing, create database via PUT
      if (checkRes.status === 404) {
        console.log(`Cloudant CRUD: Database "${dbName}" does not exist. Creating database...`);
        const createRes = await fetchWithTimeout(dbUrl, {
          method: "PUT",
          headers: await getCloudantHeaders()
        });

        if (createRes.ok) {
          console.log(`Cloudant CRUD: Database "${dbName}" created successfully.`);
        } else {
          const errText = await createRes.text();
          console.error(`Cloudant CRUD: Failed to create database: ${createRes.statusText} - ${errText}`);
        }
      } else if (checkRes.ok) {
        console.log(`Cloudant CRUD: Database "${dbName}" verified and connected.`);
      } else {
        console.warn(`Cloudant CRUD: DB check returned status ${checkRes.status}: ${checkRes.statusText}`);
      }
    } catch (error) {
      console.error("Cloudant CRUD: Database initialization failed:", error);
      throw error; // Propagate to trigger App.jsx offline setup
    }
  },

  /**
   * Fetches all tracks where document _id starts with sessionId.
   * Uses a native CouchDB/Cloudant _all_docs range query (startkey/endkey) instead
   * of a Mango $regex selector. Range queries use the primary index directly and
   * are dramatically faster than an unindexed regex scan, especially as the
   * database grows.
   */
  async fetchTracks(sessionId) {
    const url = import.meta.env.VITE_CLOUDANT_URL;
    const dbName = import.meta.env.VITE_CLOUDANT_DB;

    if (!url || !dbName) {
      return this.getLocalTracksFallback(sessionId);
    }

    const proxiedUrl = getProxiedUrl(url, "/api/cloudant");
    // startkey = sessionId itself, endkey = sessionId + high unicode char,
    // giving us every doc whose _id begins with "{sessionId}_" in one fast pass.
    const startKey = encodeURIComponent(JSON.stringify(sessionId));
    const endKey = encodeURIComponent(JSON.stringify(sessionId + "\ufff0"));
    const allDocsUrl = `${proxiedUrl}/${dbName}/_all_docs?include_docs=true&startkey=${startKey}&endkey=${endKey}`;
    console.log(`Cloudant CRUD: Fetching tracks via _all_docs range query...`);

    try {
      const response = await fetchWithTimeout(allDocsUrl, {
        method: "GET",
        headers: await getCloudantHeaders()
      });

      if (!response.ok) {
        throw new Error(`Cloudant _all_docs failed: ${response.statusText}`);
      }

      const data = await response.json();
      const docs = (data.rows || []).map((row) => row.doc).filter(Boolean);

      // Map Cloudant document fields back to App React state structure
      // (_rev is carried through so future saves can skip the extra GET)
      const tracks = docs.map((doc) => ({
        id: doc._id,
        rev: doc._rev,
        name: doc.trackName,
        stage: doc.currentStage,
        messages: doc.messages || [],
        assessment: doc.assessment || null,
        updatedAt: doc.lastUpdated ? Date.parse(doc.lastUpdated) : Date.now()
      }));

      // Cache successfully loaded tracks locally
      this.syncLocalTracksCache(sessionId, tracks);
      return tracks;
    } catch (error) {
      console.warn("Cloudant CRUD: fetchTracks failed. Loading from local storage cache instead...", error);
      return this.getLocalTracksFallback(sessionId);
    }
  },

  /**
   * Fetches the current _rev for a document. Returns null only on a genuine 404
   * (document does not exist yet). Any other failure (timeout, auth, network)
   * is re-thrown so callers don't silently mistake a transient error for "new doc".
   */
  async _fetchRev(docUrl) {
    const getRes = await fetchWithTimeout(docUrl, {
      method: "GET",
      headers: await getCloudantHeaders()
    });
    if (getRes.status === 404) {
      return null; // genuinely a new document
    }
    if (!getRes.ok) {
      throw new Error(`Cloudant GET (rev lookup) failed: ${getRes.status} ${getRes.statusText}`);
    }
    const existingDoc = await getRes.json();
    return existingDoc._rev;
  },

  /**
   * Helper that performs the Cloudant PUT write.
   * If a known `_rev` is already held in memory (passed in via trackData.rev),
   * skips the GET entirely and writes directly - this is the common case for
   * every message sent within an already-loaded track, cutting the round trip
   * count for a save from 2 down to 1.
   * Falls back to fetching _rev when none is cached, and retries once with a
   * freshly-fetched _rev if Cloudant returns a 409 conflict.
   */
  async saveTrackDirect(sessionId, trackName, trackData, attempt = 0) {
    const url = import.meta.env.VITE_CLOUDANT_URL;
    const dbName = import.meta.env.VITE_CLOUDANT_DB;
    const docId = `${sessionId}_${trackName}`;

    const proxiedUrl = getProxiedUrl(url, "/api/cloudant");
    const docUrl = `${proxiedUrl}/${dbName}/${encodeURIComponent(docId)}`;

    console.log(`Cloudant CRUD: Upserting document: ${docId} (attempt ${attempt + 1})`);

    // 1. Use the cached _rev if we already have one (avoids a GET round trip).
    //    Only fetch _rev from Cloudant when we don't already know it.
    let rev = trackData.rev || null;
    if (!rev) {
      rev = await this._fetchRev(docUrl);
    }

    // 2. Assemble Cloudant document payload
    const body = {
      _id: docId,
      trackName: trackName,
      currentStage: trackData.stage || "Beginner",
      messages: trackData.messages || [],
      assessment: trackData.assessment || null,
      lastUpdated: new Date().toISOString(),
      sessionId: sessionId
    };

    if (rev) {
      body._rev = rev;
    }

    // 3. Perform PUT write to Cloudant
    const putResponse = await fetchWithTimeout(docUrl, {
      method: "PUT",
      headers: await getCloudantHeaders(),
      body: JSON.stringify(body)
    });

    // On a 409 conflict (our cached _rev was stale), fetch the real _rev fresh
    // and retry exactly once rather than failing the whole save.
    if (putResponse.status === 409 && attempt === 0) {
      console.warn("Cloudant CRUD: 409 conflict (stale _rev). Refetching and retrying once...");
      return this.saveTrackDirect(sessionId, trackName, { ...trackData, rev: null }, attempt + 1);
    }

    if (!putResponse.ok) {
      const errText = await putResponse.text();
      throw new Error(`Cloudant PUT failed: ${putResponse.statusText} - ${errText}`);
    }

    const putResult = await putResponse.json();
    console.log(`Cloudant CRUD: Document ${docId} successfully saved (rev ${putResult.rev}).`);

    const result = {
      id: docId,
      rev: putResult.rev, // carry the new _rev forward so the NEXT save skips its GET too
      name: trackName,
      stage: body.currentStage,
      messages: body.messages,
      assessment: body.assessment,
      updatedAt: Date.parse(body.lastUpdated)
    };

    // Cache the updated result locally
    localStorage.setItem(`cache_${docId}`, JSON.stringify(result));
    return result;
  },

  /**
   * Saves a track to Cloudant.
   * Optimistically caches locally to localStorage first to guarantee zero data loss.
   * saveTrackDirect already handles 409 conflicts with a single internal retry,
   * so no outer retry loop is needed here.
   */
  async saveTrack(sessionId, trackName, trackData) {
    const docId = `${sessionId}_${trackName}`;
    const localRecord = {
      id: docId,
      rev: trackData.rev || null,
      name: trackName,
      stage: trackData.stage || "Beginner",
      messages: trackData.messages || [],
      assessment: trackData.assessment || null,
      updatedAt: Date.now()
    };
    
    // Always write to localStorage cache first to prevent losing message histories
    localStorage.setItem(`cache_${docId}`, JSON.stringify(localRecord));

    return await this.saveTrackDirect(sessionId, trackName, trackData);
  },

  /**
   * Helper that executes the GET-DELETE sequence in Cloudant.
   */
  async deleteTrackDirect(sessionId, trackName) {
    const url = import.meta.env.VITE_CLOUDANT_URL;
    const dbName = import.meta.env.VITE_CLOUDANT_DB;
    const docId = `${sessionId}_${trackName}`;

    const proxiedUrl = getProxiedUrl(url, "/api/cloudant");
    const docUrl = `${proxiedUrl}/${dbName}/${encodeURIComponent(docId)}`;

    console.log(`Cloudant CRUD: Fetching revision for deletion: ${docId}`);

    const getRes = await fetchWithTimeout(docUrl, {
      method: "GET",
      headers: await getCloudantHeaders()
    });

    if (!getRes.ok) {
      throw new Error(`Track document not found for delete (${getRes.status})`);
    }

    const doc = await getRes.json();
    const rev = doc._rev;

    console.log(`Cloudant CRUD: Deleting document ${docId} with revision ${rev}`);

    const deleteResponse = await fetchWithTimeout(`${docUrl}?rev=${rev}`, {
      method: "DELETE",
      headers: await getCloudantHeaders()
    });

    if (!deleteResponse.ok) {
      const errText = await deleteResponse.text();
      throw new Error(`Cloudant delete failed: ${deleteResponse.statusText} - ${errText}`);
    }

    console.log(`Cloudant CRUD: Document ${docId} successfully deleted.`);
    return true;
  },

  /**
   * Deletes a track from Cloudant and local cache.
   */
  async deleteTrack(sessionId, trackName) {
    const docId = `${sessionId}_${trackName}`;
    localStorage.removeItem(`cache_${docId}`);
    return await this.deleteTrackDirect(sessionId, trackName);
  }
};
