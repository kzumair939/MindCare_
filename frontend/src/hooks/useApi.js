import { useState, useCallback } from "react";
import api from "../api/axios";

export function useApi(fn) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true); setError(null);
    try { const r = await fn(...args); setData(r.data); return r.data; }
    catch (e) { const msg = e.response?.data?.error || e.message; setError(msg); throw new Error(msg); }
    finally { setLoading(false); }
  }, [fn]);

  return { data, loading, error, execute };
}

export default useApi;
