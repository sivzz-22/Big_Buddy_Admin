import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, Pressable, TextInput,
    Modal, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../constants/ThemeContext';
import axios from 'axios';
import { API_URL } from '../constants/Config';

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

const defaultExercise = () => ({ name: '', sets: '3', reps: '10', kg: '0' });

export default function WorkoutPlans() {
    const { colors } = useTheme();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({
        title: '',
        level: 'Beginner',
        duration: '',
        exercises: [defaultExercise()]
    });

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
            // Support old plans that used 'routine' string
            let exercises = plan.exercises && plan.exercises.length > 0
                ? plan.exercises.map(ex => ({ ...ex }))
                : (plan.routine
                    ? plan.routine.split('\n').filter(l => l.trim()).map(l => ({ name: l.trim(), sets: '3', reps: '10', kg: '0' }))
                    : [defaultExercise()]);
            setPlanForm({
                title: plan.title,
                level: plan.level,
                duration: plan.duration,
                exercises
            });
        } else {
            setEditingPlan(null);
            setPlanForm({ title: '', level: 'Beginner', duration: '', exercises: [defaultExercise()] });
            setIsEditMode(true);
        }
        setModalVisible(true);
    };

    const addExercise = () => {
        setPlanForm(prev => ({ ...prev, exercises: [...prev.exercises, defaultExercise()] }));
    };

    const removeExercise = (index) => {
        if (planForm.exercises.length <= 1) {
            Alert.alert("Error", "At least one exercise is required.");
            return;
        }
        const updated = planForm.exercises.filter((_, i) => i !== index);
        setPlanForm(prev => ({ ...prev, exercises: updated }));
    };

    const updateExercise = (index, field, value) => {
        const updated = planForm.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex);
        setPlanForm(prev => ({ ...prev, exercises: updated }));
    };

    const handleSave = async () => {
        if (!planForm.title || !planForm.duration) {
            Alert.alert("Error", "Please fill title and duration.");
            return;
        }
        const validExercises = planForm.exercises.filter(ex => ex.name.trim());
        if (validExercises.length === 0) {
            Alert.alert("Error", "Please add at least one exercise with a name.");
            return;
        }

        const payload = {
            title: planForm.title,
            level: planForm.level,
            duration: planForm.duration,
            exercises: validExercises,
            routine: validExercises.map(e => e.name).join('\n') // backward compat
        };

        try {
            if (editingPlan) {
                const response = await axios.put(`${API_URL}/workout-plans/${editingPlan._id}`, payload);
                setPlans(plans.map(p => p._id === editingPlan._id ? response.data : p));
                Alert.alert("Success", "Workout plan updated!");
            } else {
                const response = await axios.post(`${API_URL}/workout-plans`, payload);
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
                        Alert.alert("Error", "Could not delete workout plan.");
                    }
                }
            }
        ]);
    };

    const getExercisesForPlan = (plan) => {
        if (plan.exercises && plan.exercises.length > 0) return plan.exercises;
        if (plan.routine) return plan.routine.split('\n').filter(l => l.trim()).map(l => ({ name: l.trim(), sets: '-', reps: '-', kg: '-' }));
        return [];
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
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <MaterialCommunityIcons name="arm-flex-outline" size={70} color={colors.secondary} />
                            <Text style={{ color: colors.secondary, marginTop: 15, fontSize: 16 }}>No plans yet. Tap + to create one.</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const exercises = getExercisesForPlan(item);
                        return (
                            <View style={styles.card}>
                                {/* Card Header */}
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

                                {/* Exercise Table */}
                                <View style={styles.tableContainer}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.tableHeaderText, { flex: 3 }]}>EXERCISE</Text>
                                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>SETS</Text>
                                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>REPS</Text>
                                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>KG</Text>
                                    </View>
                                    {exercises.slice(0, 4).map((ex, idx) => (
                                        <View key={idx} style={styles.tableRow}>
                                            <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={1}>{ex.name}</Text>
                                            <Text style={[styles.tableCellVal, { flex: 1 }]}>{ex.sets}</Text>
                                            <Text style={[styles.tableCellVal, { flex: 1 }]}>{ex.reps}</Text>
                                            <Text style={[styles.tableCellVal, { flex: 1 }]}>{ex.kg}</Text>
                                        </View>
                                    ))}
                                    {exercises.length > 4 && (
                                        <Text style={styles.moreText}>+{exercises.length - 4} more exercises</Text>
                                    )}
                                </View>

                                {/* Actions */}
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
                        );
                    }}
                />
            )}

            <Pressable style={styles.fab} onPress={() => handleOpenModal()}>
                <Ionicons name="add" size={30} color={colors.buttonPrimaryText} />
            </Pressable>

            {/* Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalTop}>
                            <Text style={styles.modalTitle}>
                                {!isEditMode ? 'Plan Details' : editingPlan ? 'Edit Workout Plan' : 'New Workout Plan'}
                            </Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Title */}
                            <Text style={styles.label}>Plan Title</Text>
                            {isEditMode ? (
                                <TextInput
                                    style={styles.input}
                                    value={planForm.title}
                                    placeholder="e.g. Full Body Beginner"
                                    placeholderTextColor={colors.secondary}
                                    onChangeText={t => setPlanForm({ ...planForm, title: t })}
                                />
                            ) : (
                                <Text style={styles.viewText}>{planForm.title}</Text>
                            )}

                            {/* Level & Duration */}
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Level</Text>
                                    {isEditMode ? (
                                        <View style={styles.levelPicker}>
                                            {LEVEL_OPTIONS.map(lvl => (
                                                <Pressable
                                                    key={lvl}
                                                    style={[styles.levelBtn, planForm.level === lvl && styles.levelBtnActive]}
                                                    onPress={() => setPlanForm({ ...planForm, level: lvl })}
                                                >
                                                    <Text style={[styles.levelBtnText, planForm.level === lvl && styles.levelBtnTextActive]}>
                                                        {lvl}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={styles.viewText}>{planForm.level}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Duration</Text>
                                    {isEditMode ? (
                                        <TextInput
                                            style={styles.input}
                                            value={planForm.duration}
                                            placeholder="e.g. 45 mins"
                                            placeholderTextColor={colors.secondary}
                                            onChangeText={t => setPlanForm({ ...planForm, duration: t })}
                                        />
                                    ) : (
                                        <Text style={styles.viewText}>{planForm.duration}</Text>
                                    )}
                                </View>
                            </View>

                            {/* Exercises Section */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>EXERCISES</Text>
                                {isEditMode && (
                                    <Pressable style={styles.addExBtn} onPress={addExercise}>
                                        <Ionicons name="add-circle" size={22} color={colors.primary} />
                                        <Text style={styles.addExText}>Add</Text>
                                    </Pressable>
                                )}
                            </View>

                            {/* Exercise Table Header */}
                            <View style={styles.exTableHeader}>
                                <Text style={[styles.exHeaderText, { flex: 3 }]}>Exercise Name</Text>
                                <Text style={[styles.exHeaderText, { flex: 1 }]}>Sets</Text>
                                <Text style={[styles.exHeaderText, { flex: 1 }]}>Reps</Text>
                                <Text style={[styles.exHeaderText, { flex: 1 }]}>KG</Text>
                                {isEditMode && <View style={{ width: 28 }} />}
                            </View>

                            {(isEditMode ? planForm.exercises : (
                                planForm.exercises?.length > 0 ? planForm.exercises :
                                    (planForm.routine ? planForm.routine.split('\n').filter(l => l.trim()).map(l => ({ name: l.trim(), sets: '-', reps: '-', kg: '-' })) : [])
                            )).map((ex, index) => (
                                <View key={index} style={styles.exRow}>
                                    {isEditMode ? (
                                        <>
                                            <TextInput
                                                style={[styles.exInput, { flex: 3 }]}
                                                value={ex.name}
                                                placeholder="Exercise name"
                                                placeholderTextColor={colors.secondary}
                                                onChangeText={v => updateExercise(index, 'name', v)}
                                            />
                                            <TextInput
                                                style={[styles.exInputSmall, { flex: 1 }]}
                                                value={ex.sets}
                                                keyboardType="numeric"
                                                onChangeText={v => updateExercise(index, 'sets', v)}
                                            />
                                            <TextInput
                                                style={[styles.exInputSmall, { flex: 1 }]}
                                                value={ex.reps}
                                                keyboardType="numeric"
                                                onChangeText={v => updateExercise(index, 'reps', v)}
                                            />
                                            <TextInput
                                                style={[styles.exInputSmall, { flex: 1 }]}
                                                value={ex.kg}
                                                keyboardType="numeric"
                                                onChangeText={v => updateExercise(index, 'kg', v)}
                                            />
                                            <Pressable onPress={() => removeExercise(index)} style={{ width: 28, alignItems: 'center' }}>
                                                <Ionicons name="remove-circle" size={20} color={colors.error} />
                                            </Pressable>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.exViewCell, { flex: 3 }]}>{ex.name}</Text>
                                            <Text style={[styles.exViewVal, { flex: 1 }]}>{ex.sets}</Text>
                                            <Text style={[styles.exViewVal, { flex: 1 }]}>{ex.reps}</Text>
                                            <Text style={[styles.exViewVal, { flex: 1 }]}>{ex.kg}</Text>
                                        </>
                                    )}
                                </View>
                            ))}

                            {(isEditMode ? planForm.exercises : planForm.exercises || []).length === 0 && !isEditMode && (
                                <Text style={{ color: colors.secondary, textAlign: 'center', padding: 20 }}>No exercises added yet.</Text>
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
    card: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    planTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
    planSubtitle: { fontSize: 13, color: colors.secondary, marginTop: 4 },

    tableContainer: { borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 15 },
    tableHeader: { flexDirection: 'row', backgroundColor: colors.primary + '20', padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    tableHeaderText: { fontSize: 10, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },
    tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.border + '60' },
    tableCell: { fontSize: 13, color: colors.text, fontWeight: '500' },
    tableCellVal: { fontSize: 13, color: colors.primary, fontWeight: 'bold', textAlign: 'center' },
    moreText: { fontSize: 12, color: colors.secondary, textAlign: 'center', paddingVertical: 8, fontStyle: 'italic' },

    actions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 },
    assignBtn: { flex: 1.5, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 10 },
    assignBtnText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 13 },
    viewBtn: { flex: 1, borderWidth: 1, borderColor: colors.secondary, justifyContent: 'center', alignItems: 'center', borderRadius: 10, paddingVertical: 10 },
    viewBtnText: { color: colors.secondary, fontWeight: '600', fontSize: 13 },

    fab: {
        position: 'absolute', bottom: 30, right: 30,
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 10,
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40, maxHeight: '92%' },
    modalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },

    label: { color: colors.secondary, fontWeight: 'bold', marginBottom: 8, marginTop: 15, fontSize: 12, textTransform: 'uppercase' },
    input: { backgroundColor: colors.surface, borderRadius: 12, padding: 13, color: colors.text, borderWidth: 1, borderColor: colors.border },
    viewText: { color: colors.text, fontSize: 16, paddingVertical: 5 },

    levelPicker: { flexDirection: 'column', gap: 6, marginTop: 5 },
    levelBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
    levelBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    levelBtnText: { fontSize: 12, color: colors.text, fontWeight: '600' },
    levelBtnTextActive: { color: colors.buttonPrimaryText },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
    addExBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.primary + '15', borderRadius: 8 },
    addExText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },

    exTableHeader: { flexDirection: 'row', backgroundColor: colors.primary + '15', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginTop: 8, alignItems: 'center' },
    exHeaderText: { fontSize: 10, fontWeight: 'bold', color: colors.primary, textAlign: 'center' },

    exRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border + '50' },
    exInput: { backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 10, color: colors.text, borderWidth: 1, borderColor: colors.border, fontSize: 13 },
    exInputSmall: { backgroundColor: colors.surface, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 4, color: colors.primary, borderWidth: 1, borderColor: colors.border, fontSize: 13, textAlign: 'center', fontWeight: 'bold' },
    exViewCell: { fontSize: 13, color: colors.text, fontWeight: '500', paddingVertical: 10 },
    exViewVal: { fontSize: 13, color: colors.primary, fontWeight: 'bold', textAlign: 'center', paddingVertical: 10 },

    submitBtn: {
        backgroundColor: colors.primary, padding: 18, borderRadius: 15,
        alignItems: 'center', marginTop: 30,
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    submitBtnText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 16 }
});
