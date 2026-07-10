import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors, typography, spacing, radius } from '../theme';

function formatBookDate(createdAt, updatedAt) {
  const hasUpdates = updatedAt && updatedAt !== createdAt;
  const prefix = hasUpdates ? 'Updated' : 'Created';
  const iso = hasUpdates ? updatedAt : createdAt;
  if (!iso) return '';
  const d = new Date(iso);
  const diffMs  = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr  = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1)  return `${prefix} just now`;
  if (diffHr  < 1)  return `${prefix} ${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffDay < 1)  return `${prefix} ${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 7)  return `${prefix} ${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${prefix} on ${months[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`;
}

function formatBalance(val) {
  const n = Number(val ?? 0);
  if (n === 0) return '0';
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export default function BookSearchScreen({ navigation, route }) {
  const { cashbooks } = useApp();
  const bookBalances = route.params?.bookBalances ?? {};
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? cashbooks.filter(b => b.name?.toLowerCase().includes(search.toLowerCase()))
    : cashbooks;

  const renderBook = ({ item, index }) => {
    const netBalance = bookBalances[item.id] ?? Number(item.balance ?? 0);
    const hasBalance = item.id in bookBalances;

    return (
      <TouchableOpacity
        style={[s.bookCard, index > 0 && s.bookCardBorder]}
        onPress={() => navigation.navigate('TransactionView', { bookId: item.id, bookName: item.name })}
      >
        <View style={s.bookIcon}>
          <Ionicons name="bookmark" size={24} color="#4F60F0" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bookName}>{item.name}</Text>
          <Text style={s.bookMeta}>{formatBookDate(item.created_at, item.updated_at)}</Text>
        </View>
        <View style={s.bookRight}>
          {hasBalance ? (
            <Text style={[s.bookBalance, { color: netBalance < 0 ? colors.red : colors.green }]}>
              {formatBalance(netBalance)}
            </Text>
          ) : (
            <ActivityIndicator size="small" color={colors.gray300} style={{ marginRight: 4 }} />
          )}
          <View style={s.moreBtn}>
            <Ionicons name="ellipsis-vertical" size={18} color={colors.gray400} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.gray700} />
        </TouchableOpacity>
        <TextInput
          style={s.input}
          placeholder="Search by book name"
          placeholderTextColor={colors.gray400}
          value={search}
          onChangeText={setSearch}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && Platform.OS === 'android' && (
          <TouchableOpacity onPress={() => setSearch('')} style={s.clearBtn}>
            <Ionicons name="close-circle" size={18} color={colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.divider} />

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderBook}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={filtered.length === 0 ? { flex: 1 } : undefined}
        ListEmptyComponent={
          search.trim() ? (
            <View style={s.empty}>
              <Ionicons name="search-outline" size={40} color={colors.gray200} />
              <Text style={s.emptyText}>No books found for "{search}"</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#fff' },
  header:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 10, backgroundColor: '#fff', gap: 8 },
  backBtn:       { width: 32, alignItems: 'flex-start', justifyContent: 'center' },
  input:         {
    flex: 1,
    fontSize: typography.lg,
    color: colors.gray900,
    paddingVertical: 6,
    // No border, no outline — clean look matching native reference
    borderWidth: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? { outlineWidth: 0, outlineStyle: 'none', fontFamily: 'Poppins-Regular' } : {}) },
  clearBtn:      { paddingHorizontal: 4 },
  divider:       { height: 1, backgroundColor: colors.gray100 },
  bookCard:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: spacing[4], backgroundColor: '#fff' },
  bookCardBorder:{ borderTopWidth: 1, borderTopColor: colors.gray100 },
  bookIcon:      { width: 48, height: 48, borderRadius: 12, backgroundColor: '#DDDEFF', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  bookName:      { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  bookMeta:      { fontSize: typography.sm, color: colors.gray400, marginTop: 2, fontFamily: 'Poppins-Regular' },
  bookRight:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bookBalance:   { fontSize: typography['2xl'], fontFamily: 'Poppins-Medium' },
  moreBtn:       { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyText:     { fontSize: typography.base, color: colors.gray400, fontFamily: 'Poppins-Regular' } });
