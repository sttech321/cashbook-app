import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Modal, SectionList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getTeam, getBookMembers, assignMemberBook, getPendingInvitations } from '../api';
import { colors, typography, spacing } from '../theme';

const AVATAR_COLORS = ['#9C27B0', '#E91E63', '#1565C0', '#2E7D32', '#E65100', '#00838F', '#C62828', '#4527A0'];
const ROLES         = ['Viewer', 'Data Operator', 'Book Admin'];

function avatarBg(name) {
  return AVATAR_COLORS[(name || 'U').charCodeAt(0) % AVATAR_COLORS.length];
}

function getMemberKey(m) {
  return m.user_id || m.mobile || m.email || m.id;
}

export default function AddBookMemberScreen({ navigation, route }) {
  const { book } = route.params;
  const { currentBusinessId, currentBusiness } = useApp();

  const [teamMembers, setTeamMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [bookMemberRoles, setBookMemberRoles] = useState(new Map());
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(null);
  const [roleModal, setRoleModal] = useState(null);
  const [selectedRole, setSelectedRole] = useState('Viewer');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, bookRes, invRes] = await Promise.all([
        getTeam(currentBusinessId),
        getBookMembers(currentBusinessId, book.id),
        getPendingInvitations(currentBusinessId, book.id),
      ]);
      const team  = teamRes.members  || teamRes  || [];
      const book_ = bookRes.members  || bookRes  || [];
      setTeamMembers(team);
      setInvitations(invRes.invitations || []);
      const roleMap = new Map();
      book_.forEach(m => {
        const key = getMemberKey(m);
        if (key) roleMap.set(key, m.role);
      });
      setBookMemberRoles(roleMap);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load members');
    } finally {
      setLoading(false);
    }
  }, [currentBusinessId, book.id]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const available = teamMembers.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.mobile || '').includes(q);
  });

  const availableInvitations = invitations.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.mobile || '').includes(q) || (m.email || '').includes(q);
  });

  const openRolePicker = (member) => {
    setSelectedRole('Viewer');
    setRoleModal(member);
  };

  const confirmAdd = async () => {
    const member = roleModal;
    setRoleModal(null);
    setAdding(member.id);
    try {
      await assignMemberBook(currentBusinessId, member.id, { bookId: book.id, role: selectedRole });
      await loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to add member');
    } finally {
      setAdding(null);
    }
  };

  const renderMember = ({ item, isPending }) => {
    const isAdded = bookMemberRoles.has(getMemberKey(item));
    const roleToShow = bookMemberRoles.get(getMemberKey(item)) || item.role || 'Viewer';
    
    return (
      <View style={s.memberRow}>
        <View style={[s.avatar, { backgroundColor: avatarBg(item.name) }]}>
          <Text style={s.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={s.memberInfo}>
          <View style={s.memberHeaderRow}>
            <Text style={s.memberName}>{item.name || 'Unknown'}</Text>
            <View style={{ flex: 1 }} />
            
            {adding === item.id
              ? <ActivityIndicator size="small" color={colors.blue} style={{ marginRight: 8 }} />
              : (isPending || isAdded)
                ? (
                  <View style={[s.roleBadge, roleToShow === 'Employee' && { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[s.roleText, roleToShow === 'Primary Admin' && s.roleTextAdmin, roleToShow === 'Employee' && { color: '#0369A1' }]}>{roleToShow}</Text>
                  </View>
                )
                : (
                  <TouchableOpacity onPress={() => openRolePicker(item)} style={s.addTap}>
                    <Text style={s.addText}>ADD</Text>
                  </TouchableOpacity>
                )
            }
          </View>
          
          <View style={s.iconRow}>
            <Ionicons name="id-card-outline" size={16} color={colors.gray500} />
            <Text style={s.iconText}>- . 1 book</Text>
          </View>
          <View style={s.rowDivider} />
          <View style={s.iconRow}>
            <Ionicons name={item.mobile ? 'call-outline' : 'mail-outline'} size={16} color={colors.gray500} />
            <Text style={s.iconText}>{item.mobile || item.email || ''}</Text>
          </View>

          {isPending && (
            <>
              <View style={s.rowDivider} />
              <TouchableOpacity onPress={() => Alert.alert('Copied', 'Invitation link copied to clipboard.')} style={s.resendBtn}>
                <Text style={s.resendText}>Resend Invitation</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.gray700} />
        </TouchableOpacity>
        <Text style={s.title}>Add New Member</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={20} color={colors.blue} />
        <TextInput
          style={s.searchInput}
          placeholder="Search by name or number"
          placeholderTextColor={colors.gray400}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>
      <View style={s.divider} />

      {/* Members already added count */}
      {!loading && (
        <View style={s.countRow}>
          <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          <Text style={s.countText}>
            <Text style={s.countNum}>{bookMemberRoles.size}</Text>
            {bookMemberRoles.size === 1 ? ' member' : ' members'} already added to this book
          </Text>
        </View>
      )}

      {loading
        ? <View style={s.center}><ActivityIndicator color={colors.blue} size="large" /></View>
        : (
          <SectionList
            sections={[
              ...(availableInvitations.length > 0 ? [{ title: 'Pending Invitations', data: availableInvitations, isPending: true }] : []),
              { title: `Employee Members of ${currentBusiness?.name || 'this business'}`, data: available, isPending: false }
            ]}
            keyExtractor={item => String(item.id)}
            renderItem={({ item, section }) => renderMember({ item, isPending: section.isPending })}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={s.sectionLabel}>{title}</Text>
            )}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>
                  {search.trim()
                    ? `No members found for "${search}"`
                    : 'No team members found for this business.'}
                </Text>
              </View>
            }
          />
        )
      }

      {/* ADD EXTERNAL MEMBER button */}
      {!loading && (
        <View style={s.fabWrap}>
          <TouchableOpacity
            style={s.fab}
            onPress={() => navigation.navigate('AddExternalMember', { book })}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={s.fabText}>ADD EXTERNAL MEMBER</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Role picker bottom sheet */}
      <Modal visible={!!roleModal} transparent animationType="slide" onRequestClose={() => setRoleModal(null)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setRoleModal(null)}>
          <TouchableOpacity activeOpacity={1} style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Select Role for {roleModal?.name}</Text>
            {ROLES.map(role => (
              <TouchableOpacity
                key={role}
                style={[s.roleRow, selectedRole === role && s.roleRowActive]}
                onPress={() => setSelectedRole(role)}
              >
                <View style={[s.radio, selectedRole === role && s.radioActive]}>
                  {selectedRole === role && <View style={s.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.roleLabel, selectedRole === role && s.roleLabelActive]}>{role}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={s.confirmBtn} onPress={confirmAdd}>
              <Text style={s.confirmText}>ADD MEMBER</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#fff' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn:      { width: 40, alignItems: 'flex-start' },
  title:        { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  searchRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing[4], paddingVertical: 14 },
  searchInput:  { flex: 1, fontSize: typography.md, color: colors.gray900, fontFamily: 'Poppins-Regular' },
  divider:      { height: 1, backgroundColor: colors.gray100 },
  countRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing[4], paddingVertical: 10, backgroundColor: '#F0FDF4', borderBottomWidth: 1, borderBottomColor: '#DCFCE7' },
  countText:    { fontSize: typography.sm, color: '#16A34A', fontFamily: 'Poppins-Regular' },
  countNum:     { fontFamily: 'Poppins-Medium' },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: typography.sm, color: colors.gray400, paddingHorizontal: spacing[4], paddingTop: 16, paddingBottom: 8, fontFamily: 'Poppins-Regular' },
  memberRow:    { flexDirection: 'row', paddingHorizontal: spacing[4], paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  avatar:       { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText:   { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: '#fff' },
  memberInfo:   { flex: 1 },
  memberHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  memberName:   { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  iconRow:      { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  iconText:     { fontSize: typography.sm, color: colors.gray700, marginLeft: 10, fontFamily: 'Poppins-Regular' },
  rowDivider:   { height: 1, backgroundColor: colors.gray100, marginVertical: 4 },
  resendBtn:    { marginTop: 4, marginBottom: 2 },
  resendText:   { fontSize: typography.sm, color: colors.blue, fontFamily: 'Poppins-Medium' },
  roleBadge:    { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  roleText:     { fontSize: 10, fontFamily: 'Poppins-Medium', color: colors.gray700 },
  roleTextAdmin:{ color: '#059669', fontFamily: 'Poppins-Regular' },
  addTap:       { paddingHorizontal: 8, paddingVertical: 6 },
  addText:      { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.blue, letterSpacing: 0.3 },
  addedTag:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addedText:    { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: '#22C55E', letterSpacing: 0.3 },
  empty:        { alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  emptyText:    { fontSize: typography.base, color: colors.gray400, textAlign: 'center', fontFamily: 'Poppins-Regular' },
  fabWrap:      { position: 'absolute', bottom: 20, alignSelf: 'center', width: '100%', alignItems: 'center' },
  fab:          { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#4F60F0', borderRadius: 30, paddingVertical: 16, paddingHorizontal: 28, elevation: 6, shadowColor: '#4F60F0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10 },
  fabText:      { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.base, letterSpacing: 0.5 },
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  sheetHandle:  { width: 40, height: 4, backgroundColor: colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle:   { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 20 },
  roleRow:      { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 6 },
  roleRowActive:{ backgroundColor: '#EEF2FF' },
  radio:        { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioActive:  { borderColor: colors.blue },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  roleLabel:    { fontSize: typography.md, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  roleLabelActive:{ fontFamily: 'Poppins-Medium', color: colors.gray900 },
  confirmBtn:   { marginTop: 12, backgroundColor: colors.blue, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  confirmText:  { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.base, letterSpacing: 0.5 } });
