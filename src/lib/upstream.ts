import axios from "axios";

/**
 * Pre-configured axios instance for upstream API Gateway calls.
 * Used server-side only — env vars are not exposed to the browser.
 */
export const upstream = axios.create({
  baseURL: `${process.env.UPLOAD_API_BASE_URL}/${process.env.API_STAGE}`,
  headers: { "Content-Type": "application/json" },
});
