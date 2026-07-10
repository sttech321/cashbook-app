import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCashbooks, assignMemberBook } from '../api';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

// Role definitions matching the native reference
const BOOK_ROLES = [
  {
    key: 'Book Admin',
    desc: 'Full access to entries & book settings',
    iconName: 'shield-checkmark-outline',
    iconColor: '#16A34A',
    iconBg:    '#DCFCE7' },
  {
    key: 'Data Operator',
    desc: 'Only add entry access',
    iconName: 'create-outline',
    iconColor: '#7C3AED',
    iconBg:    '#EDE9FE' },
  {
    key: 'Viewer',
    desc: 'Only view entries & reports access',
    iconName: 'eye-outline',
    iconColor: '#0891B2',
    iconBg:    '#CFFAFE' },
];

export default function AddMemberToBooksScreen({ navigation, route }) {
  const { member } = route.params;
  const { currentBusinessId } = useApp();

  const [step,         setStep]         = useState(1);           // 1 = select role, 2 = select books
  const [selectedRole, setSelectedRole] = useState('Book Admin');
  const [books,        setBooks]        = useState([]);
  const [selectedBooks,setSelectedBooks]= useState(new Set());
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    if (step === 2) loadBooks();
  }, [step]);

  const loadBooks = async () => {
    setLoadingBooks(true);
    try {
      const data = await getCashbooks(currentBusinessId);
      setBooks(data.cashbooks || []);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setLoadingBooks(false); }
  };

  const toggleBook = (bookId) => {
    setSelectedBooks(prev => {
      const next = new Set(prev);
      next.has(bookId) ? next.delete(bookId) : next.add(bookId);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedBooks.size === 0) {
      Alert.alert('Select books', 'Please select at least one book');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        [...selectedBooks].map(bookId =>
          assignMemberBook(currentBusinessId, member.id, { bookId, role: selectedRole })
        )
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally { setSaving(false); }
  };

  const memberName = member.name || member.email || 'member';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          Add {memberName} to books
        </Text>
        <View style={s.iconBtn} />
      </View>

      {step === 1 ? (
        /* ── Step 1: Role selection ── */
        <>
          <ScrollView contentContainerStyle={s.scrollContent}>
            <Text style={s.stepTitle}>Roles of employee members in books</Text>
            <Text style={s.stepSub}>Give them limited access to books of your choice</Text>

            <View style={s.roleHandle} />

            {BOOK_ROLES.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={[s.roleCard, selectedRole === role.key && s.roleCardActive]}
                onPress={() => setSelectedRole(role.key)}
                activeOpacity={0.8}
              >
                <View style={[s.roleIconBg, { backgroundColor: role.iconBg }]}>
                  <Ionicons name={role.iconName} size={26} color={role.iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.roleCardTitle}>{role.key}</Text>
                  <Text style={s.roleCardDesc}>{role.desc}</Text>
                </View>
                {selectedRole === role.key && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.blue} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bottom bar */}
          <View style={s.bottomBar}>
            <Text style={s.nextStepText}>
              Next Step: <Text style={{ fontFamily: 'Poppins-Medium' }}>Select books</Text>
            </Text>
            <TouchableOpacity style={s.actionBtn} onPress={() => setStep(2)}>
              <Text style={s.actionBtnText}>NEXT</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        /* ── Step 2: Book selection ── */
        <>
          {loadingBooks ? (
            <View style={s.center}>
              <ActivityIndicator color={colors.blue} size="large" />
            </View>
          ) : books.length === 0 ? (
            <View style={s.center}>
              <Ionicons name="bookmarks-outline" size={48} color={colors.gray300} />
              <Text style={s.emptyText}>No cashbooks found</Text>
            </View>
          ) : (
            <FlatList
              data={books}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 120 }}
              ItemSeparatorComponent={() => <View style={s.listDivider} />}
              renderItem={({ item }) => {
                const checked = selectedBooks.has(item.id);
                return (
                  <TouchableOpacity
                    style={s.bookSelectRow}
                    onPress={() => toggleBook(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.checkbox, checked && s.checkboxSelected]}>
                      {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View style={s.bookSelectIcon}>
                      <Ionicons name="bookmark" size={18} color={colors.blue} />
                    </View>
                    <Text style={s.bookSelectName}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          {/* Bottom bar */}
          <View style={s.bottomBar}>
            <Text style={s.nextStepText}>
              {selectedBooks.size > 0
                ? <><Text style={{ fontFamily: 'Poppins-Medium' }}>{selectedBooks.size}</Text> book{selectedBooks.size !== 1 ? 's' : ''} selected</>
                : 'Select books to add'}
            </Text>
            <TouchableOpacity
              style={[s.actionBtn, saving && { opacity: 0.6 }]}
              onPress={handleAdd}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.actionBtnText}>ADD</Text>}
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F5F5F5' },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[3], paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBtn:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },

  // Step 1 — role
  scrollContent: { padding: spacing[4], paddingBottom: 120 },
  stepTitle:     { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 6 },
  stepSub:       { fontSize: typography.md, color: colors.gray500, marginBottom: 20, fontFamily: 'Poppins-Regular' },
  roleHandle:    { width: 44, height: 4, borderRadius: 2, backgroundColor: colors.gray300, alignSelf: 'center', marginBottom: 24 },

  roleCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing[4], marginBottom: spacing[3], gap: 14, borderWidth: 1.5, borderColor: colors.gray200 },
  roleCardActive: { borderColor: colors.blue, backgroundColor: colors.blueLight },
  roleIconBg:     { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  roleCardTitle:  { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 3 },
  roleCardDesc:   { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular' },

  // Step 2 — books
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:      { fontSize: typography.xl, color: colors.gray400, fontFamily: 'Poppins-Regular' },
  listDivider:    { height: 1, backgroundColor: colors.gray100 },

  bookSelectRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: spacing[4], paddingVertical: 16, gap: 14 },
  checkbox:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.gray300, alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
  bookSelectIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  bookSelectName: { flex: 1, fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },

  // Bottom bar
  bottomBar:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#F5F5F5', borderTopWidth: 1, borderTopColor: colors.gray200 },
  nextStepText:  { fontSize: typography.sm, color: colors.gray500, textAlign: 'center', paddingTop: 12, paddingBottom: 8, fontFamily: 'Poppins-Regular' },
  actionBtn:     { backgroundColor: colors.blue, marginHorizontal: spacing[4], marginBottom: 20, paddingVertical: 17, borderRadius: radius.lg, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: typography.xl, fontFamily: 'Poppins-Medium', letterSpacing: 0.5 } });
