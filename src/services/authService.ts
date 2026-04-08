// src/services/authService.ts

// =========================================================
// FIX ZAP — Helper de cookies seguras (en paralelo a localStorage)
// =========================================================
const cookieOptions = "path=/; SameSite=Strict; max-age=86400";

const setCookie = (name: string, value: string) => {
  const secure = globalThis.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; ${cookieOptions}${secure}`;
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

const removeCookie = (name: string) => {
  document.cookie = `${name}=; path=/; max-age=0`;
};

interface LoginResponse {
  message: string;
  access_token?: string;
  token?: string;
  token_type?: string;
  blocked?: boolean;
  minutesRemaining?: number;
  minutesBlocked?: number;
  unlockTime?: string;
  requires2FA?: boolean;
  requiresVerification?: boolean;
  correo?: string;
  metodo_2fa?: string;
  usuario?: {
    id: number;
    nombre: string;
    correo: string;
    estado: string;
    rol: string;
    artista_estado?: string;
  };
  attemptsRemaining?: number;
  totalAttempts?: number;
}

interface RegisterResponse {
  success?: boolean;
  message: string;
  user?: {
    id: number;
    nombre: string;
    correo: string;
  };
}

interface LoginError {
  status: number;
  error: {
    blocked?: boolean;
    minutesRemaining?: number;
    minutesBlocked?: number;
    unlockTime?: string;
    attemptsRemaining?: number;
    totalAttempts?: number;
    message?: string;
    requiresVerification?: boolean;
  };
}

class AuthService {
  private apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  constructor() {
    console.log('🔗 API URL configurada:', this.apiUrl);
  }

  async login(correo: string, contrasena: string): Promise<LoginResponse> {
    try {
      const url = `${this.apiUrl}/api/auth/login`;
      console.log('📡 Enviando request a:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await response.json();
      console.log('📥 Respuesta recibida:', { status: response.status, data });

      if (!response.ok) {
        throw { status: response.status, error: data } as LoginError;
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('❌ Error de conexión:', error);
        throw {
          status: 0,
          error: { message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.' }
        } as LoginError;
      }
      throw error;
    }
  }

  async register(nombre: string, correo: string, contrasena: string, aceptoTerminos: boolean = true): Promise<RegisterResponse> {
    try {
      const url = `${this.apiUrl}/api/auth/register`;
      console.log('📡 Registrando en:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, contrasena, aceptoTerminos }),
      });

      const data = await response.json();
      console.log('📥 Respuesta registro:', response.status, data);

      if (!response.ok) {
        throw { status: response.status, error: data };
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(correo: string, codigo: string): Promise<{ message: string; verified: boolean }> {
    const url = `${this.apiUrl}/api/auth/verify-email`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, codigo }),
    });
    const data = await response.json();
    if (!response.ok) throw { status: response.status, error: data };
    return data;
  }

  async verifyGmail2FA(correo: string, codigo: string): Promise<LoginResponse> {
    try {
      const url = `${this.apiUrl}/api/auth/verify-login-code`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, codigo }),
      });
      const data = await response.json();
      if (!response.ok) throw { status: response.status, error: data };
      return data;
    } catch (error) {
      throw error;
    }
  }

  async verifyTOTP2FA(correo: string, codigo2fa: string): Promise<LoginResponse> {
    try {
      const url = `${this.apiUrl}/api/auth/login-2fa`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, codigo2fa }),
      });
      const data = await response.json();
      if (!response.ok) throw { status: response.status, error: data };
      return data;
    } catch (error) {
      throw error;
    }
  }

  async checkSession(): Promise<{ valid: boolean; message: string }> {
    try {
      const token = this.getToken();
      if (!token) return { valid: false, message: 'No hay sesión activa' };

      const response = await fetch(`${this.apiUrl}/api/auth/check-session`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) return { valid: false, message: 'Sesión inválida' };
      return data;
    } catch (error) {
      return { valid: false, message: 'Error al verificar sesión' };
    }
  }

  async closeOtherSessions(): Promise<{ message: string; sessionsRevoked: number }> {
    try {
      const token = this.getToken();
      if (!token) throw new Error('No hay sesión activa');

      const response = await fetch(`${this.apiUrl}/api/auth/close-other-sessions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // =========================================================
  // FIX ZAP — logout limpia localStorage Y cookies
  // =========================================================
  logout(): void {
    const token = this.getToken();
    if (token) {
      fetch(`${this.apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    // Limpiar localStorage (igual que antes)
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRol');
    localStorage.removeItem('temp_correo_2fa');
    localStorage.removeItem('artistaFoto');
    // FIX: también limpiar cookies
    removeCookie('access_token');
    removeCookie('token');
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  // =========================================================
  // FIX ZAP — getToken lee localStorage Y cookies
  // =========================================================
  getToken(): string | null {
    return localStorage.getItem('access_token')
      || localStorage.getItem('token')
      || getCookie('access_token')
      || getCookie('token');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  // =========================================================
  // FIX ZAP — método para guardar token en cookie segura
  // Llámalo desde Login.tsx, LoginModal.tsx, TwoFactorVerify.tsx
  // después de: localStorage.setItem("access_token", token)
  // agrega:     authService.saveTokenCookie(token)
  // =========================================================
  saveTokenCookie(token: string): void {
    setCookie('access_token', token);
  }
}

export const authService = new AuthService();