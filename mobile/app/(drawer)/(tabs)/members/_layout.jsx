import { Stack, Link } from 'expo-router';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../constants/ThemeContext';
import DrawerToggleButton from '../../../../components/DrawerToggleButton';

export default function MembersLayout() {
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: colors.background,
                    borderBottomColor: colors.border,
                    borderBottomWidth: 1,
                },
                headerTintColor: colors.primary,
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                contentStyle: {
                    backgroundColor: colors.background,
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen name="[id]" options={{ title: 'Member Details', presentation: 'modal' }} />
            <Stack.Screen name="add" options={{ title: 'Add Member', presentation: 'modal' }} />
        </Stack>
    );
}
