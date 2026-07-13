import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';
import { CATEGORIES } from '../constants/businessOptions';

// Reusable 2-column category picker (icon cards). Shared by the
// AddBusiness wizard and the first-run Onboarding flow.
export default function BusinessCategoryGrid({ selected, onSelect }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.name;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.gridCard, isSelected && styles.cardSelected]}
            onPress={() => onSelect(cat.name)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, { backgroundColor: isSelected ? cat.color + '20' : '#f5f5f5' }]}>
              <MaterialCommunityIcons name={cat.icon} size={26} color={cat.color} />
            </View>
            <Text style={[styles.cardText, isSelected && styles.cardTextSelected]} numberOfLines={2}>{cat.name}</Text>
            {isSelected && (
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing[3], paddingTop: 8, paddingBottom: 24, justifyContent: 'space-between' },
  gridCard: { width: '48%', backgroundColor: '#fff', borderRadius: radius.md, padding: 14, marginBottom: spacing[3], alignItems: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#eee', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardSelected: { borderColor: colors.blue, backgroundColor: colors.blue + '08' },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardText: { flex: 1, fontSize: typography.xs, color: colors.gray800, fontFamily: 'Poppins-SemiBold' },
  cardTextSelected: { color: colors.blue },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
