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

const MEAL_TIMES = ['Morning', 'Mid-Morning', 'Noon', 'Evening', 'Night'];
const ICON_OPTIONS = ['food-apple', 'bowl-mix', 'food-steak', 'food', 'leaf', 'weight-lifter', 'noodles'];

const defaultMeal = (mealTime = '') => ({ mealTime, items: '' });

export default function DietPlans() {
    const { colors } = useTheme();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const [planForm, setPlanForm] = useState({
        name: '',
        meals: '3',
        cals: '2000 kcal',
        icon: 'food-apple',
        mealSchedule: [defaultMeal('Morning'), defaultMeal('Noon'), defaultMeal('Evening')]
    });

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
            // Support old plans that used 'plan' string
            let mealSchedule = plan.mealSchedule && plan.mealSchedule.length > 0
                ? plan.mealSchedule.map(m => ({ ...m }))
                : (plan.plan
                    ? plan.plan.split('\n').filter(l => l.trim()).map((l, i) => {
                        const parts = l.split(':');
                        return parts.length > 1
                            ? { mealTime: parts[0].trim(), items: parts.slice(1).join(':').trim() }
                            : { mealTime: MEAL_TIMES[i] || `Meal ${i + 1}`, items: l.trim() };
                    })
                    : [defaultMeal('Morning')]);
            setPlanForm({
                name: plan.name,
                meals: String(plan.meals),
                cals: plan.cals,
                icon: plan.icon || 'food-apple',
                mealSchedule
            });
        } else {
            setEditingPlan(null);
            setPlanForm({
                name: '',
                meals: '3',
                cals: '2000 kcal',
                icon: 'food-apple',
                mealSchedule: [defaultMeal('Morning'), defaultMeal('Noon'), defaultMeal('Evening')]
            });
            setIsEditMode(true);
        }
        setModalVisible(true);
    };

    const addMeal = () => {
        const usedTimes = planForm.mealSchedule.map(m => m.mealTime);
        const nextTime = MEAL_TIMES.find(t => !usedTimes.includes(t)) || `Meal ${planForm.mealSchedule.length + 1}`;
        const updated = [...planForm.mealSchedule, defaultMeal(nextTime)];
        setPlanForm(prev => ({ ...prev, mealSchedule: updated, meals: String(updated.length) }));
    };

    const removeMeal = (index) => {
        if (planForm.mealSchedule.length <= 1) {
            Alert.alert("Error", "At least one meal is required.");
            return;
        }
        const updated = planForm.mealSchedule.filter((_, i) => i !== index);
        setPlanForm(prev => ({ ...prev, mealSchedule: updated, meals: String(updated.length) }));
    };

    const updateMeal = (index, field, value) => {
        const updated = planForm.mealSchedule.map((m, i) => i === index ? { ...m, [field]: value } : m);
        setPlanForm(prev => ({ ...prev, mealSchedule: updated }));
    };

    const handleSave = async () => {
        if (!planForm.name || !planForm.cals) {
            Alert.alert("Error", "Please fill plan name and calories.");
            return;
        }
        const validMeals = planForm.mealSchedule.filter(m => m.mealTime.trim() && m.items.trim());
        if (validMeals.length === 0) {
            Alert.alert("Error", "Please add at least one meal with time and items.");
            return;
        }

        const payload = {
            name: planForm.name,
            meals: String(validMeals.length),
            cals: planForm.cals,
            icon: planForm.icon,
            mealSchedule: validMeals,
            plan: validMeals.map(m => `${m.mealTime}: ${m.items}`).join('\n') // backward compat
        };

        try {
            if (editingPlan) {
                const response = await axios.put(`${API_URL}/diet-plans/${editingPlan._id}`, payload);
                setPlans(plans.map(p => p._id === editingPlan._id ? response.data : p));
                Alert.alert("Success", "Diet plan updated!");
            } else {
                const response = await axios.post(`${API_URL}/diet-plans`, payload);
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
                        Alert.alert("Error", "Could not delete diet plan.");
                    }
                }
            }
        ]);
    };

    const getMealSchedule = (plan) => {
        if (plan.mealSchedule && plan.mealSchedule.length > 0) return plan.mealSchedule;
        if (plan.plan) {
            return plan.plan.split('\n').filter(l => l.trim()).map((l, i) => {
                const parts = l.split(':');
                return parts.length > 1
                    ? { mealTime: parts[0].trim(), items: parts.slice(1).join(':').trim() }
                    : { mealTime: MEAL_TIMES[i] || `Meal ${i + 1}`, items: l.trim() };
            });
        }
        return [];
    };

    const mealTimeColors = {
        'Morning': '#FF9800',
        'Mid-Morning': '#4CAF50',
        'Noon': '#2196F3',
        'Evening': '#9C27B0',
        'Night': '#607D8B',
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
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', marginTop: 60 }}>
                            <MaterialCommunityIcons name="food-apple-outline" size={70} color={colors.secondary} />
                            <Text style={{ color: colors.secondary, marginTop: 15, fontSize: 16 }}>No diet plans yet. Tap + to create one.</Text>
                        </View>
                    }
                    renderItem={({ item }) => {
                        const meals = getMealSchedule(item);
                        return (
                            <View style={styles.card}>
                                {/* Card Header */}
                                <View style={styles.cardHeader}>
                                    <View style={styles.iconCircle}>
                                        <MaterialCommunityIcons name={item.icon || 'food-apple'} size={28} color={colors.primary} />
                                    </View>
                                    <View style={styles.cardMain}>
                                        <Text style={styles.dietName}>{item.name}</Text>
                                        <Text style={styles.dietMeta}>{item.meals} Meals/Day • {item.cals}</Text>
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

                                {/* Meal Schedule Preview */}
                                <View style={styles.mealList}>
                                    {meals.slice(0, 3).map((meal, idx) => {
                                        const color = mealTimeColors[meal.mealTime] || colors.primary;
                                        return (
                                            <View key={idx} style={styles.mealPreviewRow}>
                                                <View style={[styles.mealTimeBadge, { backgroundColor: color + '20' }]}>
                                                    <Text style={[styles.mealTimeBadgeText, { color }]}>{meal.mealTime}</Text>
                                                </View>
                                                <Text style={styles.mealItemsText} numberOfLines={1}>{meal.items}</Text>
                                            </View>
                                        );
                                    })}
                                    {meals.length > 3 && (
                                        <Text style={styles.moreText}>+{meals.length - 3} more meals</Text>
                                    )}
                                </View>

                                {/* Actions */}
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
                                {!isEditMode ? 'Diet Plan Details' : editingPlan ? 'Edit Diet Plan' : 'New Diet Plan'}
                            </Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </Pressable>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Name */}
                            <Text style={styles.label}>Plan Name</Text>
                            {isEditMode ? (
                                <TextInput
                                    style={styles.input}
                                    value={planForm.name}
                                    placeholder="e.g. Muscle Gain"
                                    placeholderTextColor={colors.secondary}
                                    onChangeText={t => setPlanForm({ ...planForm, name: t })}
                                />
                            ) : (
                                <Text style={styles.viewText}>{planForm.name}</Text>
                            )}

                            {/* Calories & Icon */}
                            <View style={{ flexDirection: 'row', gap: 15 }}>
                                <View style={{ flex: 2 }}>
                                    <Text style={styles.label}>Target Calories</Text>
                                    {isEditMode ? (
                                        <TextInput
                                            style={styles.input}
                                            value={planForm.cals}
                                            placeholder="e.g. 2500 kcal"
                                            placeholderTextColor={colors.secondary}
                                            onChangeText={t => setPlanForm({ ...planForm, cals: t })}
                                        />
                                    ) : (
                                        <Text style={styles.viewText}>{planForm.cals}</Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Icon</Text>
                                    {isEditMode ? (
                                        <Pressable
                                            style={styles.iconSelector}
                                            onPress={() => setIconPickerOpen(!iconPickerOpen)}
                                        >
                                            <MaterialCommunityIcons name={planForm.icon} size={28} color={colors.primary} />
                                        </Pressable>
                                    ) : (
                                        <MaterialCommunityIcons name={planForm.icon} size={34} color={colors.primary} style={{ paddingVertical: 5 }} />
                                    )}
                                </View>
                            </View>

                            {/* Icon Picker */}
                            {iconPickerOpen && isEditMode && (
                                <View style={styles.iconGrid}>
                                    {ICON_OPTIONS.map(ic => (
                                        <Pressable
                                            key={ic}
                                            style={[styles.iconOption, planForm.icon === ic && styles.iconOptionActive]}
                                            onPress={() => { setPlanForm(p => ({ ...p, icon: ic })); setIconPickerOpen(false); }}
                                        >
                                            <MaterialCommunityIcons name={ic} size={28} color={planForm.icon === ic ? colors.buttonPrimaryText : colors.primary} />
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {/* Meal Schedule */}
                            <View style={styles.sectionHeader}>
                                <Text style={styles.label}>MEAL SCHEDULE</Text>
                                {isEditMode && (
                                    <Pressable style={styles.addMealBtn} onPress={addMeal}>
                                        <Ionicons name="add-circle" size={22} color={colors.primary} />
                                        <Text style={styles.addMealText}>Add Meal</Text>
                                    </Pressable>
                                )}
                            </View>

                            {(isEditMode ? planForm.mealSchedule : getMealSchedule({ mealSchedule: planForm.mealSchedule, plan: '' })).map((meal, index) => {
                                const color = mealTimeColors[meal.mealTime] || colors.primary;
                                return (
                                    <View key={index} style={[styles.mealCard, { borderLeftColor: color }]}>
                                        <View style={styles.mealCardHeader}>
                                            {isEditMode ? (
                                                <View style={styles.mealTimePicker}>
                                                    {MEAL_TIMES.map(mt => (
                                                        <Pressable
                                                            key={mt}
                                                            style={[styles.mtBtn, meal.mealTime === mt && { backgroundColor: mealTimeColors[mt] || colors.primary }]}
                                                            onPress={() => updateMeal(index, 'mealTime', mt)}
                                                        >
                                                            <Text style={[styles.mtBtnText, meal.mealTime === mt && { color: '#FFF' }]}>
                                                                {mt}
                                                            </Text>
                                                        </Pressable>
                                                    ))}
                                                </View>
                                            ) : (
                                                <View style={[styles.mealTimeBadge, { backgroundColor: color + '20' }]}>
                                                    <Text style={[styles.mealTimeBadgeText, { color }]}>{meal.mealTime}</Text>
                                                </View>
                                            )}
                                            {isEditMode && (
                                                <Pressable onPress={() => removeMeal(index)} style={{ padding: 4 }}>
                                                    <Ionicons name="remove-circle" size={22} color={colors.error} />
                                                </Pressable>
                                            )}
                                        </View>

                                        {isEditMode ? (
                                            <TextInput
                                                style={[styles.input, { marginTop: 10, textAlignVertical: 'top', minHeight: 70 }]}
                                                multiline
                                                value={meal.items}
                                                placeholder="e.g. Nuts, 2 Eggs, 100g Oats, 1 Banana"
                                                placeholderTextColor={colors.secondary}
                                                onChangeText={v => updateMeal(index, 'items', v)}
                                            />
                                        ) : (
                                            <Text style={styles.mealItemsDisplay}>{meal.items}</Text>
                                        )}
                                    </View>
                                );
                            })}

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
    card: { backgroundColor: colors.surface, borderRadius: 20, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
    cardMain: { flex: 1, marginLeft: 12 },
    dietName: { fontSize: 17, fontWeight: 'bold', color: colors.text },
    dietMeta: { fontSize: 12, color: colors.secondary, marginTop: 4 },

    mealList: { gap: 8, marginBottom: 15 },
    mealPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mealTimeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, minWidth: 70, alignItems: 'center' },
    mealTimeBadgeText: { fontSize: 11, fontWeight: 'bold' },
    mealItemsText: { flex: 1, fontSize: 13, color: colors.secondary },
    moreText: { fontSize: 12, color: colors.secondary, fontStyle: 'italic', textAlign: 'center', marginTop: 4 },

    actions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15 },
    btnAssign: { flex: 1.5, backgroundColor: colors.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 10, paddingVertical: 10 },
    btnAssignText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 14 },
    btnEdit: { flex: 1, borderWidth: 1, borderColor: colors.secondary, justifyContent: 'center', alignItems: 'center', borderRadius: 10, paddingVertical: 10 },
    btnEditText: { color: colors.secondary, fontWeight: '600' },

    fab: {
        position: 'absolute', bottom: 30, right: 30,
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        elevation: 10, shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8,
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: colors.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingHorizontal: 20, paddingTop: 25, paddingBottom: 40, maxHeight: '93%' },
    modalTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primary },

    label: { color: colors.secondary, fontWeight: 'bold', marginBottom: 8, marginTop: 15, fontSize: 12, textTransform: 'uppercase' },
    input: { backgroundColor: colors.surface, borderRadius: 12, padding: 13, color: colors.text, borderWidth: 1, borderColor: colors.border },
    viewText: { color: colors.text, fontSize: 16, paddingVertical: 5 },

    iconSelector: {
        backgroundColor: colors.surface, borderRadius: 12, padding: 13,
        borderWidth: 1, borderColor: colors.border, alignItems: 'center'
    },
    iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, backgroundColor: colors.surface, borderRadius: 12, padding: 12 },
    iconOption: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    iconOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },

    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15 },
    addMealBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.primary + '15', borderRadius: 8 },
    addMealText: { color: colors.primary, fontWeight: 'bold', fontSize: 13 },

    mealCard: {
        backgroundColor: colors.surface, borderRadius: 12, padding: 14,
        marginTop: 12, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4
    },
    mealCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mealTimePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
    mtBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    mtBtnText: { fontSize: 11, color: colors.text, fontWeight: '600' },
    mealItemsDisplay: { fontSize: 14, color: colors.text, lineHeight: 22, marginTop: 8 },

    submitBtn: {
        backgroundColor: colors.primary, padding: 18, borderRadius: 15,
        alignItems: 'center', marginTop: 30,
        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    submitBtnText: { color: colors.buttonPrimaryText, fontWeight: 'bold', fontSize: 16 }
});
