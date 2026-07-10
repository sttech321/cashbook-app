import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ChevronRight, ChevronUp, ChevronDown, Pencil, Mail, Plus, 
  Users, ArrowRightLeft, Building2, HelpCircle, Smartphone, 
  UserCircle2, AlertTriangle, Info, LogOut, Trash2, Play, 
  ShieldCheck, CloudUpload, Camera
} from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

function AppConfirmModal({ visible, title, message, confirmText, onConfirm, onCancel, isDanger }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={m.overlay}>
        <View style={m.box}>
          <Text style={m.title}>{title}</Text>
          <Text style={m.message}>{message}</Text>
          <View style={m.actions}>
            <TouchableOpacity style={m.cancelBtn} onPress={onCancel}>
              <Text style={m.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[m.confirmBtn, isDanger && m.confirmBtnRed]}
              onPress={onConfirm}
            >
              <Text style={m.confirmText}>{confirmText || 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const m = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  box:        { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 340 },
  title:      { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 10 },
  message:    { fontSize: typography.md, color: colors.gray600, lineHeight: 22, marginBottom: 24, fontFamily: 'Poppins-Regular' },
  actions:    { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, paddingVertical: 13, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.gray200, alignItems: 'center' },
  cancelText: { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray700 },
  confirmBtn: { flex: 1, paddingVertical: 13, borderRadius: radius.xl, backgroundColor: colors.blue, alignItems: 'center' },
  confirmBtnRed: { backgroundColor: colors.red },
  confirmText:{ fontSize: typography.md, fontFamily: 'Poppins-Medium', color: '#fff' } });

