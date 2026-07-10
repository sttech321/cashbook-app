import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Modal,
  ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTeam as getTeamMembers, addTeamMember, updateTeamMember, removeTeamMember } from '../api';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

const INVITE_ROLES = ['viewer', 'editor', 'admin'];

const TEAM_ROLES_CONFIG = [
  {
    key: 'Data Operator',
    label: 'Data Operator',
    permissions: [
      'Add Cash In or Cash Out entries',
      'View entries by everyone',
      'View net balance & download PDF or Excel',
    ],
    restrictions: [
      'Cannot edit or delete entries',
    ],
    info: 'You can change permissions of data operator role from book settings.' },
  {
    key: 'Viewer',
    label: 'Viewer',
    permissions: [
      'View all Cash In and Cash Out entries',
      'View net balance of the book',
    ],
    restrictions: [
      'Cannot add, edit or delete entries',
      'Cannot download reports',
    ],
    info: 'Viewers have read-only access to this business.' },
  {
    key: 'Book Admin',
    label: 'Book Admin',
    permissions: [
      'Add, edit and delete entries',
      'View entries by everyone',
      'View net balance & download PDF or Excel',
      'Manage members and roles in the book',
    ],
    restrictions: [],
    info: 'Book Admins have full control over books they are assigned to.' },
];

const AVATAR_PALETTE = ['#16A34A', '#7C3AED', '#DB2777', '#D97706', '#0891B2', '#DC2626', '#059669', '#EA580C'];
function avatarBg(str) {
  let code = 0;
  for (let i = 0; i < (str || '').length; i++) code += str.charCodeAt(i);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}

function isAdminRole(role) {
  return ['owner', 'admin', 'primary admin', 'primary_admin'].includes((role || '').toLowerCase());
}

// ── Change Role Modal ─────────────────────────────────────────────────────────

