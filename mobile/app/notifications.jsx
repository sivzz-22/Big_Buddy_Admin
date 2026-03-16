import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTheme } from '../constants/ThemeContext';

const MOCK_SYSTEM_NOTIF = [
    { id: '1', title: 'System Update', message: 'New version 1.2.0 is available with performance fixes.', type: 'info', date: '2h ago' },
    { id: '2', title: 'Server Maintenance', message: 'BigBuddy services will be down for 30 mins at midnight.', type: 'warning', date: '5h ago' },
    { id: '3', title: 'Payment Success', message: 'Your subscription for BigBuddy Pro has been renewed.', type: 'success', date: 'Yesterday' },
];

export default function Notifications() {
    const { colors } = useTheme();
    const styles = getStyles(colors);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Notifications',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.primary
            }} />

            <ScrollView contentContainerStyle={styles.content}>
                {MOCK_SYSTEM_NOTIF.map((item) => (
                    <View key={item.id} style={styles.notifCard}>
                        <View style={[styles.iconCircle, { backgroundColor: item.type === 'warning' ? 'rgba(255, 152, 0, 0.1)' : colors.primary + '1A' }]}>
                            <Ionicons
                                name={item.type === 'warning' ? 'alert-circle' : 'notifications'}
                                size={22}
                                color={item.type === 'warning' ? '#FF9800' : colors.primary}
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <View style={styles.notifHeader}>
                                <Text style={styles.notifTitle}>{item.title}</Text>
                                <Text style={styles.notifDate}>{item.date}</Text>
                            </View>
                            <Text style={styles.notifMessage}>{item.message}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20 },
    notifCard: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    iconCircle: {
        width: 48, height: 48, borderRadius: 24,
        justifyContent: 'center', alignItems: 'center',
        marginRight: 15
    },
    textContainer: { flex: 1 },
    notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    notifTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
    notifDate: { color: colors.secondary, fontSize: 12 },
    notifMessage: { color: colors.secondary, fontSize: 14, lineHeight: 20 },
});
