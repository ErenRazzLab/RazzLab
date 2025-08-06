// util.js
/**
 * Generate an array of random indices between 0 and totalEntries - 1 using the
 * browser crypto API.  The randomness is cryptographically secure and
 * reproducible only with the knowledge of the generated numbers, providing
 * fairness for draw execution.
 *
 * @param {number} totalEntries The total number of entries in the razz.
 * @param {number} winnersCount The number of winners to select.
 * @returns {number[]} An array of random indices.
 */
/**
 * Request a random set of integers from the random.org API.  If the request
 * fails for any reason (e.g. network error or API quota exceeded), the
 * function will fall back to using the browser’s crypto API.  See
 * https://api.random.org/ for details on obtaining an API key and quotas.
 *
 * IMPORTANT: Replace `YOUR_RANDOM_ORG_API_KEY` with your own API key in
 * the constant below.  Without a valid key the API call will fail and
 * the function will silently fall back to `crypto.getRandomValues()`.
 *
 * @param {number} totalEntries The total number of entries in the razz.
 * @param {number} winnersCount The number of winners to select.
 * @returns {Promise<number[]>} A promise that resolves to an array of random indices.
 */
export async function generateRandomIndices(totalEntries, winnersCount) {
  const API_KEY = 'YOUR_RANDOM_ORG_API_KEY';
  // Only attempt to call random.org if an API key is provided
  if (API_KEY && API_KEY !== 'YOUR_RANDOM_ORG_API_KEY') {
    const requestBody = {
      jsonrpc: '2.0',
      method: 'generateIntegers',
      params: {
        apiKey: API_KEY,
        n: winnersCount,
        min: 0,
        max: totalEntries - 1,
        replacement: false,
      },
      id: Date.now(),
    };
    try {
      const response = await fetch('https://api.random.org/json-rpc/4/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.result && Array.isArray(data.result.random?.data)) {
          return data.result.random.data;
        }
      }
    } catch (err) {
      console.warn('random.org request failed, falling back to crypto API:', err);
    }
  }
  // Fallback to crypto API if random.org fails or API key is missing
  const array = new Uint32Array(winnersCount);
  crypto.getRandomValues(array);
  const indices = [];
  for (let i = 0; i < winnersCount; i++) {
    indices.push(array[i] % totalEntries);
  }
  return indices;
}

/**
 * Convert a Firestore timestamp or Date into a human‑readable countdown string.
 * @param {Date} endTime The end time.
 * @returns {string} Countdown such as "2d 3h 15m" or "Completed" if past.
 */
export function formatCountdown(endTime) {
  const now = new Date();
  const diff = endTime - now;
  if (diff <= 0) return 'Completed';
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  const m = minutes % 60;
  if (days > 0) return `${days}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}