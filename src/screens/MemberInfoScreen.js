import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { updateTeamMember, removeTeamMember, getMemberBooks } from '../api';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

// ─── helpers ─────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = ['#16A34A', '#7C3AED', '#DB2777', '#D97706', '#0891B2', '#DC2626', '#059669', '#EA580C'];
function avatarBg(str) {
  let code = 0;
  for (let i = 0; i < (str || '').length; i++) code += str.charCodeAt(i);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}
function isAdminRole(role) {
  return ['owner', 'admin', 'primary admin', 'primary_admin'].includes((role || '').toLowerCase());
}
function formatMemberSince(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `Member Since ${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Sheet wrapper ────────────────────────────────────────────────────────────

function Sheet({ visible, onClose, title, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.sheetHeader}>
            <TouchableOpacity onPress={onClose} style={s.sheetCloseBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={s.sheetTitle}>{title}</Text>
          </View>
          <ScrollView>{children}</ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── PermissionsSheet ─────────────────────────────────────────────────────────

const ADMIN_PERMISSIONS  = [
  'Full access to all books of this business',
  'Full access to business settings',
  'Add/remove members in business',
];
const EMP_PERMISSIONS = [
  'Limited access to selected books',
  'Primary Admin/Admin can assign Book Admin, Viewer or Data Operator role to Employee in any book',
];
const EMP_RESTRICTIONS = [
  'No access to books they are not part of',
  'No access to business settings',
  'No option to delete books',
];

function PermissionsSheet({ visible, onClose, isAdmin }) {
  return (
    <Sheet visible={visible} onClose={onClose} title={isAdmin ? 'Primary Admin Permissions' : 'Employee Permissions'}>
      {isAdmin && (
        <View style={s.infoBanner}>
          <Ionicons name="information-circle" size={18} color={colors.blue} />
          <Text style={s.infoBannerText}>Every business can have only one primary admin</Text>
        </View>
      )}
      <Text style={s.permSection}>Permissions</Text>
      {(isAdmin ? ADMIN_PERMISSIONS : EMP_PERMISSIONS).map((p, i) => (
        <View key={i} style={s.permRow}>
          <View style={[s.permDot, { backgroundColor: colors.green }]}>
            <Ionicons name="checkmark" size={13} color="#fff" />
          </View>
          <Text style={s.permText}>{p}</Text>
        </View>
      ))}
      {!isAdmin && (
        <>
          <Text style={[s.permSection, { marginTop: 16 }]}>Restrictions</Text>
          {EMP_RESTRICTIONS.map((r, i) => (
            <View key={i} style={s.permRow}>
              <View style={[s.permDot, { backgroundColor: colors.red }]}>
                <Ionicons name="close" size={13} color="#fff" />
              </View>
              <Text style={s.permText}>{r}</Text>
            </View>
          ))}
        </>
      )}
      <View style={{ height: 16 }} />
    </Sheet>
  );
}

// ─── BooksSheet ───────────────────────────────────────────────────────────────

function BooksSheet({ visible, onClose, books, loading }) {
  return (
    <Sheet visible={visible} onClose={onClose} title={`Books (${books.length})`}>
      {loading ? (
        <ActivityIndicator color={colors.blue} style={{ marginVertical: 24 }} />
      ) : books.length === 0 ? (
        <Text style={s.sheetEmpty}>No books assigned yet</Text>
      ) : (
        books.map((b, i) => (
          <View key={b.bookId || i}>
            {i > 0 && <View style={s.sheetDivider} />}
            <View style={s.bookSheetRow}>
              <View style={s.bookSheetIcon}>
                <Ionicons name="bookmark" size={18} color={colors.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.bookSheetName}>{b.bookName}</Text>
                <Text style={s.bookSheetAccess}>{b.role || 'Full Access'}</Text>
              </View>
            </View>
          </View>
        ))
      )}
      <View style={{ height: 16 }} />
    </Sheet>
  );
}

// ─── AddEmployeeIDSheet ───────────────────────────────────────────────────────

function AddEmployeeIDSheet({ visible, onClose, currentId, onSave }) {
  const [value, setValue] = useState(currentId || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setValue(currentId || ''); }, [visible, currentId]);

  const submit = async () => {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await onSave(value.trim());
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setSaving(false); }
  };

  const canSave = !!value.trim();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.sheetHeader}>
            <TouchableOpacity onPress={onClose} style={s.sheetCloseBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={s.sheetTitle}>Add Employee ID</Text>
          </View>
          <View style={{ paddingHorizontal: spacing[4], paddingTop: 16, paddingBottom: 40 }}>
            <View style={s.empIdField}>
              <Text style={[s.empIdFloatLabel, { color: canSave ? colors.blue : colors.gray500 }]}>Employee ID</Text>
              <TextInput
                style={s.empIdInput}
                value={value}
                onChangeText={setValue}
                autoFocus
              />
            </View>
            <TouchableOpacity
              style={[s.saveBtn, canSave ? s.saveBtnActive : s.saveBtnDisabled]}
              onPress={submit}
              disabled={!canSave || saving}
            >
              {saving
                ? <ActivityIndicator color={colors.gray500} size="small" />
                : (
                  <>
                    <Ionicons name="checkmark" size={16} color={canSave ? '#fff' : colors.gray500} />
                    <Text style={[s.saveBtnText, canSave && s.saveBtnTextActive]}>SAVE</Text>
                  </>
                )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── ChangeRoleSheet ──────────────────────────────────────────────────────────

const ADMIN_PERM_LIST  = ADMIN_PERMISSIONS;
const ADMIN_RESTRICTION_LIST = [
  "Can't delete business",
  "Can't remove primary admin from business",
];

function ChangeRoleSheet({ visible, onClose, member, onConfirm }) {
  const [saving, setSaving] = useState(false);
  const bg = avatarBg(member?.name || member?.email || '');
  const initial = (member?.name || member?.email || '?')[0].toUpperCase();

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.sheetHeader}>
            <TouchableOpacity onPress={onClose} style={s.sheetCloseBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={s.sheetTitle}>Change role to Admin</Text>
          </View>

          {/* Member preview card */}
          <View style={[s.changeMemberCard, { borderLeftColor: bg }]}>
            <View style={[s.changeMemberAvatar, { backgroundColor: bg }]}>
              <Text style={s.changeMemberAvatarText}>{initial}</Text>
            </View>
            <View>
              <Text style={s.changeMemberName}>{member?.name || member?.email}</Text>
              <Text style={s.changeMemberSub}>{member?.mobile || member?.email || ''}</Text>
            </View>
          </View>

          <Text style={s.permSection}>Permissions</Text>
          {ADMIN_PERM_LIST.map((p, i) => (
            <View key={i} style={s.permRow}>
              <View style={[s.permDot, { backgroundColor: colors.green }]}>
                <Ionicons name="checkmark" size={13} color="#fff" />
              </View>
              <Text style={s.permText}>{p}</Text>
            </View>
          ))}

          <Text style={[s.permSection, { marginTop: 16 }]}>Restrictions</Text>
          {ADMIN_RESTRICTION_LIST.map((r, i) => (
            <View key={i} style={s.permRow}>
              <View style={[s.permDot, { backgroundColor: colors.red }]}>
                <Ionicons name="close" size={13} color="#fff" />
              </View>
              <Text style={s.permText}>{r}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={[s.changeRoleBtn, saving && { opacity: 0.6 }]}
            onPress={handleConfirm}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.changeRoleBtnText}>CHANGE ROLE TO ADMIN</Text>}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── RemoveModal ──────────────────────────────────────────────────────────────

function RemoveModal({ visible, onClose, member, onConfirm }) {
  const [removing, setRemoving] = useState(false);
  const name = member?.name || member?.email || 'member';

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onConfirm();
    } catch (err) {
      Alert.alert('Error', err.message);
      setRemoving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.removeOverlay}>
        <View style={s.removeModal}>
          <Text style={s.removeTitle}>Remove {name}?</Text>
          <Text style={s.removeSub}>Are you sure?</Text>
          <View style={{ gap: 8, marginBottom: 24 }}>
            <View style={s.removeBullet}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>{name} will lose access to this business & it's books</Text>
            </View>
            <View style={s.removeBullet}>
              <View style={s.bulletDot} />
              <Text style={s.bulletText}>
                We will also notify {name} that they have been removed from this business.
              </Text>
            </View>
          </View>
          <View style={s.removeButtons}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelBtnText}>CANCEL</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.removeBtn, removing && { opacity: 0.6 }]}
              onPress={handleRemove}
              disabled={removing}
            >
              {removing
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.removeBtnText}>REMOVE</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MemberInfoScreen({ navigation, route }) {
  const { currentBusinessId, user } = useApp();
  const [member, setMember] = useState(route.params.member);
  const [memberBooks, setMemberBooks]   = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(true);

  const [showPermissions, setShowPermissions] = useState(false);
  const [showBooks,        setShowBooks]       = useState(false);
  const [showEmpId,        setShowEmpId]       = useState(false);
  const [showChangeRole,   setShowChangeRole]  = useState(false);
  const [showRemove,       setShowRemove]      = useState(false);

  const adminRole  = isAdminRole(member.role);
  const isMe       = user && (
    (member.user_id && user.id    && member.user_id === user.id) ||
    (member.email   && user.email && member.email   === user.email)
  );
  const bg         = avatarBg(member.name || member.email || '');
  const initial    = (member.name || member.email || '?')[0].toUpperCase();
  const badgeColor = adminRole ? colors.green : colors.blue;
  const badgeLabel = (member.role === 'Primary Admin' || member.is_owner) ? 'Primary Admin' : (adminRole ? 'Admin' : 'Employee');

  useEffect(() => {
    getMemberBooks(currentBusinessId, member.id)
      .then(d => setMemberBooks(d.books || []))
      .catch(() => {})
      .finally(() => setLoadingBooks(false));
  }, []);

  const handleSaveEmpId = async (empId) => {
    await updateTeamMember(currentBusinessId, member.id, { employee_id: empId });
    setMember(prev => ({ ...prev, employee_id: empId }));
  };

  const handleChangeRole = async () => {
    await updateTeamMember(currentBusinessId, member.id, { role: 'Admin' });
    setMember(prev => ({ ...prev, role: 'Admin' }));
  };

  const handleRemove = async () => {
    await removeTeamMember(currentBusinessId, member.id);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {adminRole ? 'Primary Admin Info' : 'Employee Info'}
        </Text>
        {!adminRole ? (
          <TouchableOpacity
            style={s.iconBtn}
            onPress={() => {
              if (member.mobile) Alert.alert('Contact', member.mobile);
            }}
          >
            <Ionicons name="call-outline" size={22} color={colors.blue} />
          </TouchableOpacity>
        ) : <View style={s.iconBtn} />}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Member card ── */}
        <View style={s.memberCard}>
          <View style={s.memberCardTop}>
            <View style={[s.avatar, { backgroundColor: bg }]}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.memberCardName}>{isMe ? 'You' : (member.name || member.email)}</Text>
              <Text style={s.memberCardSince}>{formatMemberSince(member.created_at)}</Text>
            </View>
            <View style={[s.roleBadge, { borderColor: badgeColor }]}>
              <Text style={[s.roleBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
            </View>
          </View>

          <View style={s.cardDivider} />

          {/* Employee ID */}
          <TouchableOpacity
            style={s.infoRow}
            onPress={() => !member.is_owner && setShowEmpId(true)}
            activeOpacity={member.is_owner ? 1 : 0.7}
          >
            <View style={s.infoIconWrap}>
              <Ionicons name="id-card-outline" size={20} color={colors.gray500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Employee ID</Text>
              {member.employee_id
                ? <Text style={s.infoValue}>{member.employee_id}</Text>
                : <Text style={s.infoLink}>Add Employee ID</Text>}
            </View>
          </TouchableOpacity>

          {/* Contact */}
          <View style={s.infoRow}>
            <View style={s.infoIconWrap}>
              <Ionicons name="call-outline" size={20} color={colors.gray500} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoLabel}>Contact number</Text>
              <Text style={s.infoValue}>{member.mobile || '-'}</Text>
            </View>
          </View>
        </View>

        {/* ── Gray separator ── */}
        <View style={s.separator} />

        {/* ── Permissions — own white card ── */}
        <View style={s.section}>
          <TouchableOpacity style={s.sectionRow} onPress={() => setShowPermissions(true)}>
            <View style={[s.sectionIconBg, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="shield-checkmark" size={22} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionRowTitle}>
                {adminRole ? 'Primary Admin Permissions' : 'Employee Permissions'}
              </Text>
              <Text style={s.sectionRowSub}>
                {adminRole
                  ? 'List of actions Primary Admin can take'
                  : 'List of actions Employee can take'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
          </TouchableOpacity>
        </View>

        {/* ── Add to books — own white card, employees only ── */}
        {!adminRole && (
          <>
            <View style={s.separator} />
            <View style={s.section}>
              <TouchableOpacity
                style={s.sectionRow}
                onPress={() => navigation.navigate('AddMemberToBooks', { member })}
              >
                <View style={[s.sectionIconBg, { backgroundColor: colors.gray100, borderWidth: 1, borderColor: colors.gray200 }]}>
                  <Ionicons name="add" size={22} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionRowTitle, { color: colors.blue }]}>Add to books</Text>
                  <Text style={s.sectionRowSub}>Add & Assign Role</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Books — own white card, admins only ── */}
        {adminRole && (
          <>
            <View style={s.separator} />
            <View style={s.section}>
              <TouchableOpacity style={s.sectionRow} onPress={() => setShowBooks(true)}>
                <View style={[s.sectionIconBg, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="bookmark" size={22} color={colors.blue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.sectionRowTitle}>
                    {loadingBooks ? 'Books' : `Books (${memberBooks.length})`}
                  </Text>
                  <Text style={s.sectionRowSub}>List of accessible books</Text>
                </View>
                {loadingBooks
                  ? <ActivityIndicator size="small" color={colors.gray400} />
                  : <Ionicons name="chevron-forward" size={18} color={colors.gray400} />}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Action rows — non-admin, non-self, each own white card with icon ── */}
        {!adminRole && !isMe && (
          <>
            <View style={s.separator} />
            {/* Change role to Admin */}
            <View style={s.section}>
              <TouchableOpacity style={s.sectionRow} onPress={() => setShowChangeRole(true)}>
                <View style={[s.sectionIconBg, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="person-add-outline" size={22} color={colors.blue} />
                </View>
                <Text style={[s.sectionRowTitle, { color: colors.blue }]}>Change role to Admin</Text>
              </TouchableOpacity>
            </View>

            <View style={s.separator} />
            {/* Remove from business */}
            <View style={s.section}>
              <TouchableOpacity style={s.sectionRow} onPress={() => setShowRemove(true)}>
                <View style={[s.sectionIconBg, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="person-remove-outline" size={22} color={colors.red} />
                </View>
                <Text style={[s.sectionRowTitle, { color: colors.red }]}>Remove from business</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Modals / Sheets ── */}
      <PermissionsSheet
        visible={showPermissions}
        onClose={() => setShowPermissions(false)}
        isAdmin={adminRole}
      />
      <BooksSheet
        visible={showBooks}
        onClose={() => setShowBooks(false)}
        books={memberBooks}
        loading={loadingBooks}
      />
      <AddEmployeeIDSheet
        visible={showEmpId}
        onClose={() => setShowEmpId(false)}
        currentId={member.employee_id}
        onSave={handleSaveEmpId}
      />
      <ChangeRoleSheet
        visible={showChangeRole}
        onClose={() => setShowChangeRole(false)}
        member={member}
        onConfirm={handleChangeRole}
      />
      <RemoveModal
        visible={showRemove}
        onClose={() => setShowRemove(false)}
        member={member}
        onConfirm={handleRemove}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },

  // Member card
  memberCard:     { backgroundColor: '#fff', marginBottom: 0 },
  memberCardTop:  { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: 12 },
  avatar:         { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText:     { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography['2xl'] },
  memberCardName: { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  memberCardSince:{ fontSize: typography.sm, color: colors.gray400, marginTop: 3, fontFamily: 'Poppins-Regular' },
  roleBadge:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1 },
  roleBadgeText:  { fontSize: typography.sm, fontFamily: 'Poppins-Medium' },
  cardDivider:    { height: 1, backgroundColor: colors.gray100, marginHorizontal: spacing[4] },
  infoRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing[4], paddingVertical: 14, gap: 14 },
  infoIconWrap:   { width: 28, alignItems: 'center', paddingTop: 2 },
  infoLabel:      { fontSize: typography.sm, color: colors.gray500, marginBottom: 4, fontFamily: 'Poppins-Regular' },
  infoValue:      { fontSize: typography.md, color: colors.gray900, fontFamily: 'Poppins-Regular' },
  infoLink:       { fontSize: typography.md, color: colors.blue, fontFamily: 'Poppins-Regular' },

  // Layout separators
  separator: { height: 8, backgroundColor: '#F5F5F5' },

  // White section card
  section:     { backgroundColor: '#fff' },
  sectionRow:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 14, gap: 14 },
  sectionIconBg:  { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  sectionRowTitle:{ fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  sectionRowSub:  { fontSize: typography.sm, color: colors.gray500, marginTop: 2, fontFamily: 'Poppins-Regular' },
  rowDivider:     { height: 1, backgroundColor: colors.gray100, marginLeft: spacing[4] + 14 + 46 },

  // Sheet shared
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:        { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingBottom: 32 },
  sheetHeader:  { flexDirection: 'row', alignItems: 'center', padding: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  sheetCloseBtn:{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sheetTitle:   { flex: 1, fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginLeft: 4 },

  // Permissions sheet
  infoBanner:     { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EFF6FF', borderRadius: radius.md, padding: 12, margin: spacing[4], gap: 8 },
  infoBannerText: { flex: 1, fontSize: typography.sm, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  permSection:    { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, paddingHorizontal: spacing[4], paddingTop: 16, paddingBottom: 8 },
  permRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing[4], paddingVertical: 8, gap: 12 },
  permDot:        { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  permText:       { flex: 1, fontSize: typography.md, color: colors.gray800, lineHeight: 20, fontFamily: 'Poppins-Regular' },

  // Books sheet
  sheetEmpty:     { textAlign: 'center', color: colors.gray400, paddingVertical: 32, fontSize: typography.md, fontFamily: 'Poppins-Regular' },
  sheetDivider:   { height: 1, backgroundColor: colors.gray100, marginHorizontal: spacing[4] },
  bookSheetRow:   { flexDirection: 'row', alignItems: 'center', padding: spacing[4], gap: 14 },
  bookSheetIcon:  { width: 42, height: 42, borderRadius: 10, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  bookSheetName:  { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  bookSheetAccess:{ fontSize: typography.sm, color: colors.gray500, marginTop: 2, fontFamily: 'Poppins-Regular' },

  // Employee ID sheet
  empIdField:       { borderWidth: 1.5, borderColor: colors.blue, borderRadius: radius.lg, padding: 12, marginBottom: 20 },
  empIdFloatLabel:  { fontSize: typography.sm, marginBottom: 4, fontFamily: 'Poppins-Regular' },
  empIdInput:       { fontSize: typography.md, color: colors.gray900, paddingVertical: 4, fontFamily: 'Poppins-Regular' },
  saveBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg, paddingVertical: 14, gap: 8 },
  saveBtnActive:    { backgroundColor: colors.blue },
  saveBtnDisabled:  { backgroundColor: colors.gray200 },
  saveBtnText:      { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray500 },
  saveBtnTextActive:{ color: '#fff', fontFamily: 'Poppins-Regular' },

  // Change role sheet
  changeMemberCard:     { flexDirection: 'row', alignItems: 'center', margin: spacing[4], padding: spacing[4], borderRadius: radius.lg, borderWidth: 1, borderLeftWidth: 4, borderColor: colors.gray200, gap: 14 },
  changeMemberAvatar:   { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  changeMemberAvatarText: { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.xl },
  changeMemberName:     { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  changeMemberSub:      { fontSize: typography.sm, color: colors.gray500, marginTop: 2, fontFamily: 'Poppins-Regular' },
  changeRoleBtn:        { margin: spacing[4], marginTop: 24, backgroundColor: colors.blue, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  changeRoleBtnText:    { color: '#fff', fontSize: typography.xl, fontFamily: 'Poppins-Medium', letterSpacing: 0.5 },

  // Remove modal
  removeOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing[4] },
  removeModal:    { backgroundColor: '#fff', borderRadius: radius['2xl'], padding: spacing[5], width: '100%', maxWidth: 380 },
  removeTitle:    { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 6 },
  removeSub:      { fontSize: typography.md, color: colors.gray600, marginBottom: 16, fontFamily: 'Poppins-Regular' },
  removeBullet:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.gray500, marginTop: 7, flexShrink: 0 },
  bulletText:     { flex: 1, fontSize: typography.sm, color: colors.gray700, lineHeight: 19, fontFamily: 'Poppins-Regular' },
  removeButtons:  { flexDirection: 'row', gap: 12 },
  cancelBtn:      { flex: 1, borderWidth: 1.5, borderColor: colors.blue, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText:  { color: colors.blue, fontSize: typography.md, fontFamily: 'Poppins-Medium', letterSpacing: 0.5 },
  removeBtn:      { flex: 1, backgroundColor: colors.red, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  removeBtnText:  { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium', letterSpacing: 0.5 } });
