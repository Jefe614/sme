import { createContext, useState, useEffect, useContext } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Get initial theme from localStorage or default to dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) {
      return true; // Always return dark mode if anything is stored
    }
    // Default to dark mode
    return true;
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Antd theme configuration
  const antdThemeConfig = {
    algorithm: isDarkMode ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: isDarkMode ? '#1890ff' : '#1890ff',
      colorBgContainer: isDarkMode ? '#141414' : '#ffffff',
      colorBgLayout: isDarkMode ? '#000000' : '#fafafa',
      colorText: isDarkMode ? '#ffffff' : '#000000',
      colorTextSecondary: isDarkMode ? '#a6a6a6' : '#666666',
      borderRadius: 6,
    },
    components: {
      Layout: {
        siderBg: isDarkMode ? '#1f1f1f' : '#ffffff',
        triggerBg: isDarkMode ? '#262626' : '#fafafa',
        headerBg: isDarkMode ? '#1f1f1f' : '#ffffff',
      },
      Menu: {
        darkItemBg: isDarkMode ? '#1f1f1f' : '#ffffff',
        darkItemColor: isDarkMode ? '#ffffff' : '#000000',
        darkItemSelectedBg: isDarkMode ? '#1890ff' : '#e6f7ff',
        darkItemHoverBg: isDarkMode ? '#262626' : '#f0f0f0',
      },
    },
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ConfigProvider theme={antdThemeConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
