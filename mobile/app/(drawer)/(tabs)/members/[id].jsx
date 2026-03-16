import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../../constants/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../../constants/Config';

export default function MemberDetails() {
    const { colors } = useTheme();
    const { id } = useLocalSearchParams();
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);

    const styles = getStyles(colors);

    useEffect(() => {
        if (id) {
            fetchMember();
            fetchTransactions();
        }
    }, [id]);

    const fetchMember = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/members/${id}`);
            setMember(response.data);
        } catch (error) {
            console.log("Fetch member error:", error);
            Alert.alert("Error", "Could not load member profile.");
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await axios.get(`${API_URL}/transactions`);
            const memberTx = response.data.filter(t => t.memberID === id || t.memberName === (member?.name));
            setTransactions(memberTx.slice(0, 5));
        } catch (error) {
            console.log("Fetch transactions error:", error);
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
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "Expired";
        if (diffDays <= 10) return "Expiring Soon";
        return "Active";
    };

    const status = getMemberStatus();
    const statusColor = status === 'Active' ? colors.success : (status === 'Expiring Soon' ? '#FFA726' : colors.error);


    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{member.name.charAt(0)}</Text>
                </View>

                <View style={styles.contactIconsRow}>
                    <Pressable
                        style={styles.iconCircle}
                        onPress={() => Linking.openURL(`tel:${member.phone}`)}
                    >
                        <Ionicons name="call" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                        style={[styles.iconCircle, { backgroundColor: '#25D366', borderColor: '#25D366' }]}
                        onPress={() => Linking.openURL(`whatsapp://send?phone=${member.phone}`)}
                    >
                        <Ionicons name="logo-whatsapp" size={20} color="#FFF" />
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

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Membership Plan</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Plan Name</Text>
                    <Text style={styles.value}>{member.subscriptionType || 'None'}</Text>

                    <Text style={styles.label}>Expiry Date</Text>
                    <Text style={styles.valueNoMargin}>{member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : 'N/A'}</Text>
                </View>
            </View>

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


            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Workout & Diet</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Workout Plan</Text>
                    <Text style={styles.value}>{member.workoutPlan || 'Not Assigned'}</Text>

                    <Text style={styles.label}>Diet Plan</Text>
                    <Text style={styles.valueNoMargin}>{member.dietPlan || 'Balanced Diet'}</Text>
                </View>
            </View>

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

        </ScrollView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    contactIconsRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 25,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: colors.border,
        justifyContent: 'center',
    },
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    balanceIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabelText: {
        color: colors.secondary,
        fontSize: 14,
        fontWeight: '500',
    },
    summaryValueContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryValueText: {
        color: colors.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    avatarText: {
        color: colors.primary,
        fontSize: 32,
        fontWeight: 'bold',
    },
    name: {
        color: colors.primary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    status: {
        fontSize: 16,
        marginTop: 5,
    },
    headerContactInfo: {
        flexDirection: 'row',
        gap: 15,
        backgroundColor: colors.primary + '0D',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 10,
    },
    contactItemInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    contactTextInline: {
        color: colors.text,
        fontSize: 13,
        fontWeight: '500',
    },
    section: {
        marginBottom: 25,
    },
    sectionTitle: {
        color: colors.secondary,
        fontSize: 14,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: colors.surface,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    label: {
        color: colors.secondary,
        fontSize: 12,
        marginBottom: 4,
    },
    value: {
        color: colors.primary,
        fontSize: 16,
        marginBottom: 15,
    },
    valueNoMargin: {
        color: colors.primary,
        fontSize: 16,
    },
    mainUpdateBtn: {
        flexDirection: 'row',
        backgroundColor: colors.primary,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    mainUpdateBtnText: {
        color: colors.buttonPrimaryText,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },
    txRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    txBorder: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    txDate: {
        color: colors.secondary,
        fontSize: 12,
    },
    txPlan: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '500',
        marginTop: 2,
    },
    txAmount: {
        color: colors.success,
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyText: {
        color: colors.secondary,
        textAlign: 'center',
        paddingVertical: 10,
        fontStyle: 'italic',
    }
});
