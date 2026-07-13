import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { colors, typography, radius, spacing } from '../theme';
import * as api from '../api';
import BusinessCategoryGrid from '../components/BusinessCategoryGrid';
import BusinessTypeList from '../components/BusinessTypeList';

// First-run onboarding for a brand-new user.
// Step 1: name + business name  →  Step 2: category  →  Step 3: type  →  create.
// Steps 2 & 3 reuse the exact same pickers as the AddBusiness wizard.
export default function OnboardingScreen({ navigation }) {
  const { addBusiness, setCurrentBusinessId } = useApp();
  const { updateUser } = useAuth();

  const [step, setStep]         = useState(1); // 1 = name, 2 = category, 3 = type
  const [name, setName]         = useState('');
  const [bizName, setBizName]   = useState('');
  const [category, setCategory] = useState('');
  const [bizType, setBizType]   = useState('');
  const [saving, setSaving]     = useState(false);

  const goHome = () => {
    if (navigation.canGoBack()) navigation.goBack();       // return to Cashbooks
    else navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const handleFinish = async () => {
    if (!bizName.trim()) { setStep(1); return; }
    setSaving(true);
    try {
      const trimmedName = name.trim();
      if (trimmedName) {
        // Persist the user's name — non-fatal if it fails
        try { await api.updateMe({ name: trimmedName }); updateUser({ name: trimmedName }); } catch { /* ignore */ }
      }
      const newId = await addBusiness(bizName.trim(), category, bizType);
      if (newId) setCurrentBusinessId(newId);
      goHome();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create business');
    } finally {
      setSaving(false);
    }
  };

  // ── Step 1: name + business name (image 1) ──
  if (step === 1) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.logoIcon}><Text style={s.logoLetter}>C</Text></View>
            <Text style={s.logoText}>CASHBOOK</Text>
          </View>
          <View style={s.dots}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[s.dot, step >= i && s.dotActive]} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
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
              onSubmitEditing={() => { if (bizName.trim()) setStep(2); }}
            />
            <TouchableOpacity
              style={[s.btn, !bizName.trim() && s.btnDisabled]}
              onPress={() => { if (bizName.trim()) setStep(2); }}
              disabled={!bizName.trim()}
            >
              <Text style={s.btnText}>Continue →</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Steps 2 & 3: category / type picker (same flow as AddBusiness) ──
  const isType = step === 3;
  return (
    <SafeAreaView style={fs.container} edges={['top']}>
      <View style={fs.header}>
        <TouchableOpacity onPress={() => setStep(step - 1)} style={fs.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={fs.headerTitle} />
        <TouchableOpacity
          onPress={() => (isType ? handleFinish() : setStep(3))}
          style={fs.skipBtn}
        >
          <Text style={fs.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      <View style={fs.titleBlock}>
        <Text style={fs.bigTitle}>{isType ? 'Select Business Type' : 'Select Business Category'}</Text>
        <Text style={fs.bigSubtitle}>This will help us personalise your app experience</Text>
      </View>

      {isType
        ? <BusinessTypeList selected={bizType} onSelect={setBizType} />
        : <BusinessCategoryGrid selected={category} onSelect={setCategory} />}

      <View style={fs.footer}>
        <View style={fs.stepInfoRow}>
          <Text style={fs.stepInfoText}>Business Setup: <Text style={fs.stepInfoBold}>Step {step}/3</Text></Text>
        </View>
        {isType ? (
          <TouchableOpacity
            style={[fs.primaryBtn, saving && fs.primaryBtnDisabled]}
            disabled={saving}
            onPress={handleFinish}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={fs.primaryBtnText}>DONE</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[fs.primaryBtn, !category && fs.primaryBtnDisabled]}
            disabled={!category}
            onPress={() => setStep(3)}
          >
            <Text style={[fs.primaryBtnText, !category && fs.primaryBtnTextDisabled]}>NEXT</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// Step 1 (card) styles
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
  btn:         { backgroundColor: colors.blue, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnDisabled: { opacity: 0.4 },
  btnText:     { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium' },
});

// Steps 2/3 (full-screen picker) styles — matches the AddBusiness wizard
const fs = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1 },
  skipBtn: { width: 40, alignItems: 'flex-end', paddingVertical: 4 },
  skipText: { fontSize: typography.sm, fontFamily: 'Poppins-SemiBold', color: colors.gray500, letterSpacing: 0.5 },
  titleBlock: { paddingHorizontal: spacing[4], paddingTop: 24, paddingBottom: 8, alignItems: 'center', backgroundColor: '#f9f9f9' },
  bigTitle: { fontSize: typography['4xl'], fontFamily: 'Poppins-SemiBold', color: colors.gray900, textAlign: 'center' },
  bigSubtitle: { fontSize: typography.base, color: colors.gray500, fontFamily: 'Poppins-Regular', textAlign: 'center', marginTop: 6 },
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.gray100 },
  stepInfoRow: { backgroundColor: '#f0f0f0', paddingHorizontal: spacing[4], paddingVertical: 10 },
  stepInfoText: { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  stepInfoBold: { color: colors.gray900, fontFamily: 'Poppins-SemiBold' },
  primaryBtn: { backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing[4], marginTop: 12, marginBottom: spacing[4] },
  primaryBtnDisabled: { backgroundColor: '#d5d5d5' },
  primaryBtnText: { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-SemiBold', letterSpacing: 0.5 },
  primaryBtnTextDisabled: { color: '#999' },
});
