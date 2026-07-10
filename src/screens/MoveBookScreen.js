import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, typography, spacing } from '../theme';

export default function MoveBookScreen({ navigation, route }) {
  const { book } = route.params;
  const { businesses, currentBusinessId } = useApp();
  const [selected, setSelected] = useState(null);
  const [moving, setMoving]     = useState(false);

  const targets = businesses.filter(b => b.id !== currentBusinessId);

  const handleNext = async () => {
    if (!selected || moving) return;
    setMoving(true);
    try {
      Alert.alert('Coming soon', 'Move book feature will be available soon.');
    } finally {
      setMoving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.gray700} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Select Business</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.divider} />

      <Text style={s.subtitle}>
        Select a business to move <Text style={s.subtitleBold}>'{book.name}'</Text> book
      </Text>
      <View style={s.divider} />

      <FlatList
        data={targets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.bizRow} onPress={() => setSelected(item.id)}>
            <View style={[s.radio, selected === item.id && s.radioActive]}>
              {selected === item.id && <View style={s.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.bizName}>{item.name}</Text>
              <Text style={s.bizRole}>Your Role: Primary Admin</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={s.divider} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>No other businesses available to move to.</Text>
          </View>
        }
      />

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.footerBtn, !selected && s.footerBtnOff]}
          onPress={handleNext}
          disabled={!selected || moving}
        >
          {moving
            ? <ActivityIndicator color={selected ? '#fff' : colors.gray400} size="small" />
            : <Text style={[s.footerBtnText, !selected && s.footerBtnTextOff]}>NEXT</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#fff' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 14 },
  backBtn:         { width: 40, alignItems: 'flex-start' },
  headerTitle:     { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  divider:         { height: 1, backgroundColor: colors.gray100 },
  subtitle:        { fontSize: typography.sm, color: colors.gray700, paddingHorizontal: spacing[4], paddingVertical: 14, fontFamily: 'Poppins-Regular' },
  subtitleBold:    { fontFamily: 'Poppins-Medium', color: colors.gray900 },
  bizRow:          { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: spacing[4], paddingVertical: 18 },
  radio:           { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive:     { borderColor: colors.blue },
  radioDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  bizName:         { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  bizRole:         { fontSize: typography.sm, color: colors.gray400, marginTop: 2, fontFamily: 'Poppins-Regular' },
  empty:           { alignItems: 'center', paddingTop: 60 },
  emptyText:       { fontSize: typography.base, color: colors.gray400, textAlign: 'center', paddingHorizontal: 24, fontFamily: 'Poppins-Regular' },
  footer:          { padding: spacing[4], paddingBottom: 28, borderTopWidth: 1, borderTopColor: colors.gray100 },
  footerBtn:       { backgroundColor: colors.blue, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  footerBtnOff:    { backgroundColor: colors.gray100 },
  footerBtnText:   { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.base, letterSpacing: 0.5 },
  footerBtnTextOff:{ color: colors.gray400, fontFamily: 'Poppins-Regular' } });
