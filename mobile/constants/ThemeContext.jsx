
import React, { createContext, useContext, useState, useMemo } from 'react';

export const palette = {
    neonGreen: '#99D935',
    black: '#000000',
    darkGray: '#121212',
    surfaceDark: '#1E1E1E',
    white: '#FFFFFF',
    lightGray: '#F8F9FA',
    borderDark: '#2C2C2C',
    borderLight: '#DEE2E6',
};

export const darkTheme = {
    background: '#000000',
    surface: '#121212',
    primary: '#99D935',
    secondary: '#AAAAAA',
    accent: '#99D935',
    border: '#2C2C2C',
    text: '#FFFFFF',
    textSecondary: '#AAAAAA',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    inputBackground: '#1E1E1E',
    buttonPrimary: '#99D935',
    buttonPrimaryText: '#000000',
    isDark: true,
};

export const lightTheme = {
    background: '#FFFFFF',
    surface: '#F8F9FA',
    primary: '#99D935',
    secondary: '#6C757D',
    accent: '#99D935',
    border: '#DEE2E6',
    text: '#000000',
    textSecondary: '#495057',
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    inputBackground: '#FFFFFF',
    buttonPrimary: '#99D935',
    buttonPrimaryText: '#000000',
    isDark: false,
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(true);

    const colors = useMemo(() => (isDarkMode ? darkTheme : lightTheme), [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(!isDarkMode);

    return (
        <ThemeContext.Provider value={{ colors, isDarkMode, toggleTheme }}>
            {children}
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
