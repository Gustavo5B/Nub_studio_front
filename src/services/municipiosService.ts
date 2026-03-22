const API_URL = import.meta.env.VITE_API_URL;

export const getMunicipiosHidalgo = async () => {
  const response = await fetch(`${API_URL}/api/municipios/hidalgo/count`);
  const data = await response.json();
  return data.data.total;
};