
export const MOCK_MEMBERS = [
    {
        id: '1',
        name: 'Alex Johnson',
        phone: '9876543210',
        email: 'alex@example.com',
        subscriptionType: 'Yearly',
        startDate: '2023-01-15',
        expiryDate: '2024-01-15',
        status: 'Active',
        workoutPlan: 'Push Pull Legs',
        dietPlan: 'Low Carb High Protein',
        attendance: 120,
        balance: 500,
    },
    {
        id: '2',
        name: 'Sarah Connor',
        phone: '8765432109',
        email: 'sarah@example.com',
        subscriptionType: 'Monthly',
        startDate: '2023-11-20',
        expiryDate: '2023-12-20',
        status: 'Expiring Soon',
        workoutPlan: 'Cardio Focus',
        dietPlan: 'Balanced',
        attendance: 15,
        balance: 0,
    },
    {
        id: '3',
        name: 'Mike Tyson',
        phone: '7654321098',
        email: 'mike@example.com',
        subscriptionType: 'Quarterly',
        startDate: '2023-09-01',
        expiryDate: '2023-12-01',
        status: 'Inactive',
        workoutPlan: 'Boxing Training',
        dietPlan: 'High Calorie',
        attendance: 45,
        balance: 1200,
    },
];

export const MOCK_TRANSACTIONS = [
    {
        id: 't1',
        memberId: '1',
        memberName: 'Alex Johnson',
        amount: 5000,
        paymentDate: '2023-01-15',
        duration: '1 Year',
        paymentMode: 'UPI',
    },
    {
        id: 't2',
        memberId: '2',
        memberName: 'Sarah Connor',
        amount: 1500,
        paymentDate: '2023-11-20',
        duration: '1 Month',
        paymentMode: 'Cash',
    },
];

export const MOCK_ATTENDANCE = [
    { id: 'a1', memberId: '1', memberName: 'Alex Johnson', date: '2026-02-19', time: '07:00 AM', session: 'Morning' },
    { id: 'a2', memberId: '2', memberName: 'Sarah Connor', date: '2026-02-19', time: '08:30 AM', session: 'Morning' },
    { id: 'a3', memberId: '1', memberName: 'Alex Johnson', date: '2026-02-20', time: '07:15 AM', session: 'Morning' },
    { id: 'a4', memberId: '3', memberName: 'Mike Tyson', date: '2026-02-20', time: '06:30 PM', session: 'Evening' },
    { id: 'a5', memberId: '2', memberName: 'Sarah Connor', date: '2026-02-20', time: '09:00 AM', session: 'Morning' },
    { id: 'a6', memberId: '1', memberName: 'Alex Johnson', date: '2026-02-18', time: '07:30 AM', session: 'Morning' },
    { id: 'a7', memberId: '3', memberName: 'Mike Tyson', date: '2026-02-18', time: '06:00 PM', session: 'Evening' },
];

export const MOCK_MEMBERSHIP_PLANS = [
    { id: '1', name: 'Starter Plan', price: '1500', duration: '1 Month', description: 'Access to gym area' },
    { id: '2', name: 'Standard Plan', price: '4000', duration: '3 Months', description: 'Gym + Basic Workout Plan' },
    { id: '3', name: 'Pro Plan', price: '12000', duration: '1 Year', description: 'Full Access + Diet + Personal Trainer' },
];

export const MOCK_WORKOUT_PLANS = [
    { id: '1', title: 'Weight Loss Elite', exercises: '8 Exercises (Cardio + Lite Weights)', level: 'Beginner', duration: '45 mins', routine: 'Running, Burpees, Squats, Planks, Pushups...' },
    { id: '2', title: 'Hypertrophy Pro', exercises: '12 Exercises (Heavy Lifting)', level: 'Advanced', duration: '90 mins', routine: 'Bench Press, Deadlifts, Overheads, Squats...' },
    { id: '3', title: 'Functional Strength', exercises: '10 Exercises (Bodyweight + Kettlebell)', level: 'Intermediate', duration: '60 mins', routine: 'Kettlebell Swings, Pullups, Dips, Turkish Getups...' },
];

export const MOCK_DIET_PLANS = [
    { id: '1', name: 'High Protein / Lean Muscle', meals: 5, cals: '2500 kcal', icon: 'food-steak', plan: 'Breakfast: Oats & Whey, Lunch: Chicken & Broccoli, Dinner: Fish & Salad' },
    { id: '2', name: 'Standard Keto', meals: 3, cals: '1800 kcal', icon: 'food-apple', plan: 'Breakfast: Eggs & Avocado, Lunch: Salmon & Spinach, Dinner: Steak & Asparagus' },
    { id: '3', name: 'Mass Gainer Extra', meals: 6, cals: '3500 kcal', icon: 'food-drumstick', plan: 'High Carb meals with shakes between. Peanuts and Whole grains.' },
];
