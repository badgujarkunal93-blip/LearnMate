// IBM watsonx Orchestrate AI Service for LearnMate
// Connects to the live watsonx Orchestrate agent using IBM Cloud IAM OAuth tokens

// Token Cache Manager
let tokenCache = {
  accessToken: null,
  expiresAt: 0 // Milliseconds timestamp
};

/**
 * Route URLs through the Vite development proxy if running locally.
 */
function getProxiedUrl(originalUrl, proxyPrefix) {
  if (!originalUrl) return "";
  if (import.meta.env.DEV) {
    try {
      const urlObj = new URL(originalUrl);
      return `${proxyPrefix}${urlObj.pathname}${urlObj.search}`;
    } catch (e) {
      console.warn("Failed to parse URL for proxy, using original:", originalUrl);
      return originalUrl;
    }
  }
  return originalUrl;
}

/**
 * Exchanges VITE_WATSONX_API_KEY for an IBM Cloud IAM bearer token.
 * Caches the token and automatically refreshes it before expiration.
 */
async function getIAMToken() {
  const apiKey = import.meta.env.VITE_WATSONX_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_WATSONX_API_KEY is not defined in environment variables.");
  }

  // If token exists and is valid for at least another 60 seconds, reuse it
  if (tokenCache.accessToken && tokenCache.expiresAt > Date.now() + 60000) {
    return tokenCache.accessToken;
  }

  console.log("watsonx AI Service: Exchanging IAM API Key for a fresh OAuth bearer token...");
  
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
    throw new Error(`IBM IAM Token Exchange failed: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  // Cache the token
  tokenCache.accessToken = data.access_token;
  // expires_in is in seconds, convert to absolute ms timestamp
  tokenCache.expiresAt = Date.now() + (data.expires_in * 1000);
  
  console.log("watsonx AI Service: IAM Token acquired and cached successfully.");
  return tokenCache.accessToken;
}

/**
 * Sends messages to the watsonx Orchestrate Agent Chat Completions API.
 * 
 * @param {string} userMessage The current message text sent by the user (already appended in history)
 * @param {Array} history Array of previous messages in the format [{ sender: 'user'|'agent', text: '...' }]
 * @param {string} trackName Name of the learning track (e.g. "Frontend Development")
 * @returns {Promise<string>} The agent's response text containing optional quiz tags
 */
export async function sendMessageToAgent(userMessage, history = [], trackName = "", stage = "Beginner") {
  const apiUrl = import.meta.env.VITE_WATSONX_API_URL;
  const agentId = import.meta.env.VITE_WATSONX_AGENT_ID;

  if (!apiUrl || !agentId) {
    throw new Error("VITE_WATSONX_API_URL or VITE_WATSONX_AGENT_ID is not configured in .env");
  }

  // 1. Retrieve the IAM token (fetches fresh or returns cached token)
  const token = await getIAMToken();

  // 2. Build the messages array for the chat completions API.
  // Since the diagnostic quiz and roadmap presentation are handled locally in our codebase,
  // by the time we call this endpoint the user is already placed in a specific track/stage.
  // We instruct the agent to act strictly as a helpful tutor/coach for that track and stage.

  const mappedMessages = history.map((msg) => ({
    role: msg.sender === "user" ? "user" : "assistant",
    content: msg.text
  }));

  const systemContent = `You are LearnMate, a friendly, encouraging personal course roadmap coach and tutor.
The student has selected the "${trackName}" learning track and is currently studying at the **${stage}** level.

YOUR ROLE:
- Act as a helpful tutor and coach for the "${trackName}" track at the **${stage}** level.
- Help them learn the topics, clarify concepts, and guide them on their milestone project.
- Answer their questions, explain ideas clearly, and recommend study materials.
- Do NOT ask them which track they want, do NOT try to restart any skill checks or diagnostic quizzes, and do NOT ask how they want to start.
- Keep your answers concise, well-structured, and encouraging. Use markdown formatting like bold text and bullet points.`;

  const completionsMessages = [
    { role: "system", content: systemContent },
    ...mappedMessages
  ];

  // Route completions URL through dev proxy in development mode
  const proxiedApiUrl = getProxiedUrl(apiUrl, "/api/watsonx");
  const endpoint = `${proxiedApiUrl}/v1/orchestrate/${agentId}/chat/completions`;
  
  console.log(`watsonx AI Service: Posting chat completions to: ${endpoint}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      messages: completionsMessages,
      model: "ibm/granite-13b-chat-v2",
      temperature: 0.3,
      stream: false
    })
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`watsonx completions failed (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  
  // 5. Parse and return the content reply
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  
  throw new Error("Unexpected response schema from watsonx Orchestrate API");
}
