import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useTheme } from '../constants/ThemeContext';

export default function DrawerToggleButton() {
    const navigation = useNavigation();
    const { colors } = useTheme();

    return (
        <Pressable onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ marginLeft: 15 }}>
            <Ionicons name="menu" size={28} color={colors.primary} />
        </Pressable>
    );
}
