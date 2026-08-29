import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';

export const ThemeContext = createContext();

export const themes = [
  {
    id: 'purple',
    name: 'Electric Purple',
    color: '#6C47FF',
    hover: '#5835E5',
    lightBg: '#F3F0FF',
    gradient: ['#6C47FF', '#4F46E5'],
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    color: '#2563EB',
    hover: '#1D4ED8',
    lightBg: '#EFF6FF',
    gradient: ['#2563EB', '#06B6D4'],
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    color: '#059669',
    hover: '#047857',
    lightBg: '#ECFDF5',
    gradient: ['#059669', '#10B981'],
  },
  {
    id: 'amber',
    name: 'Sunset Amber',
    color: '#D97706',
    hover: '#B45309',
    lightBg: '#FFFBEB',
    gradient: ['#D97706', '#F59E0B'],
  },
  {
    id: 'rose',
    name: 'Cyber Rose',
    color: '#E11D48',
    hover: '#BE123C',
    lightBg: '#FFF1F2',
    gradient: ['#E11D48', '#F43F5E'],
  },
];

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('dark');
  const [currentThemeId, setCurrentThemeId] = useState('purple');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadStoredTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem('theme-mode');
        const storedThemeId = await AsyncStorage.getItem('app-theme');
        if (storedMode) {
          setThemeMode(storedMode);
        } else {
          const colorScheme = Appearance.getColorScheme();
          setThemeMode(colorScheme === 'light' ? 'light' : 'dark');
        }
        if (storedThemeId) {
          setCurrentThemeId(storedThemeId);
        }
      } catch (e) {
        console.warn('Failed to load theme preference', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadStoredTheme();
  }, []);

  const changeThemeMode = useCallback(async (mode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('theme-mode', mode);
    } catch (e) {
      console.warn('Failed to save theme mode', e);
    }
  }, []);

  const toggleThemeMode = useCallback(() => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    changeThemeMode(nextMode);
  }, [themeMode, changeThemeMode]);

  const changeThemeColor = useCallback(async (themeId) => {
    setCurrentThemeId(themeId);
    try {
      await AsyncStorage.setItem('app-theme', themeId);
    } catch (e) {
      console.warn('Failed to save theme color', e);
    }
  }, []);

  const isDark = themeMode === 'dark';
  const activeTheme = themes.find((t) => t.id === currentThemeId) || themes[0];

  const colors = {
    primary: activeTheme.color,
    primaryHover: activeTheme.hover,
    primaryLight: activeTheme.lightBg,
    primaryGradient: activeTheme.gradient,
    background: isDark ? '#0B0D13' : '#F7F8FC',
    card: isDark ? '#131722' : '#FFFFFF',
    cardSecondary: isDark ? '#181C2B' : '#F8FAFC',
    sidebar: isDark ? '#0F121C' : '#FFFFFF',
    text: isDark ? '#F8FAFC' : '#0F172A',
    textMuted: isDark ? '#94A3B8' : '#64748B',
    textDim: isDark ? '#64748B' : '#94A3B8',
    border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    borderSoft: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    borderFocus: activeTheme.color,
    inputBg: isDark ? '#161A26' : '#FFFFFF',
    navBg: isDark ? 'rgba(15, 18, 28, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  };

  const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    hero: 48,
  };

  const radii = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  };

  const typography = {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      web: "'SF Pro Display', 'SF Pro Text', 'SF Pro', -apple-system, BlinkMacSystemFont, 'San Francisco', sans-serif",
    }),
    fontSizes: {
      xs: 11,
      sm: 13,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 22,
      xxxl: 26,
      hero: 32,
    },
    fontWeights: {
      regular: '400',
      medium: '500',
      semiBold: '600',
      bold: '700',
      extraBold: '800',
      black: '900',
    },
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = colors.background;
      document.body.style.backgroundColor = colors.background;
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.backgroundColor = colors.background;
      }
    }
  }, [colors.background]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        isDark,
        currentThemeId,
        activeTheme,
        colors,
        spacing,
        radii,
        typography,
        themes,
        toggleThemeMode,
        changeThemeMode,
        changeThemeColor,
        isLoaded,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

