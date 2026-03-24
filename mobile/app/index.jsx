
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router, Link } from 'expo-router';
import { useTheme } from '../constants/ThemeContext';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userDataJson = await AsyncStorage.getItem('userData');
        if (token && userDataJson) {
          const userData = JSON.parse(userDataJson);
          // Route based on role
          if (userData.role === 'member') {
            router.replace('/(user)/(tabs)');
          } else {
            router.replace('/(drawer)/(tabs)');
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkLogin();
  }, []);

  return (

    <View style={styles.container}>
      <Text style={styles.title}>BIG BUDDY</Text>
      <Text style={styles.subtitle}>GYM E-LOG BOOK</Text>
      <Link href="/login" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 18,
    color: colors.secondary,
    marginBottom: 40,
    letterSpacing: 4,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: colors.buttonPrimaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
