const API_URL = import.meta.env.VITE_API_URL;

export const getSobreNosotros = async () => {
  const response = await fetch(`${API_URL}/api/sobre-nosotros`);
  const data = await response.json();
  return data.data;
};

export const getTrayectoria = async () => {
  const response = await fetch(`${API_URL}/api/sobre-nosotros/trayectoria`);
  const data = await response.json();
  return data.data;
};