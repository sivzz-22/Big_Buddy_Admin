import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, Linking, Modal } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useTheme } from '../constants/ThemeContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';

const FILTER_OPTIONS = [
    { label: 'Expired', value: 'expired' },
    { label: 'Absent', value: 'absent' },
    { label: 'Birthdays', value: 'birthday' },
    { label: 'Invoices', value: 'invoices' },
    { label: 'Balance', value: 'balance' },
];

const CHANNELS = [
    { key: 'WhatsApp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
    { key: 'SMS', label: 'SMS', icon: 'chatbubble-outline', color: '#607D8B' },
    { key: 'Mail', label: 'Email', icon: 'mail-outline', color: '#2196F3' },
    { key: 'App', label: 'Via App', icon: 'paper-plane-outline', color: '#FF5722' },
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

    // Channel picker modal state
    const [channelModalVisible, setChannelModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [sending, setSending] = useState(false);

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
                } else if (type === 'balance') {
                    title = 'Balance Reminder';
                    messageBody = `Hi ${m.name}, you have a pending balance of ₹${m.balance} at BigBuddy Gym. Please clear your dues at your earliest convenience. Thank you!`;
                    msgType = 'warning';
                }

                return {
                    id: m._id,
                    memberId: m._id,
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
        if (channel === 'App') return true; // handled separately, no URL needed
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
        setSending(true);
        setChannelModalVisible(false);

        // Handle In-App channel directly — no linking needed
        if (channel === 'App') {
            try {
                let memberId = item.memberId || null;
                if (!memberId && item.email) {
                    try {
                        const res = await axios.get(`${API_URL}/members/${item.email}`);
                        memberId = res.data._id;
                    } catch (e) { /* skip if not found */ }
                }

                if (type === 'invoices') {
                    await axios.put(`${API_URL}/transactions/${item.id}/invoice`);
                }

                await axios.post(`${API_URL}/messages`, {
                    memberName: item.memberName,
                    memberPhone: item.phone,
                    memberEmail: item.email,
                    memberId: memberId,
                    message: item.message,
                    channel: 'App',
                    type: item.type,
                    senderName: 'BigBuddy Admin',
                    isRead: false,
                });

                setMessages(prev => prev.map(m => m.id === item.id ? { ...m, status: 'sent', channel: 'App' } : m));
                fetchHistory();
                Alert.alert('✅ Sent!', `Message delivered to ${item.memberName}'s in-app inbox.`);
            } catch (err) {
                Alert.alert('Error', 'Could not send in-app message.');
            } finally {
                setSending(false);
            }
            return;
        }

        // External channels — open native app
        const success = await openLinking(channel, item.phone, item.email, item.message);
        setSending(false);
        if (success) {
            setTimeout(() => {
                Alert.alert(
                    "Confirm Delivery",
                    `Did you successfully send the message via ${channel}?`,
                    [
                        { text: "No", style: "cancel" },
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
                                    console.log("Failed to log message", err);
                                }
                            }
                        }
                    ]
                );
            }, 1000);
        }
    };

    // Show custom channel picker modal (replaces Alert.alert which limits to 3 buttons on Android)
    const showChannelPicker = (item) => {
        setSelectedItem(item);
        setChannelModalVisible(true);
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

            {/* ── Custom Channel Picker Modal ── */}
            <Modal
                visible={channelModalVisible}
                transparent
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setChannelModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setChannelModalVisible(false)}>
                    <View style={styles.modalSheet}>
                        <View style={styles.modalHandle} />
                        <Text style={styles.modalTitle}>Send Reminder</Text>
                        {selectedItem && (
                            <Text style={styles.modalSub}>
                                Choose delivery channel for <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{selectedItem.memberName}</Text>:
                            </Text>
                        )}

                        <View style={styles.channelGrid}>
                            {CHANNELS.map(ch => (
                                <Pressable
                                    key={ch.key}
                                    style={[styles.channelBtn, { borderColor: ch.color }]}
                                    onPress={() => selectedItem && sendMessage(selectedItem, ch.key)}
                                    disabled={sending}
                                >
                                    <View style={[styles.channelIconCircle, { backgroundColor: ch.color + '20' }]}>
                                        <Ionicons name={ch.icon} size={26} color={ch.color} />
                                    </View>
                                    <Text style={[styles.channelLabel, { color: ch.color }]}>{ch.label}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <Pressable style={styles.cancelBtn} onPress={() => setChannelModalVisible(false)}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </Pressable>
                    </View>
                </Pressable>
            </Modal>
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
    emptyText: { color: colors.secondary, textAlign: 'center', padding: 20 },

    // Channel Picker Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        padding: 24, paddingBottom: 40,
    },
    modalHandle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: colors.border, alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20, fontWeight: 'bold', color: colors.text,
        textAlign: 'center', marginBottom: 6,
    },
    modalSub: {
        fontSize: 14, color: colors.secondary,
        textAlign: 'center', marginBottom: 24,
    },
    channelGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'space-between', gap: 12, marginBottom: 20,
    },
    channelBtn: {
        width: '47%', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 18, borderRadius: 16,
        borderWidth: 1.5, backgroundColor: colors.surface, gap: 8,
    },
    channelIconCircle: {
        width: 52, height: 52, borderRadius: 26,
        justifyContent: 'center', alignItems: 'center',
    },
    channelLabel: { fontSize: 13, fontWeight: 'bold' },
    cancelBtn: {
        alignItems: 'center', paddingVertical: 14,
        borderRadius: 14, borderWidth: 1, borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    cancelText: { color: colors.secondary, fontSize: 15, fontWeight: '600' },
});
