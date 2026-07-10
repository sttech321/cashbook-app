import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';

const FEATURES = [
  { icon: 'people-outline', label: 'Recharge\nEmployee Wallets' },
  { icon: 'notifications-outline', label: 'Get notified of\nexpenses' },
  { icon: 'options-outline', label: 'Set limits on\nwallets' },
];

export default function PaymentsScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.callBtn}>
          <Ionicons name="call-outline" size={16} color={colors.blue} />
          <Text style={s.callText}>CALL US</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero title */}
        <View style={s.titleBox}>
          <Text style={s.heroTitle}>Manage Business Expenses with</Text>
          <View style={s.heroTitleRow}>
            <Text style={s.heroBlue}>CashBook UPI </Text>
            <Ionicons name="flame" size={22} color="#FF8C00" />
          </View>
        </View>

        {/* Phone mockup placeholder */}
        <View style={s.phoneMock}>
          <View style={s.phoneBg}>
            <Ionicons name="phone-portrait-outline" size={60} color={colors.gray300} />
            <Ionicons name="qr-code-outline" size={64} color={colors.gray300} />
            <Text style={s.phoneMockText}>Scan QR to Pay</Text>
          </View>
        </View>

        {/* Features */}
        <View style={s.features}>
          {FEATURES.map((f) => (
            <View key={f.label} style={s.featureItem}>
              <View style={s.featureIcon}>
                <Ionicons name={f.icon} size={22} color={colors.blue} />
              </View>
              <Text style={s.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Warning */}
        <Text style={s.warning}>
          You can enable CashBook UPI in only 1 Business
        </Text>

        {/* Buttons */}
        <View style={s.btnGroup}>
          <TouchableOpacity style={s.primaryBtn}>
            <Text style={s.primaryBtnText}>ACTIVATE PAYMENTS</Text>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn}>
            <Ionicons name="play" size={16} color={colors.blue} />
            <Text style={s.outlineBtnText}>WATCH 1-MIN VIDEO</Text>
          </TouchableOpacity>
        </View>

        {/* Powered by */}
        <View style={s.poweredBy}>
          <Text style={s.poweredByText}>Powered by: </Text>
          <Text style={[s.poweredByText, { color: '#FF6600', fontFamily: 'Poppins-Medium' }]}>NPCI</Text>
          <Text style={s.poweredByText}> | </Text>
          <Text style={[s.poweredByText, { color: '#FF6600', fontFamily: 'Poppins-Medium' }]}>UPI</Text>
          <Text style={s.poweredByText}> | </Text>
          <Text style={[s.poweredByText, { fontFamily: 'Poppins-Medium' }]}>OBOPAY</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#fff' },
  topBar:       { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing[4], paddingVertical: 10 },
  callBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  callText:     { color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 },
  titleBox:     { paddingHorizontal: spacing[4], paddingTop: spacing[3], alignItems: 'center' },
  heroTitle:    { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, textAlign: 'center' },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 16 },
  heroBlue:     { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.blue },
  phoneMock:    { height: 280, marginHorizontal: spacing[4], marginBottom: 24 },
  phoneBg:      { flex: 1, backgroundColor: colors.gray100, borderRadius: 24, alignItems: 'center', justifyContent: 'center', gap: 6 },
  phoneMockText:{ fontSize: typography.sm, color: colors.gray400, marginTop: 4, fontFamily: 'Poppins-Regular' },
  features:     { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing[4], marginBottom: 16 },
  featureItem:  { alignItems: 'center', gap: 6, maxWidth: 90 },
  featureIcon:  { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  featureLabel: { fontSize: typography.sm, color: colors.gray700, textAlign: 'center', lineHeight: 16, fontFamily: 'Poppins-Regular' },
  warning:      { textAlign: 'center', color: '#D97706', fontSize: typography.base, paddingHorizontal: spacing[4], marginBottom: 20, fontFamily: 'Poppins-Regular' },
  btnGroup:     { paddingHorizontal: spacing[4], gap: 12, marginBottom: 24 },
  primaryBtn:   { backgroundColor: colors.blue, borderRadius: radius.xl, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText:{ color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.md, letterSpacing: 1 },
  outlineBtn:   { borderWidth: 1.5, borderColor: colors.blue, borderRadius: radius.xl, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outlineBtnText:{ color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.md, letterSpacing: 0.5 },
  poweredBy:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  poweredByText:{ fontSize: typography.base, color: colors.gray600, fontFamily: 'Poppins-Regular' } });
