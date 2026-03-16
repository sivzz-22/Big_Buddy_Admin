import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';

export default function MembershipPlans() {
    const { colors } = useTheme();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({ name: '', price: '', duration: '', description: '' });

    const styles = getStyles(colors);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/membership-plans`);
            setPlans(response.data);
        } catch (error) {
            console.log("Fetch plans error:", error);
            Alert.alert("Error", "Could not fetch membership plans.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan = null, edit = false) => {
        setIsEditMode(edit);
        if (plan) {
            setEditingPlan(plan);
            setPlanForm({
                name: plan.name,
                price: String(plan.price),
                duration: plan.duration,
                description: plan.description
            });
        } else {
            setEditingPlan(null);
            setPlanForm({ name: '', price: '', duration: '', description: '' });
            setIsEditMode(true);
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!planForm.name || !planForm.price || !planForm.duration) {
            Alert.alert("Error", "Please fill required fields (Name, Price, Duration).");
            return;
        }

        try {
            if (editingPlan) {
                const response = await axios.put(`${API_URL}/membership-plans/${editingPlan._id || editingPlan.id}`, planForm);
                setPlans(plans.map(p => (p._id === editingPlan._id || p.id === editingPlan.id) ? response.data : p));
                Alert.alert("Success", "Plan updated successfully!");
            } else {
                const response = await axios.post(`${API_URL}/membership-plans`, planForm);
                setPlans([response.data, ...plans]);
                Alert.alert("Success", "New plan created!");
            }
            setModalVisible(false);
        } catch (error) {
            console.log("Save plan error:", error);
            Alert.alert("Error", "Could not save plan.");
        }
    };

    const handleDelete = (id) => {
        Alert.alert("Delete", "Delete this plan permanently?", [
            { text: "Cancel" },
            {
                text: "Delete",
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${API_URL}/membership-plans/${id}`);
                        setPlans(plans.filter(p => (p._id || p.id) !== id));
                    } catch (error) {
                        console.log("Delete error:", error);
                        Alert.alert("Error", "Could not delete plan.");
                    }
                }
            }
        ]);
    };


    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Membership Plans',
                headerShown: true,
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.primary
            }} />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={plans}
                    keyExtractor={item => item._id || item.id}
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.planIcon}><Ionicons name="card" size={24} color={colors.primary} /></View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.planName}>{item.name}</Text>
                                    <Text style={styles.planDuration}>{item.duration}</Text>
                                </View>
                                <Text style={styles.planPrice}>₹{item.price}</Text>
                            </View>
                            <Text style={styles.planDesc}>{item.description}</Text>
                            <View style={styles.actions}>
                                <Pressable style={styles.assignBtn} onPress={() => router.push('/members')}>
                                    <Text style={styles.assignBtnText}>Assign</Text>
                                </Pressable>
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <Pressable onPress={() => handleOpenModal(item, false)} style={styles.iconBtn}>
                                        <Ionicons name="eye-outline" size={18} color={colors.secondary} />
                                    </Pressable>
                                    <Pressable onPress={() => handleOpenModal(item, true)} style={styles.iconBtn}>
                                        <Ionicons name="pencil" size={18} color={colors.primary} />
                                    </Pressable>
                                    <Pressable onPress={() => handleDelete(item._id || item.id)} style={styles.iconBtn}>
                                        <Ionicons name="trash" size={18} color={colors.error} />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    )}
                />
            )}


            <Pressable style={styles.fab} onPress={() => handleOpenModal()}>
                <Ionicons name="add" size={30} color={colors.buttonPrimaryText} />
            </Pressable>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalTop}>
                            <Text style={styles.modalTitle}>{!isEditMode ? 'Plan Details' : editingPlan ? 'Edit Plan' : 'New Plan'}</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </Pressable>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Plan Name</Text>
                            {isEditMode ? (
                                <TextInput style={styles.input} value={planForm.name} onChangeText={t => setPlanForm({ ...planForm, name: t })} />
                            ) : (
                                <Text style={styles.viewText}>{planForm.name}</Text>
                            )}

                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Price (₹)</Text>
                                    {isEditMode ? (
                                        <TextInput style={styles.input} value={String(planForm.price)} keyboardType="numeric" onChangeText={t => setPlanForm({ ...planForm, price: t })} />
                                    ) : (
                                        <Text style={styles.viewText}>₹{planForm.price}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Duration</Text>
                                    {isEditMode ? (
                                        <TextInput style={styles.input} value={planForm.duration} onChangeText={t => setPlanForm({ ...planForm, duration: t })} />
                                    ) : (
                                        <Text style={styles.viewText}>{planForm.duration}</Text>
                                    )}
                                </View>
                            </View>

                            <Text style={styles.label}>Description</Text>
                            {isEditMode ? (
                                <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} multiline value={planForm.description} onChangeText={t => setPlanForm({ ...planForm, description: t })} />
                            ) : (
                                <View style={styles.descBox}>
                                    <Text style={styles.viewText}>{planForm.description}</Text>
                                </View>
                            )}

                            {isEditMode ? (
                                <Pressable style={styles.submitBtn} onPress={handleSave}>
                                    <Text style={styles.submitBtnText}>SAVE PLAN</Text>
                                </Pressable>
                            ) : (
                                <Pressable style={styles.submitBtn} onPress={() => setIsEditMode(true)}>
                                    <Text style={styles.submitBtnText}>EDIT PLAN</Text>
                                </Pressable>
                            )}
                            <View style={{ height: 20 }} />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    planIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    planName: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    planDuration: { fontSize: 13, color: colors.secondary },
    planPrice: { fontSize: 18, fontWeight: 'bold', color: colors.primary },
    planDesc: { fontSize: 14, color: colors.secondary, marginBottom: 15 },
    actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 },
    assignBtn: { backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 8 },
    assignBtnText: { color: colors.buttonPrimaryText, fontWeight: 'bold' },
    iconBtn: { padding: 8, borderRadius: 8, backgroundColor: colors.primary + '0D' },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, maxHeight: '85%' },
    modalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    label: { color: colors.secondary, fontSize: 12, fontWeight: 'bold', marginBottom: 5, textTransform: 'uppercase', marginTop: 15 },
    input: { backgroundColor: colors.surface, borderRadius: 10, padding: 12, color: colors.text, borderWidth: 1, borderColor: colors.border },
    viewText: { color: colors.text, fontSize: 16, paddingVertical: 5 },
    descBox: { backgroundColor: colors.primary + '0D', borderRadius: 10, padding: 10 },
    submitBtn: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitBtnText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 16 }
});
