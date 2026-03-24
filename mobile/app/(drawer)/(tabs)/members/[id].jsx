import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking, ActivityIndicator, Dimensions, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../../constants/ThemeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../../constants/Config';
import { LineChart, BarChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80;

export default function MemberDetails() {
    const { colors } = useTheme();
    const { id } = useLocalSearchParams();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [historyLogs, setHistoryLogs] = useState([]);
    const [chartsLoading, setChartsLoading] = useState(false);

    // In-app message modal
    const [msgModalVisible, setMsgModalVisible] = useState(false);
    const [msgText, setMsgText] = useState('');
    const [msgType, setMsgType] = useState('general');
    const [sendingMsg, setSendingMsg] = useState(false);

    const styles = getStyles(colors);

    useEffect(() => {
        if (id) {
            fetchMember();
            fetchTransactions();
            fetchHistory();
        }
    }, [id]);

    const fetchMember = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/members/${id}`);
            setMember(response.data);
        } catch (error) {
            Alert.alert("Error", "Could not load member profile.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await axios.get(`${API_URL}/transactions`);
            const memberTx = response.data.filter(t => t.memberID === id || t.memberName === member?.name);
            setTransactions(memberTx.slice(0, 5));
        } catch (error) {
            console.log("Fetch transactions error:", error);
        }
    };

    const fetchHistory = async () => {
        setChartsLoading(true);
        try {
            const response = await axios.get(`${API_URL}/daily-logs/history/${id}?limit=30`);
            const sorted = [...response.data].sort((a, b) => new Date(a.date) - new Date(b.date));
            setHistoryLogs(sorted);
        } catch (error) {
            console.log("Fetch history error:", error);
        } finally {
            setChartsLoading(false);
        }
    };

    // ── Quick Message Handlers ──────────────────────────────────────────
    const logMessage = async (channel, message, type = 'general') => {
        try {
            await axios.post(`${API_URL}/messages`, {
                memberName: member.name,
                memberPhone: member.phone,
                memberEmail: member.email,
                memberId: member._id,
                message,
                channel,
                type,
                senderName: 'BigBuddy Admin',
            });
        } catch (e) {
            console.log('Log message error:', e);
        }
    };

    const handleSMS = (customMsg) => {
        const msg = customMsg || `Hi ${member.name}, your BigBuddy membership expires on ${member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : 'N/A'}. Please renew!`;
        Linking.openURL(`sms:${member.phone}?body=${encodeURIComponent(msg)}`);
        logMessage('SMS', msg, 'expired');
    };

    const handleWhatsApp = (customMsg) => {
        const msg = customMsg || `Hi ${member.name}! 👋 Just a reminder from *BigBuddy Gym* - your membership expires on *${member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : 'N/A'}*. Please renew to continue your fitness journey!`;
        Linking.openURL(`whatsapp://send?phone=${member.phone}&text=${encodeURIComponent(msg)}`);
        logMessage('WhatsApp', msg, 'expired');
    };

    const handleMail = (customMsg) => {
        const subject = 'BigBuddy Gym - Membership Renewal';
        const body = customMsg || `Dear ${member.name},\n\nYour BigBuddy Gym membership expires on ${member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : 'N/A'}. Please renew to continue your fitness journey.\n\nRegards,\nBigBuddy Gym Team`;
        Linking.openURL(`mailto:${member.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
        logMessage('Mail', body, 'expired');
    };

    const handleSendInApp = async () => {
        if (!msgText.trim()) {
            Alert.alert('Empty Message', 'Please type a message to send.');
            return;
        }
        setSendingMsg(true);
        try {
            await axios.post(`${API_URL}/messages`, {
                memberName: member.name,
                memberPhone: member.phone,
                memberEmail: member.email,
                memberId: member._id,
                message: msgText.trim(),
                channel: 'App',
                type: msgType,
                senderName: 'BigBuddy Admin',
                isRead: false,
            });
            Alert.alert('Sent!', `Message sent to ${member.name}'s inbox.`);
            setMsgText('');
            setMsgModalVisible(false);
        } catch (e) {
            Alert.alert('Error', 'Could not send message. Please try again.');
        } finally {
            setSendingMsg(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!member) {
        return (
            <View style={styles.container}>
                <Text style={{ color: colors.text, textAlign: 'center', marginTop: 50 }}>Member not found</Text>
            </View>
        );
    }

    const getMemberStatus = () => {
        if (member.status === 'Expired') return "Expired";
        if (!member.expiryDate) return "No Plan";
        const today = new Date();
        const expiry = new Date(member.expiryDate);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return "Expired";
        if (diffDays <= 10) return "Expiring Soon";
        return "Active";
    };

    const status = getMemberStatus();
    const statusColor = status === 'Active' ? colors.success : (status === 'Expiring Soon' ? '#FFA726' : colors.error);

    // ── Chart Data ──────────────────────────────────────────────────────
    const last7 = historyLogs.slice(-7);
    const chartLabels = last7.length > 0
        ? last7.map(l => l.date?.slice(5) || '')
        : ['--', '--', '--', '--', '--', '--', '--'];

    const exercisesData = last7.map(l => l.workoutLogs?.filter(w => w.reps && parseInt(w.reps) > 0).length || 0);
    const dietCompletionData = last7.map(l => {
        const total = l.dietLogs?.length || 0;
        const done = l.dietLogs?.filter(d => d.isCompleted).length || 0;
        return total > 0 ? Math.round((done / total) * 100) : 0;
    });

    const workoutChartData = {
        labels: chartLabels,
        datasets: [{ data: last7.length > 0 ? exercisesData : [0, 0, 0, 0, 0, 0, 0], strokeWidth: 2 }]
    };
    const dietChartData = {
        labels: chartLabels,
        datasets: [{ data: last7.length > 0 ? dietCompletionData : [0, 0, 0, 0, 0, 0, 0] }]
    };

    const workoutChartConfig = {
        backgroundGradientFrom: colors.surface,
        backgroundGradientTo: colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => `${colors.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
        labelColor: () => colors.secondary,
        style: { borderRadius: 16 },
        propsForDots: { r: '4', strokeWidth: '2', stroke: colors.primary }
    };
    const dietChartConfig = {
        ...workoutChartConfig,
        color: (opacity = 1) => `#4CAF50${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    };

    const totalWorkoutDays = historyLogs.filter(l => l.workoutLogs?.some(w => w.reps && parseInt(w.reps) > 0)).length;
    const totalDietDays = historyLogs.filter(l => l.dietLogs?.some(d => d.isCompleted)).length;
    const perfectDietDays = historyLogs.filter(l => {
        const total = l.dietLogs?.length || 0;
        const done = l.dietLogs?.filter(d => d.isCompleted).length || 0;
        return total > 0 && done === total;
    }).length;

    const MSG_TYPES = [
        { key: 'general', label: 'General', color: '#2196F3' },
        { key: 'expired', label: 'Renewal', color: '#F44336' },
        { key: 'absent', label: 'Absent', color: '#FF9800' },
        { key: 'birthday', label: 'Birthday', color: '#E91E63' },
        { key: 'plans', label: 'Plan Update', color: '#9C27B0' },
        { key: 'invoice', label: 'Payment', color: '#00BCD4' },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                </View>
                <View style={styles.contactIconsRow}>
                    <Pressable style={styles.iconCircle} onPress={() => Linking.openURL(`tel:${member.phone}`)}>
                        <Ionicons name="call" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                        style={[styles.iconCircle, { backgroundColor: '#25D366', borderColor: '#25D366' }]}
                        onPress={() => handleWhatsApp()}
                    >
                        <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
                    </Pressable>
                    <Pressable
                        style={[styles.iconCircle, { backgroundColor: '#2196F3', borderColor: '#2196F3' }]}
                        onPress={() => handleMail()}
                    >
                        <Ionicons name="mail" size={20} color="#FFF" />
                    </Pressable>
                </View>
                <Text style={styles.name}>{member.name}</Text>
                <Text style={[styles.status, { color: statusColor, marginBottom: 15 }]}>{status}</Text>
                <View style={styles.headerContactInfo}>
                    <View style={styles.contactItemInline}>
                        <Ionicons name="call-outline" size={14} color={colors.secondary} />
                        <Text style={styles.contactTextInline}>{member.phone}</Text>
                    </View>
                    <View style={styles.contactItemInline}>
                        <Ionicons name="mail-outline" size={14} color={colors.secondary} />
                        <Text style={styles.contactTextInline}>{member.email}</Text>
                    </View>
                </View>
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <Pressable style={styles.summaryCard} onPress={() => router.push('/(drawer)/(tabs)/transactions')}>
                    <View style={styles.summaryHeader}>
                        <View style={styles.balanceIconContainer}>
                            <Ionicons name="cash-outline" size={16} color="#D4AF37" />
                        </View>
                        <Text style={styles.summaryLabelText}>Balance</Text>
                    </View>
                    <View style={styles.summaryValueContainer}>
                        <Text style={styles.summaryValueText}>₹{member.balance || 0}</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.secondary} />
                    </View>
                </Pressable>
                <View style={styles.summaryCard}>
                    <Text style={[styles.summaryLabelText, { marginTop: 0 }]}>Joined</Text>
                    <Text style={[styles.summaryValueText, { marginTop: 8 }]}>
                        {new Date(member.joinDate).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            {/* Membership Plan */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Membership Plan</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Plan Name</Text>
                    <Text style={styles.value}>{member.subscriptionType || 'None'}</Text>
                    <Text style={styles.label}>Expiry Date</Text>
                    <Text style={[styles.valueNoMargin, { color: statusColor }]}>
                        {member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : 'N/A'}
                    </Text>
                </View>
            </View>

            {/* Recent Payments */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Payments</Text>
                <View style={styles.card}>
                    {transactions.length > 0 ? (
                        transactions.map((tx, idx) => (
                            <View key={tx._id || `tx-${idx}`} style={[styles.txRow, idx !== transactions.length - 1 && styles.txBorder]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString()}</Text>
                                    <Text style={styles.txPlan}>{tx.planType || 'Regular Payment'}</Text>
                                </View>
                                <Text style={styles.txAmount}>₹{tx.amount}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No transactions recorded</Text>
                    )}
                </View>
            </View>

            {/* Workout & Diet */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Workout & Diet</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Workout Plan</Text>
                    <Text style={styles.value}>{member.workoutPlan || 'Not Assigned'}</Text>
                    <Text style={styles.label}>Diet Plan</Text>
                    <Text style={styles.valueNoMargin}>{member.dietPlan || 'Balanced Diet'}</Text>
                </View>
            </View>

            {/* Progress Analytics */}
            <Text style={styles.progressSectionTitle}>MEMBER PROGRESS ANALYTICS</Text>
            <View style={styles.progressStatsRow}>
                <View style={styles.progressStatItem}>
                    <Ionicons name="barbell" size={20} color={colors.primary} />
                    <Text style={styles.progressStatVal}>{totalWorkoutDays}</Text>
                    <Text style={styles.progressStatLabel}>Workout Days</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressStatItem}>
                    <Ionicons name="restaurant" size={20} color="#4CAF50" />
                    <Text style={styles.progressStatVal}>{totalDietDays}</Text>
                    <Text style={styles.progressStatLabel}>Diet Days</Text>
                </View>
                <View style={styles.progressStatDivider} />
                <View style={styles.progressStatItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#FF9800" />
                    <Text style={styles.progressStatVal}>{perfectDietDays}</Text>
                    <Text style={styles.progressStatLabel}>Perfect Diets</Text>
                </View>
            </View>

            {chartsLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : (
                <>
                    <View style={styles.chartCard}>
                        <Text style={styles.chartCardTitle}>Workout Progress (Last 7 Days)</Text>
                        <Text style={styles.chartSubtitle}>Exercises completed per session</Text>
                        <LineChart
                            data={workoutChartData}
                            width={CHART_WIDTH}
                            height={155}
                            chartConfig={workoutChartConfig}
                            bezier
                            style={styles.chart}
                            withInnerLines={false}
                            withOuterLines={false}
                        />
                        {historyLogs.length === 0 && <Text style={styles.noDataText}>No workout data recorded yet</Text>}
                    </View>

                    <View style={styles.chartCard}>
                        <Text style={styles.chartCardTitle}>Diet Adherence (Last 7 Days)</Text>
                        <Text style={styles.chartSubtitle}>Meal completion percentage per day</Text>
                        <BarChart
                            data={dietChartData}
                            width={CHART_WIDTH}
                            height={155}
                            chartConfig={dietChartConfig}
                            style={styles.chart}
                            withInnerLines={false}
                            showValuesOnTopOfBars
                            yAxisSuffix="%"
                        />
                        {historyLogs.length === 0 && <Text style={styles.noDataText}>No diet data recorded yet</Text>}
                    </View>

                    {historyLogs.length > 0 && (
                        <View style={styles.activityCard}>
                            <Text style={styles.chartCardTitle}>Recent Activity</Text>
                            {historyLogs.slice(-5).reverse().map((log, i) => {
                                const workoutDone = log.workoutLogs?.filter(w => w.reps && parseInt(w.reps) > 0).length || 0;
                                const mealDone = log.dietLogs?.filter(d => d.isCompleted).length || 0;
                                const mealTotal = log.dietLogs?.length || 0;
                                return (
                                    <View key={i} style={[styles.activityRow, i < 4 && styles.activityBorder]}>
                                        <Text style={styles.activityDate}>{log.date}</Text>
                                        <View style={styles.activityBadges}>
                                            {workoutDone > 0 && (
                                                <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
                                                    <Ionicons name="barbell" size={11} color={colors.primary} />
                                                    <Text style={[styles.badgeText, { color: colors.primary }]}>{workoutDone} ex</Text>
                                                </View>
                                            )}
                                            {mealTotal > 0 && (
                                                <View style={[styles.badge, { backgroundColor: '#4CAF5020' }]}>
                                                    <Ionicons name="restaurant" size={11} color="#4CAF50" />
                                                    <Text style={[styles.badgeText, { color: '#4CAF50' }]}>{mealDone}/{mealTotal}</Text>
                                                </View>
                                            )}
                                            {workoutDone === 0 && mealTotal === 0 && (
                                                <Text style={{ color: colors.secondary, fontSize: 12 }}>No activity</Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </>
            )}

            {/* Update Buttons */}
            <View style={{ gap: 12, marginTop: 10, marginBottom: 30 }}>
                <Pressable
                    style={[styles.mainUpdateBtn, { backgroundColor: '#FFD700' }]}
                    onPress={() => router.push({
                        pathname: '/(drawer)/(tabs)/members/add',
                        params: { mode: 'update', id: member._id, type: member.role || 'member', action: 'renew' }
                    })}
                >
                    <Ionicons name="refresh-circle-outline" size={24} color="#000" style={{ marginRight: 8 }} />
                    <Text style={[styles.mainUpdateBtnText, { color: '#000' }]}>RENEW MEMBERSHIP</Text>
                </Pressable>
                <Pressable
                    style={styles.mainUpdateBtn}
                    onPress={() => router.push({
                        pathname: '/(drawer)/(tabs)/members/add',
                        params: { mode: 'update', id: member._id, type: member.role || 'member' }
                    })}
                >
                    <Ionicons name="create-outline" size={20} color={colors.buttonPrimaryText} style={{ marginRight: 8 }} />
                    <Text style={styles.mainUpdateBtnText}>UPDATE PROFILE</Text>
                </Pressable>
            </View>

            {/* In-App Message Modal */}
            <Modal visible={msgModalVisible} transparent animationType="slide" statusBarTranslucent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalTop}>
                            <View>
                                <Text style={styles.modalTitle}>Send to Inbox</Text>
                                <Text style={styles.modalSub}>To: {member.name}</Text>
                            </View>
                            <Pressable onPress={() => setMsgModalVisible(false)}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </Pressable>
                        </View>

                        {/* Message Type Selector */}
                        <Text style={styles.msgTypeLabel}>Message Type</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {MSG_TYPES.map(t => (
                                    <Pressable
                                        key={t.key}
                                        style={[styles.typeChip, msgType === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                                        onPress={() => setMsgType(t.key)}
                                    >
                                        <Text style={[styles.typeChipText, msgType === t.key && { color: '#FFF', fontWeight: 'bold' }]}>{t.label}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </ScrollView>

                        {/* Message Input */}
                        <TextInput
                            style={styles.msgInput}
                            value={msgText}
                            onChangeText={setMsgText}
                            multiline
                            numberOfLines={5}
                            placeholder={`Type your message to ${member.name}...`}
                            placeholderTextColor={colors.secondary}
                            textAlignVertical="top"
                        />

                        {/* Quick Templates */}
                        <Text style={styles.msgTypeLabel}>Quick Templates</Text>
                        {[
                            `Hi ${member.name}, your membership is expiring soon. Please renew to keep your access!`,
                            `Hi ${member.name}, we noticed you've been absent. Come back and keep up your fitness routine!`,
                            `Happy Birthday ${member.name}! Wishing you great health and fitness!`,
                        ].map((tmpl, i) => (
                            <Pressable key={i} style={styles.templateRow} onPress={() => setMsgText(tmpl)}>
                                <Ionicons name="copy-outline" size={14} color={colors.secondary} />
                                <Text style={styles.templateText} numberOfLines={1}>{tmpl}</Text>
                            </Pressable>
                        ))}

                        <Pressable
                            style={[styles.sendBtn, sendingMsg && { opacity: 0.7 }]}
                            onPress={handleSendInApp}
                            disabled={sendingMsg}
                        >
                            {sendingMsg
                                ? <ActivityIndicator color="#FFF" />
                                : <>
                                    <Ionicons name="paper-plane" size={18} color="#FFF" />
                                    <Text style={styles.sendBtnText}>SEND TO INBOX</Text>
                                </>
                            }
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 20, marginTop: 10 },
    contactIconsRow: { flexDirection: 'row', gap: 14, marginBottom: 15 },
    summaryRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
    summaryCard: {
        flex: 1, backgroundColor: colors.surface, borderRadius: 16,
        padding: 15, borderWidth: 1, borderColor: colors.border, justifyContent: 'center',
    },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    balanceIconContainer: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: 'rgba(212, 175, 55, 0.1)', justifyContent: 'center', alignItems: 'center',
    },
    summaryLabelText: { color: colors.secondary, fontSize: 14, fontWeight: '500' },
    summaryValueContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryValueText: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
    iconCircle: {
        width: 46, height: 46, borderRadius: 23,
        backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: colors.border, elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    avatar: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
        marginBottom: 15, borderWidth: 2, borderColor: colors.primary,
    },
    avatarText: { color: colors.primary, fontSize: 32, fontWeight: 'bold' },
    name: { color: colors.primary, fontSize: 24, fontWeight: 'bold' },
    status: { fontSize: 16, marginTop: 5 },
    headerContactInfo: {
        flexDirection: 'row', gap: 15,
        backgroundColor: colors.primary + '0D', paddingHorizontal: 15, paddingVertical: 10,
        borderRadius: 20, marginBottom: 10,
    },
    contactItemInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    contactTextInline: { color: colors.text, fontSize: 13, fontWeight: '500' },

    // Quick msg row
    quickMsgRow: {
        flexDirection: 'row', gap: 8, marginBottom: 20,
    },
    quickMsgBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 10, borderRadius: 12,
        borderWidth: 1.5, backgroundColor: colors.surface,
    },
    quickMsgText: { fontSize: 11, fontWeight: '600' },

    section: { marginBottom: 25 },
    sectionTitle: {
        color: colors.secondary, fontSize: 14, marginBottom: 10,
        textTransform: 'uppercase', letterSpacing: 1,
    },
    card: { backgroundColor: colors.surface, padding: 15, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    label: { color: colors.secondary, fontSize: 12, marginBottom: 4 },
    value: { color: colors.primary, fontSize: 16, marginBottom: 15 },
    valueNoMargin: { color: colors.primary, fontSize: 16 },
    mainUpdateBtn: {
        flexDirection: 'row', backgroundColor: colors.primary,
        paddingVertical: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    mainUpdateBtnText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
    txRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
    txBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    txDate: { color: colors.secondary, fontSize: 12 },
    txPlan: { color: colors.text, fontSize: 14, fontWeight: '500', marginTop: 2 },
    txAmount: { color: colors.success, fontSize: 16, fontWeight: 'bold' },
    emptyText: { color: colors.secondary, textAlign: 'center', paddingVertical: 10, fontStyle: 'italic' },

    progressSectionTitle: {
        fontSize: 13, fontWeight: 'bold', color: colors.secondary,
        textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, marginTop: 5,
    },
    progressStatsRow: {
        flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16,
        padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center',
    },
    progressStatItem: { flex: 1, alignItems: 'center', gap: 4 },
    progressStatDivider: { width: 1, height: 40, backgroundColor: colors.border },
    progressStatVal: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    progressStatLabel: { fontSize: 10, color: colors.secondary, textAlign: 'center', textTransform: 'uppercase' },

    chartCard: {
        backgroundColor: colors.surface, borderRadius: 18, padding: 15, marginBottom: 16,
        borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
    },
    chartCardTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    chartSubtitle: { fontSize: 11, color: colors.secondary, marginBottom: 12 },
    chart: { borderRadius: 12, marginLeft: -10 },
    noDataText: { color: colors.secondary, textAlign: 'center', paddingVertical: 10, fontStyle: 'italic' },

    activityCard: {
        backgroundColor: colors.surface, borderRadius: 16, padding: 15, marginBottom: 20,
        borderWidth: 1, borderColor: colors.border,
    },
    activityRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 10,
    },
    activityBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
    activityDate: { fontSize: 13, color: colors.text, fontWeight: '600' },
    activityBadges: { flexDirection: 'row', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
    badgeText: { fontSize: 11, fontWeight: 'bold' },

    // In-App Message Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25,
        padding: 24, paddingBottom: 40, maxHeight: '90%',
    },
    modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    modalSub: { fontSize: 13, color: colors.secondary, marginTop: 2 },
    msgTypeLabel: { fontSize: 12, fontWeight: 'bold', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    typeChip: {
        paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
        borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
    },
    typeChipText: { fontSize: 12, color: colors.text },
    msgInput: {
        backgroundColor: colors.surface, borderRadius: 14, padding: 14,
        color: colors.text, borderWidth: 1, borderColor: colors.border,
        fontSize: 15, minHeight: 100, marginBottom: 16,
    },
    templateRow: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    templateText: { flex: 1, color: colors.secondary, fontSize: 12 },
    sendBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FF5722', padding: 16, borderRadius: 14,
        marginTop: 16, gap: 10,
    },
    sendBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
