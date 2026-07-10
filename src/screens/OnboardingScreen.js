import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

const CATEGORIES = ['Retail', 'Wholesale', 'Manufacturing', 'Services', 'Food & Beverage', 'Healthcare', 'Education', 'Real Estate', 'Other'];
const TYPES      = ['Proprietorship', 'Partnership', 'Private Limited', 'LLP', 'HUF', 'Other'];

export default function OnboardingScreen({ navigation }) {
  const { addBusiness } = useApp();
  const [step, setStep]           = useState(1); // 1, 2, 3
  const [name, setName]           = useState('');
  const [bizName, setBizName]     = useState('');
  const [category, setCategory]   = useState('');
  const [bizType, setBizType]     = useState('');
  const [saving, setSaving]       = useState(false);

  const handleFinish = async () => {
    if (!bizName.trim()) { Alert.alert('Required', 'Enter your business name'); return; }
    setSaving(true);
    try {
      await addBusiness(bizName.trim(), category, bizType);
      // Navigate to Main and clear Onboarding from the stack so back-button can't return here
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          <View style={s.logoIcon}><Text style={s.logoLetter}>C</Text></View>
          <Text style={s.logoText}>CASHBOOK</Text>
        </View>
        {/* Progress dots */}
        <View style={s.dots}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[s.dot, step >= i && s.dotActive]} />
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={s.card}>
            <Text style={s.stepLabel}>Step 1 of 3</Text>
            <Text style={s.title}>What's your name?</Text>
            <Text style={s.subtitle}>This helps us personalise your experience</Text>
            <TextInput
              style={s.input}
              placeholder="Your full name"
              placeholderTextColor={colors.gray400}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoFocus
            />
            <Text style={s.title2}>Business Name</Text>
            <TextInput
              style={s.input}
              placeholder="e.g. My Shop, ABC Traders"
              placeholderTextColor={colors.gray400}
              value={bizName}
              onChangeText={setBizName}
            />
            <TouchableOpacity
              style={[s.btn, !bizName.trim() && s.btnDisabled]}
              onPress={() => { if (bizName.trim()) setStep(2); }}
              disabled={!bizName.trim()}
            >
              <Text style={s.btnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={s.card}>
            <Text style={s.stepLabel}>Step 2 of 3</Text>
            <Text style={s.title}>Business Category</Text>
            <Text style={s.subtitle}>Select the category that best describes your business</Text>
            <View style={s.grid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[s.chip, category === c && s.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[s.chipText, category === c && s.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.navRow}>
              <TouchableOpacity style={s.outlineBtn} onPress={() => setStep(1)}>
                <Text style={s.outlineBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnFlex]} onPress={() => setStep(3)}>
                <Text style={s.btnText}>Continue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={s.card}>
            <Text style={s.stepLabel}>Step 3 of 3</Text>
            <Text style={s.title}>Business Type</Text>
            <Text style={s.subtitle}>How is your business registered?</Text>
            <View style={s.grid}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[s.chip, bizType === t && s.chipActive]}
                  onPress={() => setBizType(t)}
                >
                  <Text style={[s.chipText, bizType === t && s.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.navRow}>
              <TouchableOpacity style={s.outlineBtn} onPress={() => setStep(2)}>
                <Text style={s.outlineBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, s.btnFlex, saving && s.btnDisabled]} onPress={handleFinish} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Set Up Business ✓</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.blueLight },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing[4] },
  logoRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoIcon:    { width: 30, height: 30, borderRadius: 7, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  logoLetter:  { color: '#fff', fontSize: 17, fontFamily: 'Poppins-Medium' },
  logoText:    { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.blue, letterSpacing: 1 },
  dots:        { flexDirection: 'row', gap: 6 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.gray300 },
  dotActive:   { backgroundColor: colors.blue, width: 20 },
  scroll:      { flexGrow: 1, padding: spacing[5], justifyContent: 'center' },
  card:        { backgroundColor: '#fff', borderRadius: radius['2xl'], padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  stepLabel:   { fontSize: typography.sm, color: colors.blue, fontFamily: 'Poppins-Medium', marginBottom: 6 },
  title:       { fontSize: typography['3xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 4 },
  title2:      { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray700, marginBottom: 6, marginTop: 16 },
  subtitle:    { fontSize: typography.base, color: colors.gray500, marginBottom: 24, fontFamily: 'Poppins-Regular' },
  input:       { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.md, color: colors.gray900, marginBottom: 8, fontFamily: 'Poppins-Regular' },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.gray200, backgroundColor: '#fff' },
  chipActive:  { borderColor: colors.blue, backgroundColor: colors.blueLight },
  chipText:    { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  chipTextActive: { color: colors.blue, fontFamily: 'Poppins-Medium' },
  navRow:      { flexDirection: 'row', gap: 10 },
  btn:         { backgroundColor: colors.blue, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  btnFlex:     { flex: 1 },
  btnDisabled: { opacity: 0.4 },
  btnText:     { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium' },
  outlineBtn:  { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  outlineBtnText: { color: colors.gray600, fontSize: typography.md, fontFamily: 'Poppins-Medium' } });
