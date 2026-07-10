import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import {
  addTeamMember, assignMemberBook,
  lookupUser, lookupUserMobile, getBookMembers, createBookInvitation
} from '../api';
import { colors, typography, spacing } from '../theme';

// ── Role definitions ─────────────────────────────────────────
const ROLES = [
  {
    key: 'Data Operator',
    permissions: [
      'Add Cash In or Cash Out Entries',
      'View entries by everyone',
      'View net balance & download PDF or Excel',
    ],
    restrictions: ['Cannot edit or delete entries'],
    tip: 'You can change Data Operator permissions from book settings page after adding this Data Operator' },
  {
    key: 'Viewer',
    permissions: [
      'View entries by everyone',
      'View net balance & download PDF or Excel',
    ],
    restrictions: ['Cannot add entries', 'Cannot edit or delete entries'],
    tip: 'You can change Viewer permissions from book settings page after adding this Viewer' },
  {
    key: 'Book Admin',
    permissions: [
      'Add, edit & delete all entries',
      'Manage members & their roles',
      'View net balance & download PDF or Excel',
    ],
    restrictions: [],
    tip: 'Book Admin has full control over this cashbook including managing members' },
];

export default function AddExternalMemberScreen({ navigation, route }) {
  const { book } = route.params;
  const { currentBusinessId } = useApp();

  // ── Step 1 state ─────────────────────────────────────────────
  const [step, setStep]               = useState(1);
  const [inputMode, setInputMode]     = useState('mobile');
  const [mobile, setMobile]           = useState('');
  const [email, setEmail]             = useState('');
  const [name, setName]               = useState('');
  const [nameEditable, setNameEditable] = useState(true);
  const [lookupState, setLookupState] = useState('idle'); // idle|checking|found|notfound
  const [foundUserId, setFoundUserId] = useState(null);
  const debounceRef                   = useRef(null);

  // ── Step 2 state ─────────────────────────────────────────────
  const [role, setRole]               = useState('Data Operator');

  // ── Shared / Step 3 state ────────────────────────────────────
  const [saving, setSaving]           = useState(false);
  const [bookMemberCount, setBookMemberCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [addedRole, setAddedRole]     = useState('');

  // ── Computed ─────────────────────────────────────────────────
  const isValidMobile  = /^\d{10}$/.test(mobile.trim());
  const isValidEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const hasValidInput  = inputMode === 'mobile' ? isValidMobile : isValidEmail;
  const canNext        = hasValidInput && name.trim().length > 0 && lookupState !== 'checking';
  const displayContact = inputMode === 'mobile' ? `+91${mobile}` : email.trim();
  const selectedRole   = ROLES.find(r => r.key === role) || ROLES[0];
  const isExistingUser = !!foundUserId; // found in CashBook → ADD; else → INVITE

  // ── Lookup helpers ────────────────────────────────────────────
  const resetLookup = () => {
    setLookupState('idle');
    setNameEditable(true);
    setFoundUserId(null);
  };

  const runLookup = (lookupFn, valid) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!valid) { resetLookup(); return; }
    setLookupState('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await lookupFn();
        if (data.found) {
          setName(data.user.name || '');
          setNameEditable(false);
          setFoundUserId(data.user.id || null);
          setLookupState('found');
        } else {
          setNameEditable(true);
          setFoundUserId(null);
          setLookupState('notfound');
        }
      } catch {
        setNameEditable(true);
        setFoundUserId(null);
        setLookupState('notfound');
      }
    }, 400);
  };

  const handleMobileChange = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setMobile(digits);
    if (lookupState === 'found') { setName(''); setFoundUserId(null); }
    runLookup(() => lookupUserMobile(digits), /^\d{10}$/.test(digits));
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (lookupState === 'found') { setName(''); setFoundUserId(null); }
    const trimmed = val.trim();
    runLookup(() => lookupUser(trimmed), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed));
  };

  const switchMode = (mode) => {
    setInputMode(mode);
    setMobile(''); setEmail(''); setName('');
    resetLookup();
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };

  // ── NEXT: Step 1 → Step 2 ────────────────────────────────────
  // Only validates input — always proceeds to role selection.
  // Duplicate check happens on ADD so the user can always see the role page.
  const handleStep1Next = () => {
    if (!canNext) return;
    setStep(2);
  };

  // ── ADD / INVITE ──────────────────────────────────────────────
  const handleAddMember = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const fullMobile = inputMode === 'mobile' ? `+91${mobile.trim()}` : undefined;
      const emailVal   = inputMode === 'email'  ? email.trim()           : undefined;

      // Duplicate check at the point of adding, not at NEXT
      let memberCount = 0;
      try {
        const bookRes = await getBookMembers(currentBusinessId, book.id);
        const existing = bookRes.members || bookRes || [];
        memberCount = existing.length;
        const alreadyIn = existing.some(m => {
          if (foundUserId && m.user_id === foundUserId)                        return true;
          if (emailVal   && m.email?.toLowerCase() === emailVal.toLowerCase()) return true;
          if (fullMobile && m.mobile               === fullMobile)             return true;
          return false;
        });
        if (alreadyIn) {
          Alert.alert('Already a Member', 'This member is already part of this cashbook.');
          return;
        }
      } catch {
        // If check fails, backend upsert prevents duplicates
      }

      const res = await createBookInvitation(currentBusinessId, book.id, {
        name: name.trim(),
        mobile: fullMobile,
        email: emailVal,
        role: role
      });
      const invitation = res.invitation || res;
      
      // Navigate to Share Invitation screen
      navigation.replace('ShareInvitation', { invitation });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const lookupBorderColor = () => {
    if (lookupState === 'found')    return '#16A34A';
    if (lookupState === 'notfound') return '#DC2626';
    if (hasValidInput)              return colors.blue;
    return colors.gray200;
  };

  // ── SUCCESS BOTTOM SHEET ──────────────────────────────────────
  const SuccessSheet = () => (
    <Modal visible={showSuccess} transparent animationType="slide" onRequestClose={() => navigation.goBack()}>
      <View style={s.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
        <View style={s.sheetContainer}>
          <View style={s.sheetHandle} />
          <TouchableOpacity style={s.sheetClose} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={20} color={colors.gray600} />
          </TouchableOpacity>

          <View style={s.successIcon}>
            <Ionicons name="checkmark" size={36} color="#fff" />
          </View>
          <Text style={s.successTitle}>{name} added as {addedRole}!</Text>
          <Text style={s.successSub}>This book has {bookMemberCount + 1} members now.</Text>

          <View style={s.notifCard}>
            <View style={s.notifIconWrap}>
              <Ionicons name="phone-portrait-outline" size={38} color={colors.blue} />
              <View style={s.notifBadge}>
                <Ionicons name="notifications" size={14} color="#F59E0B" />
              </View>
            </View>
            <Text style={s.notifText}>Enable notifications to see their entries in real time.</Text>
            <TouchableOpacity style={s.enableNotifBtn}>
              <Ionicons name="notifications-outline" size={18} color="#fff" />
              <Text style={s.enableNotifText}>ENABLE NOTIFICATION</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.addMoreBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="person-add-outline" size={18} color={colors.blue} />
            <Text style={s.addMoreText}>ADD MORE MEMBERS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // ── STEP 2 — Role selection ───────────────────────────────────
  if (step === 2) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <SuccessSheet />
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => setStep(1)}>
            <Ionicons name="chevron-back" size={26} color={colors.gray700} />
          </TouchableOpacity>
          <Text style={s.title}>Choose Role</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.divider} />

        <ScrollView contentContainerStyle={s.step2Body} keyboardShouldPersistTaps="handled">
          {/* Member card with left accent */}
          <View style={s.memberCard}>
            <View style={s.memberCardAccent} />
            <View style={s.memberAvatar}>
              <Text style={s.memberAvatarText}>{(name || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.memberCardName}>{name}</Text>
              <Text style={s.memberCardSub}>{displayContact}</Text>
            </View>
            <View style={s.employeeBadge}>
              <Text style={s.employeeBadgeText}>Employee</Text>
            </View>
          </View>

          {/* Role picker card */}
          <View style={s.roleCard}>
            <Text style={s.roleCardTitle}>Choose Role in this Book</Text>
            <View style={s.roleChips}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  style={[s.roleChip, role === r.key && s.roleChipActive]}
                  onPress={() => setRole(r.key)}
                >
                  <Text style={[s.roleChipText, role === r.key && s.roleChipTextActive]}>{r.key}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.permSectionLabel}>{role} Permissions</Text>
            {selectedRole.permissions.map((p) => (
              <View key={p} style={s.permRow}>
                <View style={s.permDotGreen}><Ionicons name="checkmark" size={10} color="#fff" /></View>
                <Text style={s.permText}>{p}</Text>
              </View>
            ))}

            {selectedRole.restrictions.length > 0 && (
              <>
                <Text style={[s.permSectionLabel, { marginTop: 12 }]}>Restrictions</Text>
                {selectedRole.restrictions.map((r) => (
                  <View key={r} style={s.permRow}>
                    <View style={s.permDotRed}><Ionicons name="close" size={10} color="#fff" /></View>
                    <Text style={s.permText}>{r}</Text>
                  </View>
                ))}
              </>
            )}
          </View>

          {/* Tip box */}
          <View style={s.tipBox}>
            <Ionicons name="bulb" size={20} color="#EAB308" style={{ marginTop: 2 }} />
            <Text style={s.tipText}>{selectedRole.tip}</Text>
          </View>
        </ScrollView>

        {/* Single full-width action button */}
        <View style={s.footerSingle}>
          <TouchableOpacity
            style={[s.actionBtn, saving && { opacity: 0.7 }]}
            onPress={handleAddMember}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={s.actionBtnText}>+  {isExistingUser ? 'ADD' : 'INVITE'}</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── STEP 1 — Input ────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.gray700} />
        </TouchableOpacity>
        <Text style={s.title}>Add Member Manually</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.divider} />

      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {/* Tabs */}
        <View style={s.tabRow}>
          {['mobile', 'email'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[s.tab, inputMode === mode && s.tabActive]}
              onPress={() => switchMode(mode)}
            >
              <Text style={[s.tabText, inputMode === mode && s.tabTextActive]}>
                {mode === 'mobile' ? 'Mobile' : 'Email'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mobile input */}
        {inputMode === 'mobile' && (
          <>
            <Text style={s.fieldLabel}>Enter mobile number</Text>
            <View style={s.phoneRow}>
              <View style={s.countryBox}>
                <Text style={s.countryCode}>+91</Text>
                <Ionicons name="chevron-down" size={14} color={colors.gray500} />
              </View>
              <View style={[s.inputWrap, { borderColor: lookupBorderColor() }]}>
                <Text style={[s.floatLabel, mobile.length > 0 && { color: colors.blue }]}>Mobile Number</Text>
                <View style={s.inputRow}>
                  <TextInput
                    style={[s.textInput, { flex: 1 }]}
                    value={mobile}
                    onChangeText={handleMobileChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                    autoFocus
                    returnKeyType="next"
                  />
                  {lookupState === 'checking' && <ActivityIndicator size="small" color={colors.blue} style={{ marginRight: 8 }} />}
                  {lookupState === 'found'    && <View style={s.okDot}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                  {lookupState === 'notfound' && <Ionicons name="close" size={16} color="#DC2626" style={{ marginRight: 8 }} />}
                </View>
              </View>
            </View>
            {lookupState === 'found'    && <Text style={s.lookupOk}>CashBook user found! Name auto-filled.</Text>}
            {lookupState === 'notfound' && <Text style={s.lookupErr}>No user found — enter name below.</Text>}
          </>
        )}

        {/* Email input */}
        {inputMode === 'email' && (
          <>
            <Text style={s.fieldLabel}>Enter email address</Text>
            <View style={[s.inputWrap, { borderColor: lookupBorderColor(), marginBottom: 4 }]}>
              <Text style={[s.floatLabel, email.length > 0 && { color: colors.blue }]}>Email Address</Text>
              <View style={s.inputRow}>
                <TextInput
                  style={[s.textInput, { flex: 1 }]}
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  returnKeyType="next"
                />
                {lookupState === 'checking' && <ActivityIndicator size="small" color={colors.blue} style={{ marginRight: 8 }} />}
                {lookupState === 'found'    && <View style={s.okDot}><Ionicons name="checkmark" size={12} color="#fff" /></View>}
                {lookupState === 'notfound' && <Ionicons name="close" size={16} color="#DC2626" style={{ marginRight: 8 }} />}
              </View>
            </View>
            {lookupState === 'found'    && <Text style={s.lookupOk}>CashBook user found! Name auto-filled.</Text>}
            {lookupState === 'notfound' && <Text style={s.lookupErr}>No user found — enter name below.</Text>}
          </>
        )}

        {/* Name field — always shown after valid input */}
        {(lookupState === 'found' || lookupState === 'notfound' || name.length > 0) && (
          <>
            <Text style={[s.fieldLabel, { marginTop: 20 }]}>
              {nameEditable ? 'Enter name' : 'Name (auto-filled)'}
            </Text>
            <TextInput
              style={[
                s.nameInput,
                !nameEditable && { backgroundColor: '#F0FDF4', borderColor: '#16A34A', color: colors.gray700 },
              ]}
              placeholder="Type the name of the member here"
              placeholderTextColor={colors.gray300}
              value={name}
              onChangeText={nameEditable ? setName : undefined}
              editable={nameEditable}
              returnKeyType="done"
              onSubmitEditing={handleStep1Next}
            />
          </>
        )}
      </ScrollView>

      <View style={s.footerSingle}>
        <TouchableOpacity
          style={[s.nextBtn, !canNext && s.nextBtnOff]}
          onPress={handleStep1Next}
          disabled={!canNext}
        >
          <Text style={[s.nextBtnText, !canNext && s.nextBtnTextOff]}>NEXT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#fff' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 14 },
  backBtn:      { width: 40, alignItems: 'flex-start' },
  title:        { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  divider:      { height: 1, backgroundColor: colors.gray100 },

  // Step 1
  body:         { padding: spacing[4], paddingTop: 20, paddingBottom: 40 },
  tabRow:       { flexDirection: 'row', borderWidth: 1, borderColor: colors.gray200, borderRadius: 8, overflow: 'hidden', marginBottom: 24 },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fff' },
  tabActive:    { backgroundColor: colors.blue },
  tabText:      { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray500 },
  tabTextActive:{ color: '#fff', fontFamily: 'Poppins-Regular' },
  fieldLabel:   { fontSize: typography.sm, color: colors.gray500, marginBottom: 10, fontFamily: 'Poppins-Regular' },
  phoneRow:     { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginBottom: 4 },
  countryBox:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.gray200, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 14 },
  countryCode:  { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray800 },
  inputWrap:    { flex: 1, borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingTop: 6, paddingBottom: 8 },
  inputRow:     { flexDirection: 'row', alignItems: 'center' },
  floatLabel:   { fontSize: typography.xs, color: colors.gray400, marginBottom: 2, fontFamily: 'Poppins-Regular' },
  textInput:    { fontSize: typography.md, color: colors.gray900, paddingVertical: 4, fontFamily: 'Poppins-Regular' },
  okDot:        { width: 20, height: 20, borderRadius: 10, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  lookupOk:     { fontSize: typography.xs, color: '#16A34A', fontFamily: 'Poppins-Regular' },
  lookupErr:    { fontSize: typography.xs, color: '#DC2626', fontFamily: 'Poppins-Regular' },
  nameInput:    { borderWidth: 1, borderColor: colors.gray200, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 14, fontSize: typography.md, color: colors.gray900, marginBottom: 8, fontFamily: 'Poppins-Regular' },

  // Shared footer
  footerSingle: { padding: spacing[4], paddingBottom: 28, borderTopWidth: 1, borderTopColor: colors.gray100 },
  nextBtn:      { backgroundColor: colors.blue, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  nextBtnOff:   { backgroundColor: colors.gray100 },
  nextBtnText:  { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.base, letterSpacing: 0.5 },
  nextBtnTextOff:{ color: colors.gray400, fontFamily: 'Poppins-Regular' },

  // Step 2
  step2Body:    { paddingBottom: 24 },
  memberCard:   { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 12, padding: 14, paddingLeft: 0, borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, overflow: 'hidden' },
  memberCardAccent: { width: 4, alignSelf: 'stretch', backgroundColor: colors.blue, marginRight: 12 },
  memberAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  memberAvatarText:{ fontSize: 18, fontFamily: 'Poppins-Medium', color: colors.blue },
  memberCardName:  { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  memberCardSub:   { fontSize: typography.sm, color: colors.gray400, marginTop: 2, fontFamily: 'Poppins-Regular' },
  employeeBadge:   { borderWidth: 1, borderColor: colors.blue, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 4 },
  employeeBadgeText:{ fontSize: 11, color: colors.blue, fontFamily: 'Poppins-Regular' },
  roleCard:        { marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.gray200, borderRadius: 10, padding: 16 },
  roleCardTitle:   { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 16 },
  roleChips:       { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  roleChip:        { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 22, borderWidth: 1.5, borderColor: colors.gray200, backgroundColor: '#fff' },
  roleChipActive:  { borderColor: colors.blue, backgroundColor: colors.blueLight },
  roleChipText:    { fontSize: typography.sm, color: colors.gray600, fontFamily: 'Poppins-Regular' },
  roleChipTextActive:{ color: colors.blue, fontFamily: 'Poppins-Medium' },
  permSectionLabel:{ fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray500, marginBottom: 10 },
  permRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  permDotGreen:    { width: 22, height: 22, borderRadius: 11, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  permDotRed:      { width: 22, height: 22, borderRadius: 11, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  permText:        { fontSize: typography.sm, color: colors.gray700, flex: 1, fontFamily: 'Poppins-Regular' },
  tipBox:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginHorizontal: 16, marginBottom: 8, padding: 14, backgroundColor: '#F9FAFB', borderRadius: 10 },
  tipEmoji:        { fontSize: 18, marginTop: 1, fontFamily: 'Poppins-Regular' },
  tipText:         { fontSize: typography.sm, color: colors.gray600, flex: 1, lineHeight: 20, fontFamily: 'Poppins-Regular' },
  actionBtn:       { backgroundColor: colors.blue, borderRadius: 12, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  actionBtnText:   { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.base, letterSpacing: 0.5 },

  // Success bottom sheet
  sheetOverlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheetContainer:  { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, paddingHorizontal: 24, alignItems: 'center' },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.gray200, marginTop: 12, marginBottom: 20 },
  sheetClose:      { position: 'absolute', top: 18, right: 20 },
  successIcon:     { width: 72, height: 72, borderRadius: 36, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle:    { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, textAlign: 'center', marginBottom: 6 },
  successSub:      { fontSize: typography.base, color: colors.gray500, textAlign: 'center', marginBottom: 20, fontFamily: 'Poppins-Regular' },
  notifCard:       { width: '100%', backgroundColor: '#F0F4FF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 },
  notifIconWrap:   { position: 'relative', marginBottom: 10 },
  notifBadge:      { position: 'absolute', top: -4, right: -8, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 2 },
  notifText:       { fontSize: typography.sm, color: colors.gray600, textAlign: 'center', lineHeight: 20, marginBottom: 14, fontFamily: 'Poppins-Regular' },
  enableNotifBtn:  { width: '100%', backgroundColor: colors.blue, borderRadius: 10, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  enableNotifText: { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 },
  addMoreBtn:      { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.blue, borderRadius: 12, paddingVertical: 14 },
  addMoreText:     { color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.3 } });
