import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useTheme } from '../constants/ThemeContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';

const FILTER_OPTIONS = [
    { label: 'Expired', value: 'expired' },
    { label: 'Absent', value: 'absent' },
    { label: 'Birthdays', value: 'birthday' },
    { label: 'Invoices', value: 'invoices' }
];

export default function MessagesHistory() {
    const { colors } = useTheme();
    const { filter } = useLocalSearchParams();
    const [type, setType] = useState(filter || 'expired'); 
    
    useEffect(() => {
        if (filter) setType(filter);
    }, [filter]);

    const [messages, setMessages] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, []);

    useEffect(() => {
        if (type) {
            fetchReminders();
        }
    }, [type]);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`${API_URL}/messages`);
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching message history:", error);
        }
    };

    const fetchReminders = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/dashboard/reminders/${type}`);
            const members = response.data;
            
            const fetchedMessages = members.map(m => {
                let title = '';
                let messageBody = '';
                let msgType = 'info';

                if (type === 'expired') {
                    title = 'Expiry Reminder';
                    messageBody = `Hi ${m.name}, your gym membership at BigBuddy has expired on ${new Date(m.expiryDate).toLocaleDateString()}. Please clear your pending dues to continue your fitness journey!`;
                    msgType = 'error';
                } else if (type === 'absent') {
                    title = 'Attendance Alert';
                    messageBody = `Hi ${m.name}, we haven't seen you at the gym for a few days! Consistency is key. Hope to see you back working out soon.`;
                    msgType = 'warning';
                } else if (type === 'birthday') {
                    title = 'Birthday Wish';
                    messageBody = `Happy Birthday ${m.name}! 🎂 Wishing you a fantastic day and a healthy year ahead from the team at BigBuddy Gym!`;
                    msgType = 'success';
                } else if (type === 'plans') {
                    title = 'Plan Update';
                    messageBody = `Hi ${m.name}, your new workout and diet plans have been updated. Please check the app or contact your trainer.`;
                    msgType = 'info';
                } else if (type === 'invoices') {
                    title = 'Invoice Pending';
                    messageBody = `Hi ${m.memberName}, we have received your payment of ₹${m.amount} via ${m.paymentMode}. Your gym membership plan (${m.planType || 'Regular'}) is now active!`;
                    msgType = 'invoice';
                }

                return {
                    id: m._id,
                    memberName: m.memberName || m.name,
                    phone: m.memberID?.phone || m.phone || '', 
                    email: m.memberID?.email || m.email || '',
                    title,
                    message: messageBody,
                    type: msgType,
                    date: 'Just now',
                    status: 'pending'
                };
            });
            setMessages(fetchedMessages);
        } catch (error) {
            console.error("Error fetching reminders", error);
        } finally {
            setLoading(false);
        }
    };

    const styles = getStyles(colors);

    const openLinking = async (channel, phone, email, messageText) => {
        let url = '';
        if (channel === 'WhatsApp') {
            const phoneNumber = phone.startsWith('+') ? phone : '+91' + phone; 
            url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(messageText)}`;
        } else if (channel === 'SMS') {
            url = `sms:${phone}?body=${encodeURIComponent(messageText)}`;
        } else if (channel === 'Mail') {
            url = `mailto:${email || ''}?subject=Gym Update&body=${encodeURIComponent(messageText)}`;
        }

        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
                return true;
            } else {
                Alert.alert('Error', `Cannot open ${channel} on this device.`);
                return false;
            }
        } catch (error) {
            Alert.alert('Error', `Failed to open ${channel}.`);
            return false;
        }
    };

    const sendMessage = async (item, channel) => {
        const success = await openLinking(channel, item.phone, item.email, item.message);
        if (success) {
            setTimeout(() => {
                Alert.alert(
                    "Confirm Delivery",
                    `Did you successfully send the message via ${channel}?`,
                    [
                        {
                            text: "No",
                            style: "cancel"
                        },
                        {
                            text: "Yes, Sent",
                            onPress: async () => {
                                try {
                                    if (type === 'invoices') {
                                        await axios.put(`${API_URL}/transactions/${item.id}/invoice`);
                                    }
                                    
                                    await axios.post(`${API_URL}/messages`, {
                                        memberName: item.memberName,
                                        memberPhone: item.phone,
                                        memberEmail: item.email,
                                        message: item.message,
                                        channel,
                                        type: item.type
                                    });

                                    setMessages(prev => prev.map(m => m.id === item.id ? { ...m, status: 'sent', channel } : m));
                                    fetchHistory();
                                } catch (err) {
                                    console.log("Failed to update db status or history log", err);
                                }
                            }
                        }
                    ]
                );
            }, 1000);
        }
    };

    const showChannelPicker = (item) => {
        Alert.alert(
            "Send Reminder",
            `Choose delivery channel for ${item.memberName}:`,
            [
                { text: "WhatsApp", onPress: () => sendMessage(item, "WhatsApp") },
                { text: "SMS", onPress: () => sendMessage(item, "SMS") },
                { text: "Mail", onPress: () => sendMessage(item, "Mail") },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };



    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Send Reminders',
                    headerShown: true,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.primary
                }}
            />

            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Horizontal Filter Picker */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20, flexGrow: 0 }}>
                    {FILTER_OPTIONS.map(opt => (
                        <Pressable 
                            key={opt.value} 
                            style={[
                                styles.typeBadge, 
                                { marginRight: 10, paddingVertical: 8, paddingHorizontal: 15 },
                                type === opt.value && { backgroundColor: colors.primary }
                            ]}
                            onPress={() => setType(opt.value)}
                        >
                            <Text style={[
                                styles.typeText, 
                                { fontSize: 12 },
                                type === opt.value && { color: colors.buttonPrimaryText }
                            ]}>
                                {opt.label.toUpperCase()}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>

                <>
                    <View style={styles.historyHeader}>
                        <Text style={styles.sectionHeader}>Pending Reminders</Text>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
                    ) : messages.length === 0 ? (
                        <Text style={styles.emptyText}>No pending actions for {type}.</Text>
                    ) : (
                        messages.map((item, index) => (
                                <View key={item._id || item.id || `msg-${index}`} style={[styles.card, { borderLeftColor: item.type === 'error' ? colors.error : colors.primary }]}>
                                    <View style={styles.cardHeaderRow}>
                                        <Text style={styles.cardTitle}>{item.title}</Text>
                                        <Text style={styles.cardDate}>{item.date}</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                        <Text style={{ color: colors.secondary, fontWeight: 'bold' }}>To: {item.memberName}</Text>
                                        <Text style={{ color: colors.secondary, fontSize: 12, marginLeft: 10 }}>({item.phone})</Text>
                                    </View>
                                    <Text style={styles.message}>{item.message}</Text>
                                    <View style={styles.statusRow}>
                                        <Text style={styles.statusText}>
                                            {item.status === 'sent' ? `SENT via ${item.channel || 'System'}` : 'READY TO SEND'}
                                        </Text>
                                        {item.status !== 'sent' && (
                                            <Pressable style={styles.sendBtn} onPress={() => showChannelPicker(item)}>
                                                <MaterialCommunityIcons name="send" size={16} color={colors.buttonPrimaryText} />
                                            </Pressable>
                                        )}
                                    </View>
                                </View>
                            ))
                        )}
                </>

                <Text style={[styles.sectionHeader, { marginTop: 20 }]}>Sent History (Recent)</Text>
                {history.length > 0 ? history.map(chat => (
                    <View key={chat._id} style={styles.chatRow}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>{chat.memberName[0]}</Text></View>
                        <View style={{ flex: 1 }}>
                            <View style={styles.chatHeader}>
                                <Text style={styles.chatName}>{chat.memberName}</Text>
                                <Text style={styles.chatTime}>{new Date(chat.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</Text>
                            </View>
                            <Text style={styles.chatMsg}>Sent via {chat.channel}: {chat.message.substring(0, 50)}...</Text>
                        </View>
                    </View>
                )) : (
                    <Text style={styles.emptyText}>No historical messages found.</Text>
                )}
            </ScrollView>

        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    sectionHeader: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
    historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    typeBadge: { backgroundColor: colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    typeText: { color: colors.primary, fontSize: 10, fontWeight: 'bold' },
    card: { backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, elevation: 2 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardTitle: { color: colors.primary, fontSize: 14, fontWeight: 'bold' },
    cardDate: { color: colors.secondary, fontSize: 11 },
    message: { color: colors.text, fontSize: 15, marginBottom: 10, lineHeight: 20 },
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
    statusText: { color: colors.secondary, fontSize: 11, fontWeight: '500' },
    sendBtn: { backgroundColor: colors.primary, padding: 8, borderRadius: 20 },
    chatRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    avatarText: { color: colors.primary, fontWeight: 'bold', fontSize: 18 },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    chatName: { color: colors.text, fontWeight: 'bold', fontSize: 16 },
    chatMsg: { color: colors.secondary, fontSize: 14 },
    chatTime: { color: colors.secondary, fontSize: 11 },
    footer: { padding: 20, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    sendAllBtn: { backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
    sendAllText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 16 },
    emptyText: { color: colors.secondary, textAlign: 'center', padding: 20 }
});
