import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sendOtp, verifyOtp } from '../api';
import { useAuth } from '../context/AuthContext';
import { colors, typography, radius, spacing } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [step, setStep]     = useState('input');  // 'input' | 'otp'
  const [mode, setMode]     = useState('email');  // 'email' | 'mobile'
  const [value, setValue]   = useState('');
  const [otp, setOtp]       = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef([]);

  const isEmail = mode === 'email';

  const handleSendOtp = async () => {
    const trimmed = value.trim();
    if (!trimmed) { Alert.alert('Required', `Enter your ${isEmail ? 'email address' : 'mobile number'}`); return; }
    setLoading(true);
    try {
      await sendOtp(isEmail ? { email: trimmed } : { mobile: trimmed });
      setStep('otp');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpStr = otp.join('');
    if (otpStr.length < 6) { Alert.alert('Required', 'Enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      const data = await verifyOtp(
        isEmail ? { email: value.trim(), otp: otpStr } : { mobile: value.trim(), otp: otpStr }
      );
      login(data.user);
    } catch (err) {
      Alert.alert('Invalid OTP', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/\D/g, '').slice(-1);
    setOtp(newOtp);
    if (text && index < 5) otpRefs.current[index + 1]?.focus();
    if (!text && index > 0) otpRefs.current[index - 1]?.focus();
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={s.logoRow}>
            <View style={s.logoIcon}><Text style={s.logoLetter}>C</Text></View>
            <Text style={s.logoText}>CASHBOOK</Text>
          </View>

          <Text style={s.headline}>Business Expense Management</Text>

          {step === 'input' ? (
            <View style={s.card}>
              <Text style={s.cardTitle}>Sign in to CashBook</Text>
              <Text style={s.cardSubtitle}>Enter your {isEmail ? 'email' : 'mobile number'} to receive an OTP</Text>

              {/* Mode toggle */}
              <View style={s.modeRow}>
                <TouchableOpacity style={[s.modeBtn, mode === 'email' && s.modeBtnActive]} onPress={() => { setMode('email'); setValue(''); }}>
                  <Text style={[s.modeBtnText, mode === 'email' && s.modeBtnTextActive]}>Email</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.modeBtn, mode === 'mobile' && s.modeBtnActive]} onPress={() => { setMode('mobile'); setValue(''); }}>
                  <Text style={[s.modeBtnText, mode === 'mobile' && s.modeBtnTextActive]}>Mobile</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.label}>{isEmail ? 'Email Address' : 'Mobile Number'}</Text>
              <TextInput
                style={s.input}
                placeholder={isEmail ? 'you@example.com' : '+91 9876543210'}
                placeholderTextColor={colors.gray400}
                value={value}
                onChangeText={setValue}
                keyboardType={isEmail ? 'email-address' : 'phone-pad'}
                autoCapitalize="none"
                autoComplete={isEmail ? 'email' : 'tel'}
              />

              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSendOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Send OTP</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.card}>
              <TouchableOpacity style={s.backRow} onPress={() => { setStep('input'); setOtp(['','','','','','']); }}>
                <Ionicons name="arrow-back" size={18} color={colors.blue} />
                <Text style={s.backText}>Change {isEmail ? 'email' : 'number'}</Text>
              </TouchableOpacity>

              <Text style={s.cardTitle}>Enter OTP</Text>
              <Text style={s.cardSubtitle}>We sent a 6-digit code to <Text style={{ fontFamily: 'Poppins-Medium' }}>{value}</Text></Text>

              <View style={s.otpRow}>
                {otp.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => otpRefs.current[i] = r}
                    style={[s.otpBox, digit && s.otpBoxFilled]}
                    value={digit}
                    onChangeText={(t) => handleOtpChange(t, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleVerifyOtp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.btnText}>Verify OTP</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={s.resendRow} onPress={handleSendOtp}>
                <Text style={s.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: colors.blueLight },
  scroll:        { flexGrow: 1, justifyContent: 'center', padding: spacing[5] },
  logoRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, justifyContent: 'center' },
  logoIcon:      { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  logoLetter:    { color: '#fff', fontSize: 20, fontFamily: 'Poppins-Medium' },
  logoText:      { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.blue, letterSpacing: 1 },
  headline:      { textAlign: 'center', color: colors.gray500, fontSize: typography.sm, marginBottom: 28, fontFamily: 'Poppins-Regular' },
  card:          { backgroundColor: '#fff', borderRadius: radius['2xl'], padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardTitle:     { fontSize: typography['3xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 4 },
  cardSubtitle:  { fontSize: typography.base, color: colors.gray500, marginBottom: 24, fontFamily: 'Poppins-Regular' },
  modeRow:       { flexDirection: 'row', backgroundColor: colors.gray100, borderRadius: radius.lg, padding: 3, marginBottom: 20 },
  modeBtn:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radius.md },
  modeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  modeBtnText:   { fontSize: typography.base, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  modeBtnTextActive: { color: colors.gray900, fontFamily: 'Poppins-Medium' },
  label:         { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray700, marginBottom: 6 },
  input:         { borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.md, color: colors.gray900, marginBottom: 20, fontFamily: 'Poppins-Regular' },
  btn:           { backgroundColor: colors.blue, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  btnDisabled:   { opacity: 0.6 },
  btnText:       { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium' },
  backRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText:      { color: colors.blue, fontSize: typography.base, fontFamily: 'Poppins-Medium' },
  otpRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  otpBox:        { width: 46, height: 54, borderWidth: 1.5, borderColor: colors.gray200, borderRadius: radius.lg, fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  otpBoxFilled:  { borderColor: colors.blue, backgroundColor: colors.blueLight },
  resendRow:     { alignItems: 'center', marginTop: 16 },
  resendText:    { color: colors.blue, fontSize: typography.base, fontFamily: 'Poppins-Medium' } });
