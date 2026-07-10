import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';
import { BUSINESS_TYPES } from '../constants/businessOptions';

// Reusable business-type picker (full-width icon list). Shared by the
// AddBusiness wizard and the first-run Onboarding flow.
export default function BusinessTypeList({ selected, onSelect }) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
      {BUSINESS_TYPES.map((type) => {
        const isSelected = selected === type.name;
        return (
          <TouchableOpacity
            key={type.id}
            style={[styles.listCard, isSelected && styles.cardSelected]}
            onPress={() => onSelect(type.name)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, { backgroundColor: isSelected ? type.color + '20' : '#f5f5f5' }]}>
              <MaterialCommunityIcons name={type.icon} size={26} color={type.color} />
            </View>
            <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{type.name}</Text>
            {isSelected && (
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={13} color="#fff" />
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
  listContainer: { paddingHorizontal: spacing[4], paddingTop: 8, paddingBottom: 24 },
  listCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 16, marginBottom: spacing[3], alignItems: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#eee', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardSelected: { borderColor: colors.blue, backgroundColor: colors.blue + '08' },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardText: { flex: 1, fontSize: typography.base, color: colors.gray800, fontFamily: 'Poppins-SemiBold' },
  cardTextSelected: { color: colors.blue },
  checkCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});
