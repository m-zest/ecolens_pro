import axios from "axios";

// Empty string = same-origin (the Vercel single-project deployment). A full
// URL (e.g. http://localhost:8001) is used during split local dev.
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/$/, "");
export const API = `${BACKEND_URL}/api`;
export const SHARE_BASE = BACKEND_URL;

const http = axios.create({ baseURL: API, timeout: 30000 });

export const apiListPackagings = (params = {}) =>
  http.get("/packagings", { params }).then((r) => r.data);
export const apiGetPackaging = (id) => http.get(`/packagings/${id}`).then((r) => r.data);
export const apiGetCategories = () =>
  http.get("/packagings/categories").then((r) => r.data.categories);
export const apiCompare = (id_a, id_b) =>
  http.post("/packagings/compare", { id_a, id_b }).then((r) => r.data);
export const apiGenerateStory = (id, tone = "editorial", locale = "en") =>
  http.post(`/packagings/${id}/story`, { tone, locale }).then((r) => r.data);
export const apiSubmit = (payload) => http.post("/submissions", payload).then((r) => r.data);
export const apiListPublicSubmissions = (limit = 48) =>
  http.get("/submissions", { params: { limit } }).then((r) => r.data);
export const apiStats = () => http.get("/stats").then((r) => r.data);