function ChangeRoleModal({ visible, member, onClose, onSave }) {
  const currentRole = (() => {
    const r = (member?.role || '').toLowerCase();
    if (r.includes('book admin')) return 'Book Admin';
    if (r.includes('viewer'))     return 'Viewer';
    return 'Data Operator';
  })();
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);

  const roleConfig = TEAM_ROLES_CONFIG.find(r => r.key === selectedRole) || TEAM_ROLES_CONFIG[0];
  const hasChanged = selectedRole !== currentRole;

  const handleSave = async () => {
    if (!hasChanged || saving) return;
    setSaving(true);
    try {
      await onSave(member, selectedRole);
      onClose();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update role');
    } finally {
      setSaving(false);
    }
  };

  // Sync when member changes
  const handleOpen = () => {
    const r = (member?.role || '').toLowerCase();
    if (r.includes('book admin')) setSelectedRole('Book Admin');
    else if (r.includes('viewer')) setSelectedRole('Viewer');
    else setSelectedRole('Data Operator');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={handleOpen}
    >
      <View style={cr.backdrop}>
        <View style={cr.sheet}>
          {/* Header */}
          <View style={cr.header}>
            <TouchableOpacity onPress={onClose} style={cr.closeBtn}>
              <Ionicons name="close" size={24} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={cr.title}>Change {member?.name || 'Member'}'s Role</Text>
          </View>
          <View style={cr.dividerFull} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Role chips */}
            <View style={cr.chipRow}>
              {TEAM_ROLES_CONFIG.map(r => (
                <TouchableOpacity
                  key={r.key}
                  style={[cr.chip, selectedRole === r.key && cr.chipActive]}
                  onPress={() => setSelectedRole(r.key)}
                >
                  <Text style={[cr.chipText, selectedRole === r.key && cr.chipTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Permissions */}
            {roleConfig.permissions.length > 0 && (
              <>
                <Text style={cr.sectionLabel}>{roleConfig.label} Permissions</Text>
                {roleConfig.permissions.map((p, i) => (
                  <View key={i} style={cr.permRow}>
                    <View style={cr.greenCircle}>
                      <Ionicons name="checkmark" size={13} color="#fff" />
                    </View>
                    <Text style={cr.permText}>{p}</Text>
                  </View>
                ))}
              </>
            )}

            {/* Restrictions */}
            {roleConfig.restrictions.length > 0 && (
              <>
                <Text style={cr.sectionLabel}>Restrictions</Text>
                {roleConfig.restrictions.map((r, i) => (
                  <View key={i} style={cr.permRow}>
                    <View style={cr.redCircle}>
                      <Ionicons name="close" size={13} color="#fff" />
                    </View>
                    <Text style={cr.permText}>{r}</Text>
                  </View>
                ))}
              </>
            )}

            <View style={cr.dividerFull} />

            {/* Info note */}
            <View style={cr.infoRow}>
              <Ionicons name="information-circle-outline" size={18} color={colors.gray400} />
              <Text style={cr.infoText}>{roleConfig.info}</Text>
            </View>
          </ScrollView>

          {/* Bottom banner */}
          <View style={cr.banner}>
            <Ionicons name="information-circle" size={18} color={colors.blue} />
            <Text style={cr.bannerText}>This role applies to this business only</Text>
          </View>

          {/* SAVE button */}
          <TouchableOpacity
            style={[cr.saveBtn, hasChanged && cr.saveBtnActive]}
            onPress={handleSave}
            disabled={!hasChanged || saving}
          >
            {saving
              ? <ActivityIndicator color={hasChanged ? '#fff' : colors.gray400} size="small" />
              : <Text style={[cr.saveBtnText, hasChanged && cr.saveBtnTextActive]}>SAVE</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Invite bottom sheet ───────────────────────────────────────────────────────

function InviteModal({ visible, onClose, onInvite }) {
  const [email,  setEmail]  = useState('');
  const [role,   setRole]   = useState('viewer');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!email.trim()) { Alert.alert('Required', 'Enter email address'); return; }
    setSaving(true);
    try {
      await onInvite(email.trim(), role);
      setEmail(''); setRole('viewer'); onClose();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Invite Team Member</Text>
          <Text style={s.label}>Email Address</Text>
          <TextInput
            style={s.input}
            placeholder="colleague@email.com"
            placeholderTextColor={colors.gray400}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />
          <Text style={s.label}>Role</Text>
          <View style={s.roleRow}>
            {INVITE_ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[s.roleChip, role === r && s.roleChipActive]}
                onPress={() => setRole(r)}
              >
                <Text style={[s.roleChipText, role === r && s.roleChipTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.roleDesc}>
            <Text style={s.roleDescText}>
              {role === 'viewer' ? 'Can only view cashbooks and transactions' :
               role === 'editor' ? 'Can add and edit transactions' :
               'Full access — can manage team and settings'}
            </Text>
          </View>
          <TouchableOpacity style={[s.modalBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={s.modalBtnText}>Send Invite</Text>}
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Roles and Permissions Modal ───────────────────────────────────────────────────────────────

function RolesPermissionsModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState('Primary Admin (You)');
  
  const TABS = ['Primary Admin (You)', 'Admin', 'Manager', 'Employee'];
  
  const getContent = () => {
    switch(activeTab) {
      case 'Primary Admin (You)':
        return {
           info: 'Every business can have only one primary admin',
           permissions: [
             'Full access to all books of this business',
             'Full access to business settings',
             'Add/remove members in business'
           ],
           restrictions: []
        };
      case 'Admin':
        return {
           info: '',
           permissions: [
             'Full access to all books of this business',
             'Full access to business settings',
             'Add/remove members in business'
           ],
           restrictions: [
             'Can\'t delete business',
             'Can\'t remove primary admin from business'
           ]
        };
      case 'Manager':
        return {
           info: '',
           permissions: [
             'Limited access to selected books',
             'Primary Admin/Admin can assign Book Admin, Viewer or Data Operator role to Manager in any book'
           ],
           restrictions: [
             'No access to books they are not part of',
             'No option to invite users',
             'No option to delete books'
           ]
        };
      case 'Employee':
        return {
           info: '',
           permissions: [
             'Limited access to selected books',
             'Primary Admin/Admin can assign Book Admin, Viewer or Data Operator role to Employee in any book'
           ],
           restrictions: [
             'No access to books they are not part of',
             'No access to business settings',
             'No option to delete books'
           ]
        };
    }
  };
  
  const content = getContent();
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={rp.overlay}>
        <View style={rp.sheet}>
          <View style={rp.header}>
            <TouchableOpacity onPress={onClose} style={rp.closeBtn}>
              <Ionicons name="close" size={24} color={colors.gray900} />
            </TouchableOpacity>
            <Text style={rp.title}>Roles and Permissions</Text>
          </View>
          
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={rp.tabsContainer}>
               {TABS.map(tab => {
                 const isActive = activeTab === tab;
                 
                 let theme = { text: colors.gray600, bg: '#fff', border: colors.gray200 };
                 if (isActive) {
                   if (tab === 'Primary Admin (You)') theme = { text: '#10B981', bg: '#ECFDF5', border: '#10B981' };
                   else if (tab === 'Admin') theme = { text: '#D97706', bg: '#FFFBEB', border: '#D97706' };
                   else if (tab === 'Manager') theme = { text: '#6366F1', bg: '#EEF2FF', border: '#6366F1' };
                   else if (tab === 'Employee') theme = { text: '#0284C7', bg: '#F0F9FF', border: '#0284C7' };
                 }
                 
                 return (
                   <TouchableOpacity 
                     key={tab} 
                     style={[rp.tab, { borderColor: theme.border, backgroundColor: theme.bg }]}
                     onPress={() => setActiveTab(tab)}
                   >
                     <Text style={[rp.tabText, { color: theme.text }, isActive && { fontFamily: 'Poppins-Medium' }]}>{tab}</Text>
                   </TouchableOpacity>
                 );
               })}
            </ScrollView>
          </View>
          
          <ScrollView contentContainerStyle={rp.contentContainer}>
             {!!content.info && (
               <View style={rp.infoBox}>
                 <Ionicons name="information-circle" size={18} color="#6366F1" />
                 <Text style={rp.infoText}>{content.info}</Text>
               </View>
             )}
             
             <View style={rp.card}>
                <Text style={rp.sectionTitle}>Permissions</Text>
                {content.permissions.map((p, i) => (
                  <View key={i} style={rp.rowItem}>
                    <View style={rp.greenCircle}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                    <Text style={rp.rowText}>{p}</Text>
                  </View>
                ))}
                
                {content.restrictions.length > 0 && (
                  <>
                    <Text style={[rp.sectionTitle, { marginTop: 16 }]}>Restrictions</Text>
                    {content.restrictions.map((r, i) => (
                      <View key={i} style={rp.rowItem}>
                        <View style={rp.redCircle}>
                          <Ionicons name="close" size={14} color="#fff" />
                        </View>
                        <Text style={rp.rowText}>{r}</Text>
                      </View>
                    ))}
                  </>
                )}
             </View>
          </ScrollView>
          
          <View style={rp.footer}>
             <TouchableOpacity style={rp.okBtn} onPress={onClose}>
               <Text style={rp.okBtnText}>OK, GOT IT</Text>
             </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const rp = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '90%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  closeBtn: { padding: 4, marginRight: 8 },
  title: { fontSize: typography.base, fontFamily: 'Poppins-SemiBold', color: colors.gray900 },
  tabsContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 11, fontFamily: 'Poppins-Regular' },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 20 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', padding: 12, borderRadius: radius.md, marginBottom: 16, gap: 10 },
  infoText: { flex: 1, fontSize: 12, fontFamily: 'Poppins-Regular', color: colors.gray700 },
  card: { borderWidth: 1, borderColor: colors.gray200, borderRadius: radius.md, padding: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Poppins-SemiBold', color: colors.gray900, marginBottom: 12 },
  rowItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 12 },
  greenCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  redCircle: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  rowText: { flex: 1, fontSize: 11, fontFamily: 'Poppins-Regular', color: colors.gray700, lineHeight: 18 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.gray200 },
  okBtn: { backgroundColor: colors.blue, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
  okBtnText: { color: '#fff', fontSize: typography.sm, fontFamily: 'Poppins-SemiBold', letterSpacing: 0.5 }
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function TeamScreen({ navigation }) {
  const { currentBusinessId, user } = useApp();
  const [members,        setMembers]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [showInvite,     setShowInvite]     = useState(false);
  const [showMenu,       setShowMenu]       = useState(false);
  const [menuMember,     setMenuMember]     = useState(null);
  const [menuY,          setMenuY]          = useState(0);
  const [showChangeRole, setShowChangeRole] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);

  const load = async () => {
    if (!currentBusinessId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getTeamMembers(currentBusinessId);
      setMembers(data.members || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { load(); }, [currentBusinessId]));

  const handleInvite = async (email, role) => {
    await addTeamMember(currentBusinessId, { email, role });
    await load();
  };

  const openMenu = (member, evt) => {
    setMenuMember(member);
    setMenuY(evt.nativeEvent.pageY);
    setShowMenu(true);
  };

  const handleChangeRole = () => {
    setShowMenu(false);
    setShowChangeRole(true);
  };

  const handleRemove = () => {
    const m = menuMember;
    setShowMenu(false);
    Alert.alert(
      'Remove Member',
      `Remove ${m.name || 'this member'} from the business team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTeamMember(currentBusinessId, m.id);
              await load();
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to remove member');
            }
          } },
      ]
    );
  };

  const handleSaveRole = async (member, newRole) => {
    await updateTeamMember(currentBusinessId, member.id, { role: newRole });
    await load();
  };

  const renderMemberRow = (item) => {
    const initial  = (item.name || item.email || '?')[0].toUpperCase();
    const isMe     = user && (
      (item.user_id && user.id    && item.user_id === user.id) ||
      (item.email   && user.email && item.email   === user.email)
    );
    const adminRole  = isAdminRole(item.role);
    const badgeColor = adminRole ? colors.green : colors.blue;
    const badgeLabel = adminRole ? 'Primary Admin' : (item.role || 'Employee');
    const bg         = avatarBg(item.name || item.email || '');

    return (
      <TouchableOpacity
        key={item.id}
        style={s.memberRow}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('MemberInfo', { member: item })}
      >
        {/* Avatar */}
        <View style={[s.avatar, { backgroundColor: bg }]}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>

        {/* Info */}
        <View style={s.memberInfo}>
          <Text style={s.memberName}>
            {item.name || item.email}
            {isMe ? <Text style={s.youTag}> (You)</Text> : null}
          </Text>
          <View style={s.metaRow}>
            <Ionicons name="newspaper-outline" size={13} color={colors.gray400} />
            <Text style={s.metaText}>
              {isMe ? ' -' : ` - . ${item.bookCount ?? 0} books`}
            </Text>
          </View>
          {(item.mobile || item.phone) ? (
            <View style={s.phoneRow}>
              <Ionicons name="call-outline" size={13} color={colors.gray400} />
              <Text style={s.phoneText}> {item.mobile || item.phone}</Text>
            </View>
          ) : null}
        </View>

        {/* Badge */}
        <View style={[s.roleBadge, { borderColor: badgeColor }]}>
          <Text style={[s.roleBadgeText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>

        {/* Three-dot or chevron */}
        {isMe ? (
          <Ionicons name="chevron-forward" size={18} color={colors.gray400} style={{ marginLeft: 4 }} />
        ) : (
          <TouchableOpacity
            style={s.moreBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={(e) => {
              e.stopPropagation();
              openMenu(item, e);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.gray500} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const admins    = members.filter(m =>  isAdminRole(m.role));
  const employees = members.filter(m => !isAdminRole(m.role));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Business Team</Text>
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => navigation.navigate('TeamHelp')}
        >
          <Ionicons name="help-circle-outline" size={26} color={colors.blue} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.blue} size="large" /></View>
      ) : members.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="people-outline" size={56} color={colors.gray300} />
          <Text style={s.emptyTitle}>No team members yet</Text>
          <Text style={s.emptySub}>Tap "Add Team Member" to invite someone</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
          {admins.length > 0 && (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Primary Admin/Admin ({admins.length})</Text>
              </View>
              {admins.map(renderMemberRow)}
            </>
          )}
          {employees.length > 0 ? (
            <>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Employee ({employees.length})</Text>
              </View>
              {employees.map(renderMemberRow)}
            </>
          ) : (
            <View style={s.treeContainer}>
              <Text style={s.treeTitle}>Add members & assign roles</Text>
              <Text style={s.treeSubtitle}>Give access to limited features & books</Text>

              <View style={s.treeGraphic}>
                <View style={s.treeNode}>
                  <View style={[s.treeAvatar, { backgroundColor: colors.blue }]}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                  <Text style={s.treeNodeLabel}>You (Primary Admin)</Text>
                </View>

                <View style={s.treeBranches}>
                  <View style={[s.branchLine, s.branchLeft]} />
                  <View style={[s.branchLine, s.branchRight]} />
                </View>

                <View style={s.treeBottomNodes}>
                  <View style={s.treeNode}>
                    <View style={[s.treeAvatar, { backgroundColor: '#6366F1' }]}>
                      <Ionicons name="person" size={24} color="#fff" />
                    </View>
                    <Text style={s.treeNodeLabel}>Admin</Text>
                    <Text style={s.treeNodeSub}>(Full access)</Text>
                  </View>
                  <View style={s.treeNode}>
                    <View style={[s.treeAvatar, { backgroundColor: '#0D9488' }]}>
                      <Ionicons name="person" size={24} color="#fff" />
                    </View>
                    <Text style={s.treeNodeLabel}>Employees</Text>
                    <Text style={s.treeNodeSub}>(Limited access)</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Inline three-dot dropdown */}
      {showMenu && menuMember && (
        <>
          <TouchableOpacity
            style={[StyleSheet.absoluteFill, { zIndex: 98 }]}
            activeOpacity={0}
            onPress={() => setShowMenu(false)}
          />
          <View style={[s.dropCard, { top: menuY + 10 }]}>
            <TouchableOpacity style={s.dropItem} onPress={handleChangeRole}>
              <Ionicons name="shield-outline" size={18} color={colors.gray700} style={s.dropIcon} />
              <Text style={s.dropLabel}>Change Role</Text>
            </TouchableOpacity>
            <View style={s.dropDivider} />
            <TouchableOpacity style={s.dropItem} onPress={handleRemove}>
              <Ionicons name="person-remove-outline" size={18} color="#DC2626" style={s.dropIcon} />
              <Text style={[s.dropLabel, { color: '#DC2626' }]}>Remove Member</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Bottom bar */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          style={s.rolesRow}
          onPress={() => setShowRolesModal(true)}
        >
          <Ionicons name="information-circle" size={18} color={colors.blue} />
          <Text style={s.rolesText}>View roles & permissions in detail</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
        </TouchableOpacity>
        <View style={s.addBtnContainer}>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowInvite(true)}>
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={s.addBtnText}>ADD TEAM MEMBER</Text>
          </TouchableOpacity>
        </View>
      </View>

      <InviteModal
        visible={showInvite}
        onClose={() => setShowInvite(false)}
        onInvite={handleInvite}
      />

      <ChangeRoleModal
        visible={showChangeRole}
        member={menuMember}
        onClose={() => setShowChangeRole(false)}
        onSave={handleSaveRole}
      />

      <RolesPermissionsModal 
        visible={showRolesModal}
        onClose={() => setShowRolesModal(false)}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBtn:       { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { flex: 1, textAlign: 'center', fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },

  // Section
  sectionHeader: { paddingHorizontal: spacing[4], paddingVertical: 9, backgroundColor: colors.gray100 },
  sectionTitle:  { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular' },

  // Member row
  memberRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  avatar:        { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText:    { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography['2xl'] },
  memberInfo:    { flex: 1, minWidth: 0 },
  memberName:    { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 4 },
  youTag:        { color: colors.gray500, fontFamily: 'Poppins-Regular' },
  metaRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  metaText:      { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  phoneRow:      { flexDirection: 'row', alignItems: 'center' },
  phoneText:     { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  roleBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1, marginLeft: 8 },
  roleBadgeText: { fontSize: typography.xs, fontFamily: 'Poppins-Medium' },
  moreBtn:       { padding: 6, marginLeft: 4 },

  // Inline dropdown
  dropCard:      { position: 'absolute', right: 16, zIndex: 99, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 4, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, minWidth: 180 },
  dropItem:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16 },
  dropIcon:      { marginRight: 12 },
  dropLabel:     { fontSize: typography.base, color: colors.gray800, fontFamily: 'Poppins-Regular' },
  dropDivider:   { height: 1, backgroundColor: colors.gray100, marginHorizontal: 12 },

  // Empty / loading
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyTitle:    { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray500 },
  emptySub:      { fontSize: typography.base, color: colors.gray400, textAlign: 'center', paddingHorizontal: 32, fontFamily: 'Poppins-Regular' },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.gray200 },
  rolesRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 16, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  rolesText: { flex: 1, fontSize: typography.sm, color: colors.gray700, fontFamily: 'Poppins-Regular' },
  addBtnContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue, paddingVertical: 14, borderRadius: radius.md, gap: 8 },
  addBtnText: { color: '#fff', fontSize: typography.sm, fontFamily: 'Poppins-SemiBold', letterSpacing: 0.5 },

  // Tree Graphic
  treeContainer: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  treeTitle: { fontSize: typography.base, fontFamily: 'Poppins-SemiBold', color: colors.gray900, marginBottom: 4 },
  treeSubtitle: { fontSize: 11, fontFamily: 'Poppins-Regular', color: colors.gray500, marginBottom: 24 },
  treeGraphic: { alignItems: 'center', width: '100%' },
  treeNode: { alignItems: 'center' },
  treeAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  treeNodeLabel: { fontSize: 10, fontFamily: 'Poppins-SemiBold', color: colors.gray900 },
  treeNodeSub: { fontSize: 10, fontFamily: 'Poppins-Regular', color: colors.gray500, marginTop: 2 },
  treeBranches: { flexDirection: 'row', height: 40, width: 140, justifyContent: 'space-between', position: 'relative', marginTop: -8, marginBottom: 4 },
  branchLine: { position: 'absolute', top: 0, width: 80, height: 1, backgroundColor: '#C7D2FE' },
  branchLeft: { left: 0, transform: [{ rotate: '25deg' }], transformOrigin: 'top left' },
  branchRight: { right: 0, transform: [{ rotate: '-25deg' }], transformOrigin: 'top right' },
  treeBottomNodes: { flexDirection: 'row', justifyContent: 'space-between', width: 220 },

  // Invite modal
  overlay:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:             { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle:            { width: 40, height: 4, backgroundColor: colors.gray200, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle:        { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 20 },
  label:             { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray700, marginBottom: 6 },
  input:             { borderWidth: 1.5, borderColor: colors.blue, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 12, fontSize: typography.md, color: colors.gray900, marginBottom: 16, fontFamily: 'Poppins-Regular' },
  roleRow:           { flexDirection: 'row', gap: 8, marginBottom: 10 },
  roleChip:          { flex: 1, paddingVertical: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.gray200, alignItems: 'center' },
  roleChipActive:    { borderColor: colors.blue, backgroundColor: colors.blueLight },
  roleChipText:      { fontSize: typography.sm, color: colors.gray500, textTransform: 'capitalize', fontFamily: 'Poppins-Regular' },
  roleChipTextActive:{ color: colors.blue, fontFamily: 'Poppins-Medium' },
  roleDesc:          { backgroundColor: colors.gray100, borderRadius: radius.md, padding: 10, marginBottom: 20 },
  roleDescText:      { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  modalBtn:          { backgroundColor: colors.blue, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  modalBtnText:      { color: '#fff', fontSize: typography.md, fontFamily: 'Poppins-Medium' } });

// ── Change Role Modal Styles ──────────────────────────────────────────────────

const cr = StyleSheet.create({
  backdrop:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 18, gap: 12 },
  closeBtn:       { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title:          { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, flex: 1 },
  dividerFull:    { height: 1, backgroundColor: colors.gray100 },

  chipRow:        { flexDirection: 'row', gap: 10, padding: 20, paddingBottom: 12 },
  chip:           { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 30, borderWidth: 1.5, borderColor: colors.gray200, backgroundColor: '#fff' },
  chipActive:     { borderColor: colors.blue, backgroundColor: '#EEF2FF' },
  chipText:       { fontSize: typography.base, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  chipTextActive: { color: colors.blue, fontFamily: 'Poppins-Medium' },

  sectionLabel:   { fontSize: typography.sm, color: colors.gray400, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, fontFamily: 'Poppins-Regular' },
  permRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, gap: 14 },
  permText:       { fontSize: typography.md, color: colors.gray800, flex: 1, fontFamily: 'Poppins-Regular' },

  greenCircle:    { width: 28, height: 28, borderRadius: 14, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  redCircle:      { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center' },

  infoRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  infoText:       { fontSize: typography.sm, color: colors.gray400, flex: 1, lineHeight: 20, fontFamily: 'Poppins-Regular' },

  banner:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF2FF', paddingHorizontal: 20, paddingVertical: 14 },
  bannerText:     { fontSize: typography.sm, color: colors.gray600 || colors.gray500, flex: 1, fontFamily: 'Poppins-Regular' },

  saveBtn:        { margin: 16, borderRadius: 12, paddingVertical: 16, alignItems: 'center', backgroundColor: colors.gray100 },
  saveBtnActive:  { backgroundColor: colors.blue },
  saveBtnText:    { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray400, letterSpacing: 0.5 },
  saveBtnTextActive: { color: '#fff', fontFamily: 'Poppins-Regular' } });
