import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, typography, spacing, radius } from '../theme';
import BusinessCategoryGrid from '../components/BusinessCategoryGrid';
import BusinessTypeList from '../components/BusinessTypeList';

// Multi-step "Add New Business" wizard.
// Step 1: Business name  →  Step 2: Category  →  Step 3: Type  →  create.
// Reuses the same category/type options & card design as BusinessProfileScreen.
export default function AddBusinessScreen({ navigation }) {
  const { addBusiness, setCurrentBusinessId } = useApp();

  const [step, setStep]         = useState(1); // 1 = name, 2 = category, 3 = type
  const [bizName, setBizName]   = useState('');
  const [category, setCategory] = useState('');
  const [bizType, setBizType]   = useState('');
  const [saving, setSaving]     = useState(false);

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  const handleSkip = () => {
    if (step === 2) setStep(3);
    else if (step === 3) handleCreate();
  };

  const handleCreate = async () => {
    if (saving) return;
    if (!bizName.trim()) { setStep(1); return; }
    setSaving(true);
    try {
      const newId = await addBusiness(bizName.trim(), category, bizType);
      if (newId) setCurrentBusinessId(newId); // switch to the freshly created business
      navigation.goBack();                    // return to Cashbooks (tab state preserved)
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create business');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={handleBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{step === 1 ? 'Add Business Name' : ''}</Text>
        {step > 1 ? (
          <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
            <Text style={s.skipText}>SKIP</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Step 1: Business Name ── */}
        {step === 1 && (
          <View style={s.nameStep}>
            <View style={s.floatingInputContainer}>
              <Text style={s.floatingLabel}>Business Name</Text>
              <TextInput
                style={s.floatingInput}
                value={bizName}
                onChangeText={setBizName}
                autoFocus
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => { if (bizName.trim()) setStep(2); }}
              />
            </View>
          </View>
        )}

        {/* ── Step 2: Business Category ── */}
        {step === 2 && (
          <>
            <View style={s.titleBlock}>
              <Text style={s.bigTitle}>Select Business Category</Text>
              <Text style={s.bigSubtitle}>This will help us personalise your app experience</Text>
            </View>
            <BusinessCategoryGrid selected={category} onSelect={setCategory} />
          </>
        )}

        {/* ── Step 3: Business Type ── */}
        {step === 3 && (
          <>
            <View style={s.titleBlock}>
              <Text style={s.bigTitle}>Select Business Type</Text>
              <Text style={s.bigSubtitle}>This will help us personalise your app experience</Text>
            </View>
            <BusinessTypeList selected={bizType} onSelect={setBizType} />
          </>
        )}

        {/* ── Footer (step indicator + primary button) ── */}
        <View style={s.footer}>
          {step > 1 && (
            <View style={s.stepInfoRow}>
              <Text style={s.stepInfoText}>
                Business Setup: <Text style={s.stepInfoBold}>Step {step}/3</Text>
              </Text>
            </View>
          )}

          {step === 1 && (
            <TouchableOpacity
              style={[s.primaryBtn, !bizName.trim() && s.primaryBtnDisabled]}
              disabled={!bizName.trim()}
              onPress={() => setStep(2)}
            >
              <Text style={[s.primaryBtnText, !bizName.trim() && s.primaryBtnTextDisabled]}>NEXT</Text>
            </TouchableOpacity>
          )}

          {step === 2 && (
            <TouchableOpacity
              style={[s.primaryBtn, !category && s.primaryBtnDisabled]}
              disabled={!category}
              onPress={() => setStep(3)}
            >
              <Text style={[s.primaryBtnText, !category && s.primaryBtnTextDisabled]}>NEXT</Text>
            </TouchableOpacity>
          )}

          {step === 3 && (
            <TouchableOpacity
              style={[s.primaryBtn, saving && s.primaryBtnDisabled]}
              disabled={saving}
              onPress={handleCreate}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.primaryBtnText}>DONE</Text>}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: typography.lg, fontFamily: 'Poppins-SemiBold', color: colors.gray900 },
  skipBtn: { width: 40, alignItems: 'flex-end', paddingVertical: 4 },
  skipText: { fontSize: typography.sm, fontFamily: 'Poppins-SemiBold', color: colors.gray500, letterSpacing: 0.5 },

  // Step 1 — name
  nameStep: { paddingHorizontal: spacing[4], paddingTop: 24, backgroundColor: '#fff', flex: 1 },
  floatingInputContainer: { borderWidth: 1.5, borderColor: colors.blue, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 14, marginTop: 8, position: 'relative' },
  floatingLabel: { position: 'absolute', top: -10, left: 12, backgroundColor: '#fff', paddingHorizontal: 4, fontSize: typography.xs, color: colors.blue, fontFamily: 'Poppins-Regular' },
  floatingInput: { fontSize: typography.base, fontFamily: 'Poppins-Regular', color: colors.gray900, padding: 0 },

  // Steps 2/3 — titles
  titleBlock: { paddingHorizontal: spacing[4], paddingTop: 24, paddingBottom: 8, alignItems: 'center', backgroundColor: '#f9f9f9' },
  bigTitle: { fontSize: typography['4xl'], fontFamily: 'Poppins-SemiBold', color: colors.gray900, textAlign: 'center' },
  bigSubtitle: { fontSize: typography.base, color: colors.gray500, fontFamily: 'Poppins-Regular', textAlign: 'center', marginTop: 6 },

  // Footer
  footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.gray100 },
  stepInfoRow: { backgroundColor: '#f0f0f0', paddingHorizontal: spacing[4], paddingVertical: 10 },
  stepInfoText: { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  stepInfoBold: { color: colors.gray900, fontFamily: 'Poppins-SemiBold' },
  primaryBtn: { backgroundColor: colors.blue, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing[4], marginTop: 12, marginBottom: spacing[4] },
  primaryBtnDisabled: { backgroundColor: '#d5d5d5' },
  primaryBtnText: { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-SemiBold', letterSpacing: 0.5 },
  primaryBtnTextDisabled: { color: '#999' },
});
