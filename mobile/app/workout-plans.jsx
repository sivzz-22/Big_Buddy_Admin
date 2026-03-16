import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Modal, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';

export default function WorkoutPlans() {
    const { colors } = useTheme();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({ title: '', level: 'Beginner', duration: '', routine: '' });

    const styles = getStyles(colors);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/workout-plans`);
            setPlans(response.data);
        } catch (error) {
            console.log("Fetch workout plans error:", error);
            Alert.alert("Error", "Could not fetch workout plans.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (plan = null, edit = false) => {
        setIsEditMode(edit);
        if (plan) {
            setEditingPlan(plan);
            setPlanForm({
                title: plan.title,
                level: plan.level,
                duration: plan.duration,
                routine: plan.routine
            });
        } else {
            setEditingPlan(null);
            setPlanForm({ title: '', level: 'Beginner', duration: '', routine: '' });
            setIsEditMode(true);
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        if (!planForm.title || !planForm.routine) {
            Alert.alert("Error", "Please fill title and routine.");
            return;
        }

        try {
            if (editingPlan) {
                const response = await axios.put(`${API_URL}/workout-plans/${editingPlan._id}`, planForm);
                setPlans(plans.map(p => p._id === editingPlan._id ? response.data : p));
                Alert.alert("Success", "Workout plan updated!");
            } else {
                const response = await axios.post(`${API_URL}/workout-plans`, planForm);
                setPlans([response.data, ...plans]);
                Alert.alert("Success", "New workout plan created!");
            }
            setModalVisible(false);
        } catch (error) {
            console.log("Save workout plan error:", error);
            Alert.alert("Error", "Could not save workout plan.");
        }
    };

    const handleDelete = (id) => {
        Alert.alert("Delete", "Delete this workout plan?", [
            { text: "Cancel" },
            {
                text: "Delete",
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${API_URL}/workout-plans/${id}`);
                        setPlans(plans.filter(p => p._id !== id));
                    } catch (error) {
                        console.log("Delete error:", error);
                        Alert.alert("Error", "Could not delete workout plan.");
                    }
                }
            }
        ]);
    };


    return (
        <View style={styles.container}>
            <Stack.Screen options={{
                title: 'Workout Plans',
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
                    contentContainerStyle={{ padding: 20 }}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <MaterialCommunityIcons name="arm-flex-outline" size={30} color={colors.primary} />
                                <View style={{ flex: 1, marginLeft: 15 }}>
                                    <Text style={styles.planTitle}>{item.title}</Text>
                                    <Text style={styles.planSubtitle}>{item.level} • {item.duration}</Text>
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

                            <View style={styles.routineBox}>
                                <Text style={styles.routineTitle}>Routine Details:</Text>
                                <Text style={styles.routineText}>{item.routine}</Text>
                            </View>

                            <View style={styles.actions}>
                                <Pressable style={styles.assignBtn} onPress={() => router.push('/members')}>
                                    <Ionicons name="person-add" size={16} color={colors.buttonPrimaryText} />
                                    <Text style={styles.assignBtnText}>Assign Member</Text>
                                </Pressable>
                                <Pressable style={styles.viewBtn} onPress={() => handleOpenModal(item, false)}>
                                    <Text style={styles.viewBtnText}>View Details</Text>
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
                                {!isEditMode ? 'Plan Details' : editingPlan ? 'Edit Routine' : 'New Workout Plan'}
                            </Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </Pressable>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.label}>Plan Title</Text>
                            {isEditMode ? (
                                <TextInput style={styles.input} value={planForm.title} onChangeText={t => setPlanForm({ ...planForm, title: t })} />
                            ) : (
                                <Text style={styles.viewText}>{planForm.title}</Text>
                            )}

                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Level</Text>
                                    {isEditMode ? (
                                        <TextInput style={styles.input} value={planForm.level} onChangeText={t => setPlanForm({ ...planForm, level: t })} />
                                    ) : (
                                        <Text style={styles.viewText}>{planForm.level}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Duration</Text>
                                    {isEditMode ? (
                                        <TextInput style={styles.input} value={planForm.duration} placeholder="e.g. 60 mins" placeholderTextColor={colors.secondary} onChangeText={t => setPlanForm({ ...planForm, duration: t })} />
                                    ) : (
                                        <Text style={styles.viewText}>{planForm.duration}</Text>
                                    )}
                                </View>
                            </View>

                            <Text style={styles.label}>Workout Routine (Exercises)</Text>
                            {isEditMode ? (
                                <TextInput
                                    style={[styles.input, { height: 150, textAlignVertical: 'top' }]}
                                    multiline
                                    placeholder="Type exercises here (one per line or comma-separated)"
                                    placeholderTextColor={colors.secondary}
                                    value={planForm.routine}
                                    onChangeText={t => setPlanForm({ ...planForm, routine: t })}
                                />
                            ) : (
                                <View style={styles.routineBox}>
                                    <Text style={styles.routineText}>{planForm.routine}</Text>
                                </View>
                            )}

                            {isEditMode ? (
                                <Pressable style={styles.submitBtn} onPress={handleSave}>
                                    <Text style={styles.submitBtnText}>SAVE WORKOUT PLAN</Text>
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
    card: { backgroundColor: colors.surface, borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    planTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    planSubtitle: { fontSize: 13, color: colors.secondary, marginTop: 4 },
    routineBox: { backgroundColor: colors.background, borderRadius: 12, padding: 15, marginVertical: 15 },
    routineTitle: { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
    routineText: { color: colors.secondary, fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
    actions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 },
    assignBtn: { flex: 1.5, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 10 },
    assignBtnText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 13 },
    viewBtn: { flex: 1, borderWidth: 1, borderColor: colors.secondary, justifyContent: 'center', alignItems: 'center', borderRadius: 10, paddingVertical: 10 },
    viewBtnText: { color: colors.secondary, fontWeight: '600', fontSize: 13 },
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
        elevation: 10,
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
