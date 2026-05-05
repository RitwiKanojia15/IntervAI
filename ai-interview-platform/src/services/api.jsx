import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only auto-redirect on 401 for non-auth endpoints
    // (login/register failures should show inline errors, not redirect)
    const url = err.config?.url || "";
    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register");
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const loginUser    = (data)     => api.post("/auth/login", data);
export const registerUser = (data)     => api.post("/auth/register", data);
export const getMe        = ()         => api.get("/auth/me");
export const updateProfile = (data)   => api.patch("/auth/me", data);
export const getMyStats   = ()         => api.get("/stats/me");
export const uploadResume = (formData) => api.post("/resume/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});
export const startInterview       = (data)       => api.post("/interview/start", data);
export const getInterviewQuestion = (sessionId, index) => api.get(`/interview/question/${sessionId}`, { params: { index } });
export const submitAnswer         = (data)       => api.post("/interview/answer", data);
export const evaluateAnswer       = (data)       => api.post("/interview/evaluate", data);
export const getInterviewResult   = (sessionId)  => api.get(`/interview/result/${sessionId}`);
export const getInterviewHistory  = ()           => api.get("/interview/history");
export const startTestSession   = (params) => api.get("/test/start", { params });
export const evaluateTestAnswer = (data)   => api.post("/test/answer", data);
export const submitTestSession  = (data)   => api.post("/test/submit", data);
export const createLiveTest     = (data)   => api.post("/live/create", data);
export const joinLiveTest       = (data)   => api.post("/live/join", data);
export const startLiveTest      = (testId, data) => api.post(`/live/start/${testId}`, data);
export const getLiveTestSession = (testId, params) => api.get(`/live/session/${testId}`, { params });
export const saveLiveTestAnswers = (testId, data) => api.patch(`/live-tests/${testId}/answers`, data);
export const submitLiveTest     = (testId, data) => api.post(`/live-tests/${testId}/submit`, data);
export const getLiveTestLeaderboard = (testId, params) =>
  api.get(`/live/leaderboard/${testId}`, { params });
export const recordLiveTestWarning = (testId, data) => api.post(`/live-tests/${testId}/warnings`, data);

// Versant Assessment
export const getVersantModule  = (type, count) => api.get(`/versant/module/${type}`, { params: count ? { count } : {} });
export const submitVersant     = (data)         => api.post("/versant/submit", data);
export const submitVersantSpeaking = (data)     => api.post("/versant/speaking", data);

// GTG – Group Discussion (text-based, existing)
export const createGtgRoom   = (data)    => api.post("/gtg/create", data);
export const joinGtgRoom     = (data)    => api.post("/gtg/join", data);
export const getGtgRoom      = (roomId)  => api.get(`/gtg/room/${roomId}`);
export const getGtgByCode    = (code)    => api.get(`/gtg/code/${code}`);
export const startGtg        = (data)    => api.post("/gtg/start", data);
export const endGtg          = (data)    => api.post("/gtg/end", data);
export const getGtgResults   = (roomId)  => api.get(`/gtg/results/${roomId}`);

// GD – Group Discussion with WebRTC video/audio
export const createGDRoom    = (data)    => api.post("/gd/create", data);
export const joinGDRoom      = (data)    => api.post("/gd/join", data);
export const getGDRoom       = (roomId)  => api.get(`/gd/room/${roomId}`);
export const startGD         = (roomId, data) => api.post(`/gd/start/${roomId}`, data);
export const endGD           = (roomId, data) => api.post(`/gd/end/${roomId}`, data);
export const saveGDMessage   = (data)    => api.post("/gd/message", data);
export const getGDResults    = (roomId)  => api.get(`/gd/result/${roomId}`);

export default api;
