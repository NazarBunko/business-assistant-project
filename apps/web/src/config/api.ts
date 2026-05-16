// Browser calls same-origin /api (Next.js proxy) so httpOnly cookies work.
// Server-side proxy uses API_URL_INTERNAL (Render / local Nest).
export const API_URL =
  typeof window !== "undefined"
    ? "/api"
    : (process.env.API_URL_INTERNAL?.replace(/\/$/, "") ?? "http://localhost:3001");
