import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { getBookMembers, getPendingInvitations } from '../api';
import { colors, typography, spacing, radius } from '../theme';

const AVATAR_COLORS = ['#9C27B0', '#E91E63', '#1565C0', '#2E7D32', '#E65100', '#00838F', '#C62828', '#4527A0'];
function avatarBg(name) {
  return AVATAR_COLORS[(name || 'U').charCodeAt(0) % AVATAR_COLORS.length];
}

function SettingRow({ icon, label, sublabel, isNew }) {
  return (
    <TouchableOpacity style={s.settingRow} onPress={() => Alert.alert('Coming Soon', 'This feature is under development.')}>
      <View style={s.settingIconWrap}>
        <Ionicons name={icon} size={20} color={colors.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={s.settingLabel}>{label}</Text>
          {isNew && <View style={s.newBadge}><Text style={s.newBadgeText}>NEW</Text></View>}
        </View>
        <Text style={s.settingSublabel}>{sublabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function BookSettingsScreen({ navigation, route }) {
  const { bookId, bookName } = route.params || {};
  const { currentBusinessId } = useApp();
  
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [memRes, invRes] = await Promise.all([
        getBookMembers(currentBusinessId, bookId),
        getPendingInvitations(currentBusinessId, bookId),
      ]);
      setMembers(memRes.members || memRes || []);
      setInvitations(invRes.invitations || []);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not load data');
    } finally {
      setLoading(false);
    }
  }, [currentBusinessId, bookId]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const renderMember = (item, isPending) => {
    return (
      <View style={s.memberRow} key={item.id}>
        <View style={[s.avatar, { backgroundColor: avatarBg(item.name) }]}>
          <Text style={s.avatarText}>{(item.name || '?')[0].toUpperCase()}</Text>
        </View>
        <View style={s.memberInfo}>
          <View style={s.memberHeaderRow}>
            <Text style={s.memberName}>{item.name || 'Unknown'} {item.is_owner ? '(You)' : ''}</Text>
            <View style={{ flex: 1 }} />
            <View style={[s.roleBadge, item.role === 'Employee' && { backgroundColor: '#E0F2FE' }]}>
              <Text style={[s.roleText, item.role === 'Primary Admin' && s.roleTextAdmin, item.role === 'Employee' && { color: '#0369A1' }]}>{item.role}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray500} style={{ marginLeft: 8 }} />
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
        <Text style={s.title}>Book Settings</Text>
        <TouchableOpacity style={s.headerIconBtn}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.gray700} />
        </TouchableOpacity>
      </View>

      {/* Book Details */}
      <View style={s.bookCard}>
        <View style={{ flex: 1 }}>
          <Text style={s.bookCardLabel}>Cashbook Name</Text>
          <Text style={s.bookCardName}>{bookName}</Text>
        </View>
        <TouchableOpacity style={s.renameBtn} onPress={() => Alert.alert('Rename', 'Rename functionality coming soon.')}>
          <Text style={s.renameText}>RENAME</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={s.sectionTitle}>General Book Settings</Text>
        <View style={s.settingsGroup}>
          <SettingRow icon="grid-outline" label="Entry Field Settings" sublabel="Category, Payment Mode, Party, Custom fields" isNew />
          <View style={s.divider} />
          <SettingRow icon="person-outline" label="Edit Data Operator Role" sublabel="Make changes in role as per your need" />
          <View style={s.divider} />
          <SettingRow icon="time-outline" label="Book Activity" sublabel="Stay updated on all the book activities" />
        </View>

        {loading ? (
          <View style={{ marginTop: 40 }}><ActivityIndicator size="large" color={colors.blue} /></View>
        ) : (
          <>
            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <>
                <Text style={s.sectionTitle}>Pending Invitations ({invitations.length})</Text>
                <View style={[s.settingsGroup, { paddingVertical: 8, paddingHorizontal: 0 }]}>
                  {invitations.map(inv => renderMember(inv, true))}
                </View>
              </>
            )}

            {/* Members */}
            <View style={s.membersHeader}>
              <Text style={s.sectionTitle}>Primary Admin/Admin ({members.length})</Text>
              <TouchableOpacity>
                <Text style={s.viewRolesText}>View Roles</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.settingsGroup, { paddingVertical: 8, paddingHorizontal: 0 }]}>
              {members.map(mem => renderMember(mem, false))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Footer Add Members Button */}
      <View style={s.footer}>
        <TouchableOpacity 
          style={s.addBtn}
          onPress={() => navigation.navigate('AddBookMember', { book: { id: bookId, name: bookName } })}
        >
          <Ionicons name="person-add-outline" size={18} color="#fff" />
          <Text style={s.addBtnText}>ADD MEMBERS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  backBtn: { width: 40, alignItems: 'flex-start' },
  title: { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  headerIconBtn: { width: 40, alignItems: 'flex-end' },
  bookCard: { flexDirection: 'row', alignItems: 'center', padding: spacing[4], backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  bookCardLabel: { fontSize: typography.sm, color: colors.gray500, marginBottom: 4, fontFamily: 'Poppins-Regular' },
  bookCardName: { fontSize: typography.lg, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  renameBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.blue },
  renameText: { color: colors.blue, fontFamily: 'Poppins-Medium', fontSize: typography.sm },
  sectionTitle: { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray500, paddingHorizontal: spacing[4], paddingTop: 20, paddingBottom: 10 },
  settingsGroup: { backgroundColor: '#fff', borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.gray200 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 16 },
  settingIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  settingLabel: { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  settingSublabel: { fontSize: typography.sm, color: colors.gray500, marginTop: 4, fontFamily: 'Poppins-Regular' },
  newBadge: { backgroundColor: '#FEF08A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  newBadgeText: { fontSize: 10, fontFamily: 'Poppins-Medium', color: '#854D0E' },
  divider: { height: 1, backgroundColor: colors.gray100, marginLeft: 76 },
  membersHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: spacing[4] },
  viewRolesText: { color: colors.blue, fontSize: typography.sm, fontFamily: 'Poppins-Medium', marginTop: 10 },
  memberRow: { flexDirection: 'row', paddingHorizontal: spacing[4], paddingVertical: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: '#fff' },
  memberInfo: { flex: 1 },
  memberHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  memberName: { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  iconRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  iconText: { fontSize: typography.sm, color: colors.gray700, marginLeft: 10, fontFamily: 'Poppins-Regular' },
  rowDivider: { height: 1, backgroundColor: colors.gray100, marginVertical: 4 },
  resendBtn: { marginTop: 4, marginBottom: 2 },
  resendText: { fontSize: typography.sm, color: colors.blue, fontFamily: 'Poppins-Medium' },
  roleBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  roleText: { fontSize: 10, fontFamily: 'Poppins-Medium', color: colors.gray700 },
  roleTextAdmin: { color: '#059669', fontFamily: 'Poppins-Regular' },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: spacing[4], backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.gray200 },
  addBtn: { flexDirection: 'row', backgroundColor: colors.blue, paddingVertical: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText: { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 } });
