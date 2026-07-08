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
 */
async function getCloudantHeaders() {
  try {
    const token = await getCloudantIAMToken();
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    };
  } catch (error) {
    console.error("Cloudant Service: Failed to get IAM token for headers:", error);
    return {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  }
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
    // Clear old cache entries first
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`cache_${sessionId}_`)) {
        localStorage.removeItem(key);
      }
    }
    // Write new cache
    tracks.forEach((track) => {
      const docId = track.id;
      localStorage.setItem(`cache_${docId}`, JSON.stringify(track));
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
   * Fetches all tracks where document _id starts with sessionId using a Mango selector query.
   */
  async fetchTracks(sessionId) {
    const url = import.meta.env.VITE_CLOUDANT_URL;
    const dbName = import.meta.env.VITE_CLOUDANT_DB;

    if (!url || !dbName) {
      return this.getLocalTracksFallback(sessionId);
    }

    const proxiedUrl = getProxiedUrl(url, "/api/cloudant");
    const findUrl = `${proxiedUrl}/${dbName}/_find`;
    console.log(`Cloudant CRUD: Fetching tracks from ${findUrl} with sessionId prefix...`);

    try {
      const response = await fetchWithTimeout(findUrl, {
        method: "POST",
        headers: await getCloudantHeaders(),
        body: JSON.stringify({
          selector: {
            _id: {
              $regex: `^${sessionId}`
            }
          },
          limit: 100
        })
      });

      if (!response.ok) {
        throw new Error(`Cloudant find failed: ${response.statusText}`);
      }

      const data = await response.json();
      const docs = data.docs || [];

      // Sort documents by lastUpdated ISO timestamp descending
      docs.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));

      // Map Cloudant document fields back to App React state structure
      const tracks = docs.map((doc) => ({
        id: doc._id,
        name: doc.trackName,
        stage: doc.currentStage,
        messages: doc.messages || [],
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
   * Helper that executes the actual GET revision fetch and PUT write cycle in Cloudant.
   */
  async saveTrackDirect(sessionId, trackName, trackData) {
    const url = import.meta.env.VITE_CLOUDANT_URL;
    const dbName = import.meta.env.VITE_CLOUDANT_DB;
    const docId = `${sessionId}_${trackName}`;

    const proxiedUrl = getProxiedUrl(url, "/api/cloudant");
    const docUrl = `${proxiedUrl}/${dbName}/${encodeURIComponent(docId)}`;

    console.log(`Cloudant CRUD: Initiating upsert cycle for document: ${docId}`);

    // 1. Fetch existing revision ID (_rev) to handle CouchDB concurrency requirements
    let rev = null;
    try {
      const getRes = await fetchWithTimeout(docUrl, {
        method: "GET",
        headers: await getCloudantHeaders()
      });
      if (getRes.ok) {
        const existingDoc = await getRes.json();
        rev = existingDoc._rev;
        console.log(`Cloudant CRUD: Found existing document revision: ${rev}`);
      }
    } catch (e) {
      // Document is new, proceed with write without revision tag
      console.log("Cloudant CRUD: Document does not exist. Creating new record.");
    }

    // 2. Assemble Cloudant document payload
    const body = {
      _id: docId,
      trackName: trackName,
      currentStage: trackData.stage || "Beginner",
      messages: trackData.messages || [],
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

    if (!putResponse.ok) {
      const errText = await putResponse.text();
      throw new Error(`Cloudant PUT failed: ${putResponse.statusText} - ${errText}`);
    }

    console.log(`Cloudant CRUD: Document ${docId} successfully saved.`);
    
    const result = {
      id: docId,
      name: trackName,
      stage: body.currentStage,
      messages: body.messages,
      updatedAt: Date.parse(body.lastUpdated)
    };
    
    // Cache the updated result locally
    localStorage.setItem(`cache_${docId}`, JSON.stringify(result));
    return result;
  },

  /**
   * Saves a track with recursive single-retry handling.
   * Optimistically caches locally to localStorage first to guarantee zero data loss.
   */
  async saveTrack(sessionId, trackName, trackData) {
    const docId = `${sessionId}_${trackName}`;
    const localRecord = {
      id: docId,
      name: trackName,
      stage: trackData.stage || "Beginner",
      messages: trackData.messages || [],
      updatedAt: Date.now()
    };
    
    // Always write to localStorage cache first to prevent losing message histories
    localStorage.setItem(`cache_${docId}`, JSON.stringify(localRecord));

    try {
      return await this.saveTrackDirect(sessionId, trackName, trackData);
    } catch (error) {
      console.warn(`Cloudant CRUD: Save failed for track "${trackName}". Retrying once...`, error);
      // Wait 300ms and try one more time
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        return await this.saveTrackDirect(sessionId, trackName, trackData);
      } catch (retryError) {
        console.error(`Cloudant CRUD: Retry also failed for track "${trackName}":`, retryError);
        throw retryError; // Propagate error to trigger toast notification in App.jsx
      }
    }
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
   * Deletes a track with single-retry handling.
   */
  async deleteTrack(sessionId, trackName) {
    const docId = `${sessionId}_${trackName}`;
    localStorage.removeItem(`cache_${docId}`);

    try {
      return await this.deleteTrackDirect(sessionId, trackName);
    } catch (error) {
      console.warn(`Cloudant CRUD: Delete failed for "${trackName}". Retrying once...`, error);
      await new Promise((resolve) => setTimeout(resolve, 300));
      try {
        return await this.deleteTrackDirect(sessionId, trackName);
      } catch (retryError) {
        console.error(`Cloudant CRUD: Retry delete also failed for "${trackName}":`, retryError);
        throw retryError;
      }
    }
  }
};
