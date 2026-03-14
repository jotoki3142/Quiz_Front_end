'use client';

import React, { createContext, useContext, useCallback } from 'react';
import useSWR from 'swr';
import { fetchApi, ApiError } from '@/lib/apiClient';

interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'UNKNOWN';
  avatarUrl?: string;
  authorities: Array<{ authority: string }>;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: any;
  mutate: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

import { storage } from './storage';

const fetcher = async (url: string): Promise<User | null> => {
  try {
    const token = await storage.getItem('jwt');
    if (!token) {
      return null;
    }

    // Lấy thông tin user cơ bản từ /me
    const rawUserData = await fetchApi(url);

    // Cố gắng lấy thêm thông tin hồ sơ chi tiết (bao gồm avatar) từ /profile
    let profileData: any = null;
    try {
      profileData = await fetchApi('/profile');
    } catch (profileError) {
      console.warn('UserProvider fetcher: Could not fetch /profile, continue with /me only.', profileError);
    }

    const rawAuthority = rawUserData?.authorities?.[0]?.authority || 'ROLE_UNKNOWN';
    const cleanRole = rawAuthority.replace('ROLE_', '').toUpperCase();

    const avatarFromProfile = profileData?.avatar || profileData?.avatarUrl;
    const avatarFromMe = (rawUserData as any)?.avatar || (rawUserData as any)?.avatarUrl;

    let finalAvatarUrl: string | undefined = avatarFromProfile || avatarFromMe;

    // Nếu backend trả về đường dẫn tương đối (vd: "/uploads/xxx.jpg"), ghép với base URL backend
    if (finalAvatarUrl && typeof finalAvatarUrl === 'string' && finalAvatarUrl.startsWith('/')) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082/api';
      const backendBase = apiBase.replace(/\/$/, '').replace(/\/api$/, '');
      finalAvatarUrl = backendBase + finalAvatarUrl;
    }

    const displayNameFromProfile = profileData?.name || profileData?.username;

    const transformedUser: User = {
      ...rawUserData,
      id: rawUserData.id,
      // Nếu backend dùng username là email, vẫn giữ nguyên email cũ,
      // nhưng thêm firstName lấy từ hồ sơ để hiển thị tên người dùng.
      email: rawUserData.username,
      firstName: displayNameFromProfile || rawUserData.firstName,
      lastName: rawUserData.lastName,
      role: cleanRole as User['role'],
      // Ưu tiên avatar từ /profile, nếu không có thì fallback về dữ liệu từ /me (nếu có),
      // đồng thời đảm bảo avatarUrl là URL đầy đủ
      avatarUrl: finalAvatarUrl,
    };

    console.log('UserProvider fetcher: Data transformed. Clean Role:', transformedUser.role, 'AvatarUrl:', transformedUser.avatarUrl);

    return transformedUser;
  } catch (error: any) {
    console.error('UserProvider fetcher: Error fetching /me or /profile:', error);
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
};

    export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      const { data, error, isLoading, mutate } = useSWR<User | null>(
        '/me',
        fetcher,
        {
          shouldRetryOnError: false,
          revalidateOnFocus: false,
          revalidateIfStale: true,
          revalidateOnMount: true,
        }
      );

      const isAuthenticated = !!data && !error;

      const value = {
        user: data || null,
        isLoading,
        error,
        mutate: useCallback(() => mutate(), [mutate]),
        isAuthenticated,
      };

      return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
    };

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
