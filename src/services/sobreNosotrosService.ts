import { fetchJsonWithBackup } from "../utils/offlineStore";

const API_URL = import.meta.env.VITE_API_URL;

export const getSobreNosotros = async <T>(): Promise<T> => {
  const data = await fetchJsonWithBackup<{ data: T }>(`${API_URL}/api/sobre-nosotros`);
  return data.data;
};

export const getTrayectoria = async <T>(): Promise<T> => {
  const data = await fetchJsonWithBackup<{ data: T }>(`${API_URL}/api/sobre-nosotros/trayectoria`);
  return data.data;
};
