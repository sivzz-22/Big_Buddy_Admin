import { View, Text, StyleSheet, Pressable, ScrollView, Switch, Image, Alert, Modal, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import React, { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../../constants/ThemeContext';
import axios from 'axios';
import { API_URL } from '../../../constants/Config';

export default function Profile() {
    const { colors } = useTheme();

    // Gym Info State
    const [gymInfo, setGymInfo] = useState({
        name: 'Iron Forge Gym',
        address: '123 Muscle Street, Fitness City',
        location: 'Downtown Area',
        gmail: 'info@ironforge.com',
        contact: '+1 234 567 8900',
        image: null,
        softwareUsageFee: 499,
        subscriptionPlan: "Business Pro Annual",
        nextPaymentDate: null,
        status: "Active"
    });

    const [stats, setStats] = useState({
        totalMembers: 0,
        totalTrainers: 0,
        totalRevenueAllTime: 0
    });

    const [loading, setLoading] = useState(true);
    const [isEditModalVisible, setEditModalVisible] = useState(false);
    const [isSubModalVisible, setSubModalVisible] = useState(false);
    const [isHelpModalVisible, setHelpModalVisible] = useState(false);
    const [tempGymInfo, setTempGymInfo] = useState({ ...gymInfo });

    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 15 }}>
                    <Pressable style={{ marginRight: 15 }} onPress={() => router.push('/')}>
                        <Ionicons name="home-outline" size={24} color={colors.primary} />
                    </Pressable>
                    <Pressable style={{ marginRight: 15 }} onPress={() => router.push('/notifications')}>
                        <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => router.push('/chats')}>
                        <Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, colors]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [gymRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/gym`),
                axios.get(`${API_URL}/dashboard/stats`)
            ]);
            setGymInfo(gymRes.data);
            setStats({
                totalMembers: statsRes.data.totalMembers,
                totalTrainers: statsRes.data.totalTrainers,
                totalRevenueAllTime: statsRes.data.totalRevenueAllTime
            });
            setTempGymInfo(gymRes.data);
        } catch (error) {
            console.log("Profile fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    const styles = getStyles(colors);

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: () => router.replace('/login') }
            ]
        );
    };

    const handleSwitchAccount = () => {
        Alert.alert(
            "Switch Account",
            "Are you sure you want to switch accounts?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Switch", onPress: () => router.replace('/login') }
            ]
        );
    };

    const handlePickImage = async () => {
        // Warning for some Android devices where the Save/Tick button is hard to find in the system editor
        Alert.alert(
            "Select Logo",
            "Pick an image. If the editor opens, tap the 'Crop' or Checkmark (✔) at the top/bottom corner to confirm.",
            [
                {
                    text: "Continue",
                    onPress: async () => {
                        let result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.5,
                            base64: true,
                        });

                        if (!result.canceled) {
                            const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                            setTempGymInfo({ ...tempGymInfo, image: base64Image });
                        }
                    }
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleUploadQR = async () => {
        // QR Code doesn't usually need cropping, so we disable it to avoid confusion
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: false,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            try {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                const res = await axios.put(`${API_URL}/gym`, { qrCode: base64Image });
                setGymInfo(res.data);
                Alert.alert("Success", "Bank QR Code updated successfully!");
            } catch (error) {
                Alert.alert("Error", "Could not upload QR code.");
            }
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true); // Reuse loading state for save feedback
        try {
            const res = await axios.put(`${API_URL}/gym`, tempGymInfo);
            setGymInfo(res.data);
            setEditModalVisible(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            console.error("Save profile error:", error);
            Alert.alert("Error", "Could not update profile.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header / Gym Info */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <Pressable style={styles.avatar} onPress={() => {
                        setTempGymInfo({ ...gymInfo });
                        setEditModalVisible(true);
                    }}>
                        {gymInfo.image ? (
                            <Image source={{ uri: gymInfo.image }} style={styles.avatarImage} />
                        ) : (
                            <Text style={styles.avatarText}>{gymInfo.name.charAt(0)}</Text>
                        )}
                    </Pressable>
                    <Pressable style={styles.editBadge} onPress={() => {
                        setTempGymInfo({ ...gymInfo });
                        setEditModalVisible(true);
                    }}>
                        <Ionicons name="pencil" size={14} color="#FFF" />
                    </Pressable>
                </View>
                <Text style={styles.name}>{gymInfo.name}</Text>
                <Text style={styles.role}>Owner / Admin</Text>

                <View style={styles.infoChips}>
                    <View style={styles.infoChip}>
                        <Ionicons name="mail-outline" size={14} color={colors.secondary} />
                        <Text style={styles.infoChipText}>{gymInfo.gmail}</Text>
                    </View>
                    <View style={styles.infoChip}>
                        <Ionicons name="call-outline" size={14} color={colors.secondary} />
                        <Text style={styles.infoChipText}>{gymInfo.contact}</Text>
                    </View>
                </View>

                <View style={styles.addressBox}>
                    <Ionicons name="location-outline" size={16} color={colors.primary} />
                    <Text style={styles.addressText}>{gymInfo.address || 'Address not set'}, {gymInfo.location || ''}</Text>
                </View>
            </View>

            {/* Quick Actions Grid */}
            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalMembers}</Text>
                    <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.totalTrainers}</Text>
                    <Text style={styles.statLabel}>Trainers</Text>
                </View>
                <View style={styles.verticalLine} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>₹{(stats.totalRevenueAllTime / 1000).toFixed(1)}k</Text>
                    <Text style={styles.statLabel}>Revenue</Text>
                </View>
            </View>

            {/* Account Settings */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account & Gym Settings</Text>

                <Pressable style={styles.row} onPress={() => setEditModalVisible(true)}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: '#E3F2FD1A' }]}>
                            <Ionicons name="business-outline" size={20} color="#1E88E5" />
                        </View>
                        <Text style={styles.rowText}>Edit Gym Details</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                </Pressable>

                <Pressable style={styles.row} onPress={handleUploadQR}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: '#E0F2F11A' }]}>
                            <Ionicons name="qr-code-outline" size={20} color="#00897B" />
                        </View>
                        <Text style={styles.rowText}>Bank QR Code</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: colors.secondary, fontSize: 12, marginRight: 5 }}>Manage</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                    </View>
                </Pressable>

                <Pressable style={styles.row} onPress={() => {
                    Alert.alert(
                        "Attendance Access Code",
                        `Current Code: ${gymInfo.attendanceCode}\n\nMembers can use this code to mark attendance manually.`,
                        [
                            { text: "Close", style: "cancel" },
                            {
                                text: "Regenerate",
                                onPress: async () => {
                                    try {
                                        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
                                        const res = await axios.put(`${API_URL}/gym`, { attendanceCode: newCode });
                                        setGymInfo(res.data);
                                        Alert.alert("Success", "New attendance code generated!");
                                    } catch (err) {
                                        Alert.alert("Error", "Could not regenerate code.");
                                    }
                                }
                            }
                        ]
                    );
                }}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: '#FCE4EC1A' }]}>
                            <Ionicons name="key-outline" size={20} color="#D81B60" />
                        </View>
                        <Text style={styles.rowText}>Attendance Access Code</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: colors.primary, fontWeight: 'bold', marginRight: 5 }}>{gymInfo.attendanceCode}</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                    </View>
                </Pressable>

                <Pressable style={styles.row} onPress={() => setSubModalVisible(true)}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF3E01A' }]}>
                            <Ionicons name="shield-checkmark-outline" size={20} color="#FB8C00" />
                        </View>
                        <Text style={styles.rowText}>Subscription & Billing</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                </Pressable>

                <Pressable style={styles.row} onPress={() => router.push('/members')}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: '#F3E5F51A' }]}>
                            <Ionicons name="people-outline" size={20} color="#8E24AA" />
                        </View>
                        <Text style={styles.rowText}>Manage Staff / Trainers</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                </Pressable>

                <Pressable style={styles.row} onPress={handleSwitchAccount}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: '#E8F5E91A' }]}>
                            <Ionicons name="swap-horizontal-outline" size={20} color="#43A047" />
                        </View>
                        <Text style={styles.rowText}>Switch Account</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                </Pressable>
            </View>

            {/* Support Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <Pressable style={styles.row} onPress={() => setHelpModalVisible(true)}>
                    <View style={styles.rowLeft}>
                        <View style={[styles.iconBox, { backgroundColor: colors.error + '1A' }]}>
                            <Ionicons name="help-circle-outline" size={20} color={colors.error} />
                        </View>
                        <Text style={styles.rowText}>Help & Feedback</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.secondary} />
                </Pressable>
            </View>

            {/* Logout */}
            <Pressable style={styles.logoutBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={colors.error} />
                <Text style={styles.logoutText}>Log Out</Text>
            </Pressable>

            <Text style={styles.version}>BigBuddy Business v1.0.0</Text>

            {/* Edit Profile Modal */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Pressable onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </Pressable>
                            <Text style={styles.modalTitle}>Edit Gym Profile</Text>
                            <Pressable onPress={handleSaveProfile}>
                                <Ionicons name="checkmark" size={26} color={colors.primary} />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            {/* Image Section */}
                            <View style={styles.imageEditSection}>
                                <Pressable style={styles.imageWrapper} onPress={handlePickImage}>
                                    {tempGymInfo.image ? (
                                        <Image source={{ uri: tempGymInfo.image }} style={styles.editAvatarImage} />
                                    ) : (
                                        <Ionicons name="camera" size={30} color={colors.secondary} />
                                    )}
                                    <View style={styles.cameraIconBg}>
                                        <Ionicons name="camera" size={16} color="#FFF" />
                                    </View>
                                </Pressable>
                                <Text style={styles.imageEditLabel}>Update Gym Logo / Photo</Text>
                            </View>

                            <Text style={styles.inputLabel}>Gym Name</Text>
                            <TextInput
                                style={styles.input}
                                value={tempGymInfo.name}
                                onChangeText={(text) => setTempGymInfo({ ...tempGymInfo, name: text })}
                                placeholder="Enter Gym Name"
                                placeholderTextColor={colors.secondary}
                            />

                            <Text style={styles.inputLabel}>Full Address</Text>
                            <TextInput
                                style={[styles.input, { height: 80 }]}
                                value={tempGymInfo.address}
                                onChangeText={(text) => setTempGymInfo({ ...tempGymInfo, address: text })}
                                placeholder="Street, City, State"
                                multiline
                                placeholderTextColor={colors.secondary}
                            />

                            <Text style={styles.inputLabel}>Location / Area</Text>
                            <TextInput
                                style={styles.input}
                                value={tempGymInfo.location}
                                onChangeText={(text) => setTempGymInfo({ ...tempGymInfo, location: text })}
                                placeholder="Business District, Area Name"
                                placeholderTextColor={colors.secondary}
                            />

                            <Text style={styles.inputLabel}>Gmail / Business Email</Text>
                            <TextInput
                                style={styles.input}
                                value={tempGymInfo.gmail}
                                onChangeText={(text) => setTempGymInfo({ ...tempGymInfo, gmail: text })}
                                placeholder="example@gmail.com"
                                keyboardType="email-address"
                                placeholderTextColor={colors.secondary}
                            />

                            <Text style={styles.inputLabel}>Contact Number</Text>
                            <TextInput
                                style={styles.input}
                                value={tempGymInfo.contact}
                                onChangeText={(text) => setTempGymInfo({ ...tempGymInfo, contact: text })}
                                placeholder="+1 234 567 890"
                                keyboardType="phone-pad"
                                placeholderTextColor={colors.secondary}
                            />
                        </ScrollView>

                        <Pressable style={styles.saveBtn} onPress={handleSaveProfile}>
                            <Text style={styles.saveBtnText}>SAVE UPDATES</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Subscription Modal */}
            <Modal
                visible={isSubModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Subscription & Billing</Text>
                            <Pressable onPress={() => setSubModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </Pressable>
                        </View>

                        <View style={styles.billingCard}>
                            <View style={styles.billingInfo}>
                                <Text style={styles.billingLabel}>Current Plan</Text>
                                <Text style={styles.billingValue}>{gymInfo.subscriptionPlan}</Text>
                            </View>
                            <View style={styles.priceBadge}>
                                <Text style={styles.priceText}>₹9,999/yr</Text>
                            </View>
                        </View>

                        <View style={styles.paymentDetails}>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Next Payment Date</Text>
                                <Text style={styles.paymentValue}>
                                    {gymInfo.nextPaymentDate ? new Date(gymInfo.nextPaymentDate).toLocaleDateString() : 'Loading...'}
                                </Text>
                            </View>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Payment Status</Text>
                                <View style={styles.statusChip}>
                                    <Text style={styles.statusChipText}>{gymInfo.status}</Text>
                                </View>
                            </View>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Software Usage Fee</Text>
                                <Text style={[styles.paymentValue, { color: colors.primary }]}>₹{gymInfo.softwareUsageFee} / Month</Text>
                            </View>
                        </View>

                        <Pressable style={styles.saveBtn} onPress={() => setSubModalVisible(false)}>
                            <Text style={styles.saveBtnText}>MANAGE BILLING</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Help & Feedback Modal */}
            <Modal
                visible={isHelpModalVisible}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Help & Support</Text>
                            <Pressable onPress={() => setHelpModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </Pressable>
                        </View>

                        <Text style={styles.helpText}>
                            Get in touch with the app developer for technical support or feedback regarding the software.
                        </Text>

                        <View style={styles.contactSection}>
                            <Pressable style={styles.contactCard} onPress={() => { }}>
                                <View style={[styles.iconBox, { backgroundColor: colors.info + '1A' }]}>
                                    <Ionicons name="call" size={20} color="#4A90E2" />
                                </View>
                                <View>
                                    <Text style={styles.contactLabel}>Call Developer</Text>
                                    <Text style={styles.contactValue}>+91 98765 43210</Text>
                                </View>
                            </Pressable>

                            <Pressable style={styles.contactCard} onPress={() => { }}>
                                <View style={[styles.iconBox, { backgroundColor: colors.success + '1A' }]}>
                                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                                </View>
                                <View>
                                    <Text style={styles.contactLabel}>WhatsApp Support</Text>
                                    <Text style={styles.contactValue}>Chat with us</Text>
                                </View>
                            </Pressable>

                            <Pressable style={styles.contactCard} onPress={() => { }}>
                                <View style={[styles.iconBox, { backgroundColor: colors.error + '1A' }]}>
                                    <Ionicons name="mail" size={20} color="#EF5350" />
                                </View>
                                <View>
                                    <Text style={styles.contactLabel}>Email Support</Text>
                                    <Text style={styles.contactValue}>support@bigbuddy.com</Text>
                                </View>
                            </Pressable>
                        </View>

                        <View style={styles.appInfoSection}>
                            <Text style={styles.appInfoText}>BigBuddy v1.0.0 (Production)</Text>
                            <Text style={styles.appInfoSubtext}>Developed by Creative Tech Labs</Text>
                        </View>

                        <Pressable style={styles.saveBtn} onPress={() => setHelpModalVisible(false)}>
                            <Text style={styles.saveBtnText}>CLOSE</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: colors.primary,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: 12,
    },
    infoChips: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15,
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 5,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoChipText: {
        color: colors.secondary,
        fontSize: 12,
    },
    addressBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 30,
    },
    addressText: {
        color: colors.text,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Stats
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingVertical: 20,
        marginTop: 15,
        borderWidth: 1,
        borderColor: colors.border,
        marginHorizontal: 15,
        borderRadius: 12,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: colors.secondary,
        marginTop: 4,
    },
    verticalLine: {
        width: 1,
        height: 40,
        backgroundColor: colors.border,
    },

    // Sections
    section: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.secondary,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 5,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    rowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    rowText: {
        fontSize: 16,
        color: colors.text,
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 10,
        backgroundColor: colors.error + '1A',
        marginHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.error,
    },
    logoutText: {
        color: colors.error,
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 10,
    },
    version: {
        textAlign: 'center',
        color: colors.secondary,
        fontSize: 12,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    modalForm: {
        marginBottom: 20,
    },
    inputLabel: {
        color: colors.secondary,
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 15,
        textTransform: 'uppercase',
        paddingHorizontal: 2,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 15,
        color: colors.text,
        fontSize: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    saveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    saveBtnText: {
        color: colors.buttonPrimaryText,
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 1,
    },

    // New Styles for Image Edit
    imageEditSection: {
        alignItems: 'center',
        marginBottom: 25,
        marginTop: 10,
    },
    imageWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed',
        overflow: 'hidden',
        position: 'relative',
    },
    editAvatarImage: {
        width: '100%',
        height: '100%',
    },
    cameraIconBg: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageEditLabel: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 12,
    },

    // Billing Modal Styles
    billingCard: {
        backgroundColor: colors.surface,
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 20,
    },
    billingLabel: {
        color: colors.secondary,
        fontSize: 12,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    billingValue: {
        color: colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    priceBadge: {
        backgroundColor: colors.primary + '1A',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    priceText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    paymentDetails: {
        gap: 15,
        marginBottom: 30,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    paymentLabel: {
        color: colors.secondary,
        fontSize: 14,
    },
    paymentValue: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
    statusChip: {
        backgroundColor: colors.success + '1A',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusChipText: {
        color: colors.success,
        fontSize: 12,
        fontWeight: 'bold',
    },

    // Help Modal Styles
    helpText: {
        color: colors.secondary,
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 25,
        paddingHorizontal: 5,
    },
    contactSection: {
        gap: 15,
        marginBottom: 30,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    contactLabel: {
        color: colors.secondary,
        fontSize: 12,
        marginBottom: 2,
    },
    contactValue: {
        color: colors.text,
        fontSize: 15,
        fontWeight: 'bold',
    },
    appInfoSection: {
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    appInfoText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    appInfoSubtext: {
        color: colors.secondary,
        fontSize: 12,
        marginTop: 4,
    }
});
