// src/services/authService.ts

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
    rol: string;   // ← AGREGA ESTO
    artista_estado?: string;  // ← AGREGA ESTO
  };
  attemptsRemaining?: number;
  totalAttempts?: number;
}

interface RegisterResponse {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, contrasena }),
      });

      const data = await response.json();
      console.log('📥 Respuesta recibida:', { status: response.status, data });

      if (!response.ok) {
        const error: LoginError = {
          status: response.status,
          error: data,
        };
        throw error;
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        console.error('❌ Error de conexión:', error);
        throw {
          status: 0,
          error: {
            message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.'
          }
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nombre, correo, contrasena, aceptoTerminos }),
    });

    const data = await response.json();
    console.log('📥 Respuesta registro:', response.status, data);

    if (!response.ok) {
      throw {
        status: response.status,
        error: data,
      };
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

  if (!response.ok) {
    throw { status: response.status, error: data };
  }

  return data;
}
  async verifyGmail2FA(correo: string, codigo: string): Promise<LoginResponse> {
    try {
      const url = `${this.apiUrl}/api/auth/verify-login-code`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, codigo }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          error: data,
        };
      }

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ correo, codigo2fa }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          error: data,
        };
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async checkSession(): Promise<{ valid: boolean; message: string }> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return { valid: false, message: 'No hay sesión activa' };
      }

      const url = `${this.apiUrl}/api/auth/check-session`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { valid: false, message: 'Sesión inválida' };
      }

      return data;
    } catch (error) {
      return { valid: false, message: 'Error al verificar sesión' };
    }
  }

  async closeOtherSessions(): Promise<{ message: string; sessionsRevoked: number }> {
    try {
      const token = this.getToken();
      
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      const url = `${this.apiUrl}/api/auth/close-other-sessions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    const token = this.getToken();
    if (token) {
      fetch(`${this.apiUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('temp_correo_2fa');
    localStorage.removeItem('artistaFoto');
  }

  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  getToken(): string | null {
    return localStorage.getItem('access_token') || localStorage.getItem('token');
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
}

export const authService = new AuthService();