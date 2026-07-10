import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

const OPTIONAL_COLUMNS = [
  { key: 'balance',      label: 'Balance' },
  { key: 'remark',       label: 'Remark' },
  { key: 'party_name',   label: 'Party Name' },
  { key: 'member',       label: 'Member' },
  { key: 'category',     label: 'Category' },
  { key: 'payment_mode', label: 'Payment Mode' },
  { key: 'time',         label: 'Time' },
];

const COMPULSORY_COLUMNS = [
  { key: 'date',     label: 'Date' },
  { key: 'cash_in',  label: 'Cash In' },
  { key: 'cash_out', label: 'Cash Out' },
];

const DEFAULT_CHECKED = new Set(['balance', 'remark', 'party_name', 'member', 'category', 'payment_mode']);

export default function PDFSettingsScreen({ route, navigation }) {
  const { currentBusiness } = useApp();
  const [checked, setChecked] = useState(new Set(DEFAULT_CHECKED));

  const toggle = (key) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSave = () => {
    Alert.alert('Saved', 'PDF column settings have been saved.');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>PDF Settings</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Business Identity */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Business Identity</Text>
          <Text style={s.sectionSubtitle}>Tap below to update your logo/name in settings</Text>
          <TouchableOpacity style={s.bizCard} onPress={() => navigation.navigate('Settings')}>
            <View style={s.bizIcon}>
              <Ionicons name="business" size={28} color={colors.blue} />
            </View>
            <Text style={s.bizName}>{currentBusiness?.name || 'My Business'}</Text>
          </TouchableOpacity>
        </View>

        {/* Column selection */}
        <View style={s.section}>
          <Text style={s.colTitle}>
            Select columns you wish to include in{' '}
            <Text style={s.colTitleAccent}>`All Entries Report`</Text>
          </Text>

          {/* Optional columns */}
          {OPTIONAL_COLUMNS.map((col) => {
            const isChecked = checked.has(col.key);
            return (
              <TouchableOpacity
                key={col.key}
                style={[s.colRow, isChecked ? s.colRowChecked : s.colRowUnchecked]}
                onPress={() => toggle(col.key)}
              >
                <View style={[s.checkbox, isChecked && s.checkboxActive]}>
                  {isChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={[s.colLabel, isChecked && s.colLabelActive]}>{col.label}</Text>
              </TouchableOpacity>
            );
          })}

          {/* Compulsory columns */}
          {COMPULSORY_COLUMNS.map((col) => (
            <View key={col.key} style={[s.colRow, s.colRowCompulsory]}>
              <View style={[s.checkbox, s.checkboxCompulsory]}>
                <Ionicons name="checkmark" size={14} color={colors.gray400} />
              </View>
              <Text style={s.colLabel}>{col.label}</Text>
              <Text style={s.compulsoryLabel}>Compulsory</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={s.bottomBar}>
        <TouchableOpacity style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveText}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: '#fff' },
  header:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBtn:            { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:        { flex: 1, textAlign: 'center', fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  section:            { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[2] },
  sectionTitle:       { fontSize: typography.lg, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 4 },
  sectionSubtitle:    { fontSize: typography.sm, color: colors.gray500, marginBottom: 14, fontFamily: 'Poppins-Regular' },
  bizCard:            { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.xl },
  bizIcon:            { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  bizName:            { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  colTitle:           { fontSize: typography.sm, color: colors.gray700, marginBottom: 14, lineHeight: 20, fontFamily: 'Poppins-Regular' },
  colTitleAccent:     { color: colors.gray900, fontFamily: 'Poppins-Medium' },
  colRow:             { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, paddingHorizontal: 14, borderRadius: radius.xl, marginBottom: 6 },
  colRowChecked:      { backgroundColor: '#EEEEFF' },
  colRowUnchecked:    { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.gray200 },
  colRowCompulsory:   { backgroundColor: colors.gray100, borderWidth: 0 },
  checkbox:           { width: 24, height: 24, borderRadius: 5, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxActive:     { backgroundColor: colors.blue, borderColor: colors.blue },
  checkboxCompulsory: { backgroundColor: colors.gray300, borderColor: colors.gray300 },
  colLabel:           { flex: 1, fontSize: typography.md, color: colors.gray800, fontFamily: 'Poppins-Regular' },
  colLabelActive:     { color: colors.gray900, fontFamily: 'Poppins-Medium' },
  compulsoryLabel:    { fontSize: typography.sm, color: colors.gray400, fontFamily: 'Poppins-Regular' },
  bottomBar:          { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.gray100, padding: 12 },
  saveBtn:            { backgroundColor: colors.blue, borderRadius: radius.xl, paddingVertical: 18, alignItems: 'center' },
  saveText:           { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium', letterSpacing: 0.5 } });
