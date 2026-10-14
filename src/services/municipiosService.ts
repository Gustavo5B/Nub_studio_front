import { fetchJsonWithBackup } from "../utils/offlineStore";

const API_URL = import.meta.env.VITE_API_URL;

export const getMunicipiosHidalgo = async () => {
  const data = await fetchJsonWithBackup<{ data: { total: number } }>(`${API_URL}/api/municipios/hidalgo/count`);
  return data.data.total;
};