function SettingRow({ Icon, iconBg, label, sublabel, onPress, badge, iconColor }) {
  return (
    <TouchableOpacity style={r.row} onPress={onPress || (() => Alert.alert('Coming Soon', 'This feature will be available soon.'))}>
      <View style={[r.iconWrap, { backgroundColor: iconBg || '#EFF6FF' }]}>
        {Icon && <Icon size={20} color={iconColor || colors.blue} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={r.label}>{label}</Text>
        {sublabel ? <Text style={r.sublabel}>{sublabel}</Text> : null}
      </View>
      {badge ? <View style={r.badge}><Text style={r.badgeText}>{badge}</Text></View> : null}
      <ChevronRight size={18} color={colors.gray300} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { currentBusiness, businesses } = useApp();
  const [upiExpanded, setUpiExpanded] = useState(false);
  const [modal, setModal] = useState(null); // { title, message, confirmText, onConfirm, isDanger }

  const displayName = user?.name || user?.email || user?.mobile || 'User';
  const hasEmail = !!user?.email;
  const bizName = currentBusiness?.name || 'Your Business';

  const displayMobile = currentBusiness?.mobile || user?.mobile || '';
  const displayEmail = currentBusiness?.email || user?.email || '';

  const checkFields = currentBusiness ? [
    currentBusiness.logo,
    currentBusiness.name,
    currentBusiness.address,
    currentBusiness.staff_size,
    currentBusiness.category,
    currentBusiness.subcategory,
    currentBusiness.business_type,
    currentBusiness.registration_type,
    currentBusiness.gstin,
    displayMobile,
    displayEmail
  ] : [];
  
  const filledCount = checkFields.filter(f => !!f && f !== '🏢').length;
  const totalCount = checkFields.length || 1;
  const strengthPct = Math.round((filledCount / totalCount) * 100);
  
  let strengthLevel = 'Low';
  let strengthColor = colors.red;
  if (strengthPct > 40 && strengthPct <= 80) { strengthLevel = 'Medium'; strengthColor = colors.orange; }
  else if (strengthPct > 80) { strengthLevel = 'High'; strengthColor = colors.green; }

  const confirmLogout = () => {
    setModal({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log Out',
      isDanger: true,
      onConfirm: () => { setModal(null); logout(); } });
  };

  const confirmDelete = () => {
    setModal({
      title: 'Delete Account',
      message: 'All your data will be permanently deleted. This cannot be undone.',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        setModal(null);
        setModal({
          title: 'Request Sent',
          message: 'Account deletion request has been submitted.',
          confirmText: 'OK',
          isDanger: false,
          onConfirm: () => setModal(null) });
      } });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <Text style={s.pageTitle}>Settings</Text>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Business Section (Hidden if no business) */}
        {currentBusiness && (
          <>
            {/* Business card */}
            <View style={s.bizCard}>
              <TouchableOpacity style={s.bizPhotoBtn} onPress={() => navigation.navigate('BusinessProfile')}>
                {currentBusiness?.logo && currentBusiness.logo.startsWith('/') ? (
                  <Image source={{ uri: `http://localhost:3001${currentBusiness.logo}` }} style={s.bizLogo} />
                ) : (
                  <Camera size={22} color={colors.gray500} />
                )}
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={s.bizName}>{bizName}</Text>
                {strengthPct < 100 && (
                  <View style={s.incompleteRow}>
                    <AlertTriangle size={13} color={colors.red} />
                    <Text style={s.incompleteText}>Incomplete business profile</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('BusinessProfile')}>
                <Pencil size={18} color={colors.blue} />
              </TouchableOpacity>
            </View>

            {/* Profile strength */}
            <View style={s.strengthBox}>
              <View style={s.strengthBar}>
                <View style={[s.strengthFill, { width: `${strengthPct}%`, backgroundColor: strengthColor }]} />
              </View>
              <View style={s.strengthRow}>
                <Text style={s.strengthLabel}>Profile Strength: <Text style={{ color: strengthColor }}>{strengthLevel}</Text></Text>
                <Text style={s.strengthPct}>{strengthPct}%</Text>
              </View>
            </View>

            {strengthPct < 100 && (
              <TouchableOpacity style={s.missingBtn} onPress={() => navigation.navigate('BusinessProfile')}>
                <Text style={s.missingBtnText}>ADD MISSING DETAILS</Text>
                <ChevronRight size={16} color="#fff" />
              </TouchableOpacity>
            )}

            {/* CashBook UPI promo */}
            <View style={s.promoCard}>
              <View style={s.promoContent}>
                <Text style={s.promoLabel}>Employee Expenses using</Text>
                <Text style={s.promoBlue}>CashBook UPI</Text>
                <Text style={s.promoSub}>Issue separate wallet for each employee to make business payment</Text>
                <TouchableOpacity style={s.tryNowBtn}>
                  <Text style={s.tryNowText}>TRY NOW</Text>
                  <ChevronRight size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.promoChevron} onPress={() => setUpiExpanded(v => !v)}>
                {upiExpanded ? <ChevronUp size={20} color={colors.blue} /> : <ChevronDown size={20} color={colors.blue} />}
              </TouchableOpacity>
            </View>

            {/* Add Email card */}
            {!hasEmail && (
              <View style={s.emailCard}>
                <View style={s.emailIcon}>
                  <Mail size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.emailTitle}>Add Email ID to Profile</Text>
                  <View style={s.emailPoint}><View style={s.dot} /><Text style={s.emailPointText}>Login via verified email on desktop</Text></View>
                  <View style={s.emailPoint}><View style={s.dot} /><Text style={s.emailPointText}>Get monthly summary on email <Text style={{ color: colors.gray400 }}>(Coming soon)</Text></Text></View>
                </View>
                <TouchableOpacity style={s.addEmailBtn} onPress={() => navigation.navigate('Profile')}>
                  <Plus size={16} color={colors.blue} />
                  <Text style={s.addEmailText}>ADD EMAIL</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Business settings */}
            <View style={s.section}>
              <SettingRow Icon={Users} label="Business Team" sublabel="Add, remove or change role" onPress={() => navigation.navigate('Team')} />
              <View style={s.divider} />
              <SettingRow 
                Icon={ArrowRightLeft} 
                label="Move Book Requests" 
                sublabel="Approve or deny requests" 
                onPress={() => navigation.navigate('MoveBookRequests')}
              />
              <View style={s.divider} />
              <SettingRow Icon={Building2} label="Business Settings" sublabel="Settings specific to this business" onPress={() => navigation.navigate('BusinessSettings')} />
            </View>
          </>
        )}

        {/* General settings */}
        <Text style={s.sectionHeader}>General Settings</Text>
        <View style={s.section}>
          <SettingRow Icon={HelpCircle} label="Help & Support" sublabel="FAQs, Contact us" />
          <View style={s.divider} />
          <SettingRow Icon={Smartphone} label="App Settings" sublabel="Language, Theme, Security, Backup" />
          <View style={s.divider} />
          <SettingRow Icon={UserCircle2} label="Your Profile" sublabel="Name, Mobile Number, Email" onPress={() => navigation.navigate('Profile')}
            badge={!hasEmail ? '!' : null}
          />
          {!hasEmail && (
            <View style={s.warnBanner}>
              <AlertTriangle size={14} color={colors.yellow} />
              <Text style={s.warnBannerText}>Email Id missing! Add Email Id to login via Email on desktop</Text>
            </View>
          )}
          <View style={s.divider} />
          <SettingRow Icon={Info} label="About CashBook" sublabel="Privacy policy, T&C, About us" />
        </View>

        {/* Do more promo */}
        <View style={s.section}>
          <Text style={[s.sectionHeader, { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 0 }]}>Do more with CashBook</Text>
          <View style={s.morePromo}>
            <UserCircle2 size={32} color={colors.blue} style={{ marginRight: 12, marginTop: 4 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.morePromoTitle}>Tired of dealing with team expenses? Leave it to us.</Text>
              <Text style={s.morePromoSub}>With CashBook UPI, Issue separate wallet for each employee &amp; control their expenses</Text>
            </View>
          </View>
          <TouchableOpacity style={s.knowMoreBtn}>
            <Text style={s.knowMoreText}>KNOW MORE</Text>
            <ChevronRight size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <View style={s.section}>
          <TouchableOpacity style={s.redRow} onPress={confirmLogout}>
            <LogOut size={20} color={colors.red} />
            <Text style={s.redRowText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <View style={s.section}>
          <TouchableOpacity style={s.redRow} onPress={confirmDelete}>
            <Trash2 size={20} color={colors.red} />
            <Text style={s.redRowText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* YouTube */}
        <View style={s.section}>
          <SettingRow Icon={(props) => <FontAwesome5 name="youtube" {...props} />} iconBg="#FEF2F2" iconColor="#EF4444" label="Subscribe to our YouTube Channel" sublabel="Live product demo videos, tutorials and much more" />
        </View>

        {/* Our promise */}
        <View style={s.promiseRow}>
          <View style={s.promiseBadge}>
            <ShieldCheck size={18} color={colors.green} />
            <Text style={s.promiseText}>100% Safe &amp; Secure</Text>
          </View>
          <View style={s.promiseBadge}>
            <CloudUpload size={18} color={colors.blue} />
            <Text style={s.promiseText}>Auto Data Backup</Text>
          </View>
        </View>

        <Text style={s.version}>App Version - 1.0.0</Text>
      </ScrollView>

      {modal && (
        <AppConfirmModal
          visible={!!modal}
          title={modal.title}
          message={modal.message}
          confirmText={modal.confirmText}
          isDanger={modal.isDanger}
          onConfirm={modal.onConfirm}
          onCancel={() => setModal(null)}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#F5F5F5' },
  pageTitle:    { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, paddingHorizontal: spacing[4], paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  bizCard: { flexDirection: 'row', backgroundColor: '#fff', padding: 20, alignItems: 'center', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  bizPhotoBtn: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  bizLogo: { width: '100%', height: '100%', borderRadius: 8, resizeMode: 'cover' },
  bizName: { fontSize: typography.lg, fontFamily: 'Poppins-SemiBold', color: colors.gray900 },
  incompleteRow:{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  incompleteText:{ fontSize: typography.sm, color: colors.red, fontFamily: 'Poppins-Regular' },
  strengthBox:  { backgroundColor: '#fff', paddingHorizontal: spacing[4], paddingBottom: 8 },
  strengthBar:  { height: 6, backgroundColor: '#FCA5A5', borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  strengthFill: { height: '100%', backgroundColor: colors.red, borderRadius: 3 },
  strengthRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  strengthLabel:{ fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  strengthPct:  { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  missingBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.blue, marginHorizontal: spacing[4], marginVertical: 12, borderRadius: radius.xl, paddingVertical: 14 },
  missingBtnText:{ color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.base, letterSpacing: 0.5 },
  promoCard:    { backgroundColor: '#fff', marginHorizontal: 0, marginBottom: 10, padding: spacing[4], flexDirection: 'row', alignItems: 'flex-start' },
  promoContent: { flex: 1 },
  promoLabel:   { fontSize: typography.base, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  promoBlue:    { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.blue, marginVertical: 2 },
  promoSub:     { fontSize: typography.sm, color: colors.gray500, marginBottom: 10, fontFamily: 'Poppins-Regular' },
  tryNowBtn:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.green, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  tryNowText:   { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 },
  promoChevron: { paddingTop: 4 },
  emailCard:    { backgroundColor: '#fff', padding: spacing[4], marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  emailIcon:    { width: 44, height: 44, borderRadius: 22, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  emailTitle:   { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 6 },
  emailPoint:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gray400 },
  emailPointText:{ fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  addEmailBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderTopColor: colors.gray100, marginTop: 8, paddingTop: 10 },
  addEmailText: { color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.sm },
  section:      { backgroundColor: '#fff', marginBottom: 10 },
  divider:      { height: 1, backgroundColor: colors.gray100, marginLeft: 68 },
  sectionHeader:{ fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray500, paddingHorizontal: spacing[4], paddingVertical: 12 },
  warnBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFBEB', padding: 12, marginHorizontal: spacing[4], marginBottom: 8, borderRadius: radius.lg },
  warnBannerText:{ flex: 1, fontSize: typography.sm, color: colors.yellow, fontFamily: 'Poppins-Regular' },
  morePromo:    { flexDirection: 'row', gap: 12, padding: spacing[4], borderWidth: 1.5, borderColor: colors.green, borderRadius: radius.xl, margin: spacing[4] },
  morePromoEmoji:{ fontSize: 32, fontFamily: 'Poppins-Regular' },
  morePromoTitle:{ fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 4 },
  morePromoSub: { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  knowMoreBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.green, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, marginHorizontal: spacing[4], marginBottom: spacing[4] },
  knowMoreText: { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 },
  redRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[4], paddingVertical: 16 },
  redRowText:   { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.red },
  promiseRow:   { flexDirection: 'row', justifyContent: 'center', gap: 24, paddingVertical: 16 },
  promiseBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  promiseText:  { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  version:      { textAlign: 'center', fontSize: typography.base, color: colors.gray400, paddingBottom: 8, fontFamily: 'Poppins-Regular' } });

const r = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[4], paddingVertical: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  sublabel: { fontSize: typography.sm, color: colors.gray400, marginTop: 1, fontFamily: 'Poppins-Regular' },
  badge:    { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  badgeText:{ color: '#fff', fontSize: 10, fontFamily: 'Poppins-Medium' } });
