import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, typography, spacing, radius } from '../theme';

const DUPE_SETTINGS = [
  { key: 'membersRoles',  label: 'Members & Roles' },
  { key: 'categories',    label: 'Categories' },
  { key: 'paymentModes',  label: 'Payment Modes' },
  { key: 'partySettings', label: 'Party Settings' },
  { key: 'customFields',  label: 'Custom fields' },
];

export default function DuplicateBookScreen({ navigation, route }) {
  const { book } = route.params;
  const { addCashbook } = useApp();
  const [newName, setNewName]   = useState('');
  const [settings, setSettings] = useState({
    membersRoles: true, categories: true, paymentModes: true,
    partySettings: true, customFields: true });
  const [saving, setSaving] = useState(false);

  const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
  const canSubmit = newName.trim().length > 0;

  const handleAdd = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await addCashbook(newName.trim());
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.gray700} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Duplicate Book</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <View style={s.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#4F60F0" style={{ marginTop: 1 }} />
          <Text style={s.infoText}>
            Create new book with same settings as{' '}
            <Text style={{ fontFamily: 'Poppins-Medium' }}>{book.name}</Text>
          </Text>
        </View>

        <Text style={s.stepTitle}>Step 1: Choose New Book Name</Text>
        <TextInput
          style={s.nameInput}
          placeholder="Enter New Book Name"
          placeholderTextColor={colors.gray300}
          value={newName}
          onChangeText={setNewName}
          returnKeyType="done"
        />

        <Text style={s.stepTitle}>Step 2: Choose settings to duplicate</Text>
        {DUPE_SETTINGS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={s.checkRow}
            onPress={() => toggle(item.key)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, settings[item.key] && s.checkboxOn]}>
              {settings[item.key] && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={s.checkLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={[s.footerBtn, !canSubmit && s.footerBtnOff]}
          onPress={handleAdd}
          disabled={!canSubmit || saving}
        >
          {saving
            ? <ActivityIndicator color={canSubmit ? '#fff' : colors.gray400} size="small" />
            : <Text style={[s.footerBtnText, !canSubmit && s.footerBtnTextOff]}>ADD NEW BOOK</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#fff' },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn:         { width: 40, alignItems: 'flex-start' },
  headerTitle:     { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  body:            { padding: spacing[4], paddingBottom: 32 },
  infoBanner:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#EEEEFF', borderRadius: 10, padding: 14, marginBottom: 24 },
  infoText:        { flex: 1, fontSize: typography.sm, color: colors.gray700, lineHeight: 20, fontFamily: 'Poppins-Regular' },
  stepTitle:       { fontSize: typography.lg, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 14, marginTop: 4 },
  nameInput:       { borderWidth: 1, borderColor: colors.gray200, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, fontSize: typography.md, color: colors.gray900, marginBottom: 28, fontFamily: 'Poppins-Regular' },
  checkRow:        { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#F3F4FF', borderRadius: 10, padding: 16, marginBottom: 10 },
  checkbox:        { width: 26, height: 26, borderRadius: 6, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxOn:      { backgroundColor: '#4F60F0', borderColor: '#4F60F0' },
  checkLabel:      { fontSize: typography.md, color: colors.gray800, fontFamily: 'Poppins-Regular' },
  footer:          { padding: spacing[4], paddingBottom: 28, borderTopWidth: 1, borderTopColor: colors.gray100 },
  footerBtn:       { backgroundColor: colors.blue, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  footerBtnOff:    { backgroundColor: colors.gray100 },
  footerBtnText:   { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.base, letterSpacing: 0.5 },
  footerBtnTextOff:{ color: colors.gray400, fontFamily: 'Poppins-Regular' } });
