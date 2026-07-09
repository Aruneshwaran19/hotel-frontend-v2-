const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "");

if (!rawApiUrl) {
  throw new Error(
    "VITE_API_URL is not configured. Set it in HotelFrontend/.env for production builds.",
  );
}

const normalizedApiUrl = rawApiUrl.replace(/\/+$/, "");
const normalizedApiOrigin = normalizedApiUrl.replace(/\/api$/, "");

export const API_BASE_URL = normalizedApiOrigin;
export const API_URL = `${normalizedApiOrigin}/api`;
