import { storage } from './storage';

/**
 * @param name
 * @returns
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return null;
}

export async function logout() {
  await storage.removeItem('jwt');
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login'; // Redirect to login page
  }
}
