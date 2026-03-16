import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';

export default function DietPlans() {
    const { colors } = useTheme();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({ name: '', meals: '', cals: '', plan: '', icon: 'food-apple' });

    const styles = getStyles(colors);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/diet-plans`);
            setPlans(response.data);
        } catch (error) {
            console.log("Fetch diet plans error:", error);
            Alert.alert("Error", "Could not fetch diet plans.");
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
                meals: String(plan.meals),
                cals: plan.cals,
                plan: plan.plan,
                icon: plan.icon || 'food-apple'
            });
        } else {
            setEditingPlan(null);
            setPlanForm({ name: '', meals: '4', cals: '2000 kcal', plan: '', icon: 'food-apple' });
            setIsEditMode(true);
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!planForm.name || !planForm.plan) {
            Alert.alert("Error", "Please fill name and nutrition details.");
            return;
        }

        try {
            if (editingPlan) {
                const response = await axios.put(`${API_URL}/diet-plans/${editingPlan._id}`, planForm);
                setPlans(plans.map(p => p._id === editingPlan._id ? response.data : p));
                Alert.alert("Success", "Diet plan updated!");
            } else {
                const response = await axios.post(`${API_URL}/diet-plans`, planForm);
                setPlans([response.data, ...plans]);
                Alert.alert("Success", "New diet plan created!");
            }
            setModalVisible(false);
        } catch (error) {
            console.log("Save diet plan error:", error);
            Alert.alert("Error", "Could not save diet plan.");
        }
    };

    const handleDelete = (id) => {
        Alert.alert("Delete", "Delete this diet plan?", [
            { text: "Cancel" },
            {
                text: "Delete",
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${API_URL}/diet-plans/${id}`);
                        setPlans(plans.filter(p => p._id !== id));
                    } catch (error) {
                        console.log("Delete error:", error);
                        Alert.alert("Error", "Could not delete diet plan.");
                    }
                }
            }
        ]);
    };


    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Diet & Nutrition Plans',
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
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={styles.iconCircle}>
                                    <MaterialCommunityIcons name={item.icon || 'food-apple'} size={28} color={colors.primary} />
                                </View>
                                <View style={styles.cardMain}>
                                    <Text style={styles.dietName}>{item.name}</Text>
                                    <Text style={styles.dietMeta}>{item.meals} Meals per Day • {item.cals}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <Pressable onPress={() => handleOpenModal(item, true)}>
                                        <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                                    </Pressable>
                                    <Pressable onPress={() => handleDelete(item._id)}>
                                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                                    </Pressable>
                                </View>
                            </View>

                            <View style={styles.mealPreview}>
                                <Text style={styles.previewTitle}>Diet Plan Overview:</Text>
                                <Text style={styles.previewText}>{item.plan}</Text>
                            </View>

                            <View style={styles.actions}>
                                <Pressable style={styles.btnAssign} onPress={() => router.push('/members')}>
                                    <Ionicons name="person-add-outline" size={16} color={colors.buttonPrimaryText} />
                                    <Text style={styles.btnAssignText}>Assign to Member</Text>
                                </Pressable>
                                <Pressable style={styles.btnEdit} onPress={() => handleOpenModal(item, false)}>
                                    <Text style={styles.btnEditText}>View Plan</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}
                />
            )}


            <Pressable style={styles.fab} onPress={() => handleOpenModal()}>
                <Ionicons name="add" size={30} color={colors.buttonPrimaryText} />
            </Pressable>

            <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalTop}>
                            <Text style={styles.modalTitle}>
                                {!isEditMode ? 'Nutrition Details' : editingPlan ? 'Edit Diet Plan' : 'New Diet Plan'}
                            </Text>
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
                                    <Text style={styles.label}>Meals/Day</Text>
                                    {isEditMode ? (
                                        <TextInput style={styles.input} value={String(planForm.meals)} keyboardType="numeric" onChangeText={t => setPlanForm({ ...planForm, meals: t })} />
                                    ) : (
                                        <Text style={styles.viewText}>{planForm.meals}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Target Calories</Text>
                                    {isEditMode ? (
                                        <TextInput style={styles.input} value={planForm.cals} placeholder="e.g. 2500 kcal" placeholderTextColor={colors.secondary} onChangeText={t => setPlanForm({ ...planForm, cals: t })} />
                                    ) : (
                                        <Text style={styles.viewText}>{planForm.cals}</Text>
                                    )}
                                </View>
                            </View>

                            <Text style={styles.label}>Full Nutrition Schedule</Text>
                            {isEditMode ? (
                                <TextInput
                                    style={[styles.input, { height: 150, textAlignVertical: 'top' }]}
                                    multiline
                                    placeholder="Breakfast: ...\nLunch: ...\nSnacks: ...\nDinner: ..."
                                    placeholderTextColor={colors.secondary}
                                    value={planForm.plan}
                                    onChangeText={t => setPlanForm({ ...planForm, plan: t })}
                                />
                            ) : (
                                <View style={styles.mealPreview}>
                                    <Text style={styles.previewText}>{planForm.plan}</Text>
                                </View>
                            )}

                            {isEditMode ? (
                                <Pressable style={styles.submitBtn} onPress={handleSave}>
                                    <Text style={styles.submitBtnText}>SAVE DIET PLAN</Text>
                                </Pressable>
                            ) : (
                                <Pressable style={styles.submitBtn} onPress={() => setIsEditMode(true)}>
                                    <Text style={styles.submitBtnText}>EDIT PLAN</Text>
                                </Pressable>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const getStyles = (colors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { padding: 20, paddingBottom: 100 },
    card: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
    cardMain: { flex: 1, marginLeft: 15 },
    dietName: { fontSize: 17, fontWeight: 'bold', color: colors.text },
    dietMeta: { fontSize: 12, color: colors.secondary, marginTop: 4 },
    mealPreview: { backgroundColor: colors.background, borderRadius: 12, padding: 12, marginTop: 15 },
    previewTitle: { fontSize: 12, fontWeight: 'bold', color: colors.primary, marginBottom: 4 },
    previewText: { fontSize: 13, color: colors.secondary, fontStyle: 'italic', lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 12, marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 },
    btnAssign: { flex: 1.5, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 10 },
    btnAssignText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 14 },
    btnEdit: { flex: 1, borderWidth: 1, borderColor: colors.secondary, justifyContent: 'center', alignItems: 'center', borderRadius: 10, paddingVertical: 10 },
    btnEditText: { color: colors.secondary, fontWeight: '600' },
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
        elevation: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 25, paddingTop: 25, paddingBottom: 40, maxHeight: '85%' },
    modalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },
    label: { color: colors.secondary, fontWeight: 'bold', marginBottom: 8, marginTop: 15, fontSize: 12, textTransform: 'uppercase' },
    input: { backgroundColor: colors.surface, borderRadius: 12, padding: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
    viewText: { color: colors.text, fontSize: 16, paddingVertical: 5 },
    submitBtn: {
        backgroundColor: colors.primary,
        padding: 18,
        borderRadius: 15,
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
