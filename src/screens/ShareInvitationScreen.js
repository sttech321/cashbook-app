import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Clipboard, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '../theme';

const AVATAR_COLORS = ['#00838F', '#9C27B0', '#E91E63', '#1565C0', '#2E7D32', '#E65100', '#C62828', '#4527A0'];
function avatarBg(name) {
  return AVATAR_COLORS[(name || 'U').charCodeAt(0) % AVATAR_COLORS.length];
}

export default function ShareInvitationScreen({ navigation, route }) {
  const { invitation } = route.params;
  
  const link = `https://app.cashbook.in/CASHBB/${invitation.token}`;
  
  const handleCopy = () => {
    Clipboard.setString(link);
    Alert.alert('Copied', 'Invitation link copied to clipboard.');
  };

  const handleShareOthers = () => {
    Alert.alert('Share', `Sharing link: ${link}`);
  };

  const contactDisplay = invitation.mobile || invitation.email || '';

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ width: 60 }} />
        <Text style={s.title}>Share Invitation Link</Text>
        <TouchableOpacity style={s.doneBtn} onPress={() => navigation.pop(2)}>
          <Text style={s.doneText}>DONE</Text>
        </TouchableOpacity>
      </View>
      <View style={s.divider} />

      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.instructionText}>
          Share invite link with contact and ask them to signup on CashBook
        </Text>

        {/* Member Card */}
        <View style={s.memberCard}>
          <View style={s.cardAccent} />
          <View style={s.cardInner}>
            <View style={[s.avatar, { backgroundColor: avatarBg(invitation.name) }]}>
              <Text style={s.avatarText}>{(invitation.name || 'U')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.memberName}>{invitation.name}</Text>
              <Text style={s.memberContact}>{contactDisplay}</Text>
            </View>
            <View style={s.roleBadge}>
              <Text style={s.roleText}>{invitation.role}</Text>
            </View>
          </View>
        </View>

        <Text style={s.sectionSubtitle}>Unique Invite Link for Business Book</Text>

        {/* Link Box */}
        <View style={s.linkBox}>
          <View style={s.linkIconWrap}>
            <Ionicons name="link" size={16} color="#fff" />
          </View>
          <Text style={s.linkText} numberOfLines={1} ellipsizeMode="tail">{link}</Text>
          <TouchableOpacity onPress={handleCopy} style={s.copyBtn}>
            <Ionicons name="copy-outline" size={20} color={colors.blue} />
          </TouchableOpacity>
        </View>

        {/* Secure Note */}
        <View style={s.secureBox}>
          <Ionicons name="checkmark-circle" size={22} color="#10B981" />
          <Text style={s.secureText}>
            This link is 100% secure. Only {invitation.name} can access this book by logging in with their {invitation.mobile ? 'mobile number' : 'email'} {contactDisplay}.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={s.footer}>
        <TouchableOpacity style={s.shareOthersBtn} onPress={handleShareOthers}>
          <Text style={s.shareOthersText}>SHARE ON OTHERS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 16 },
  title: { fontSize: typography.lg, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  doneBtn: { width: 60, alignItems: 'flex-end' },
  doneText: { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.blue },
  divider: { height: 1, backgroundColor: colors.gray100 },
  content: { padding: spacing[4] },
  instructionText: { fontSize: typography.sm, color: colors.gray600, marginBottom: 16, lineHeight: 20, fontFamily: 'Poppins-Regular' },
  memberCard: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: colors.gray200, overflow: 'hidden', marginBottom: 24 },
  cardAccent: { width: 4, backgroundColor: colors.blue },
  cardInner: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: typography.xl, fontFamily: 'Poppins-Medium' },
  memberName: { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  memberContact: { fontSize: typography.xs, color: colors.gray500, marginTop: 2, fontFamily: 'Poppins-Regular' },
  roleBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  roleText: { fontSize: 10, fontFamily: 'Poppins-Medium', color: colors.gray700 },
  sectionSubtitle: { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 12 },
  linkBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 8, padding: 12, marginBottom: 16 },
  linkIconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  linkText: { flex: 1, fontSize: typography.sm, color: colors.gray800, fontFamily: 'Poppins-Regular' },
  copyBtn: { padding: 4, marginLeft: 8 },
  secureBox: { flexDirection: 'row', backgroundColor: '#ECFDF5', borderRadius: 8, padding: 16, gap: 12 },
  secureText: { flex: 1, fontSize: typography.sm, color: colors.gray800, lineHeight: 20, fontFamily: 'Poppins-Regular' },
  footer: { padding: spacing[4], paddingBottom: 24 },
  shareOthersBtn: { borderWidth: 1.5, borderColor: colors.blue, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  shareOthersText: { color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 },
  shareWaBtn: { flexDirection: 'row', backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  shareWaText: { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 } });
