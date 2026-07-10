import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { deleteTransaction } from '../api';
import { useApp } from '../context/AppContext';
import { colors, typography, radius, spacing } from '../theme';

function fmtDetailDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours(); const m = String(d.getMinutes()).padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `On ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${h}:${m} ${ampm}`;
}

// ── Actions bottom sheet ──────────────────────────────────────────────────────

function ActionsSheet({ visible, onClose, onDelete }) {
  const ACTIONS = [
    { key: 'move',    icon: 'arrow-redo-outline', title: 'Move Entry',          subtitle: 'Entry will be moved to other book' },
    { key: 'copy',    icon: 'copy-outline',       title: 'Copy Entry',          subtitle: 'Entry will stay in both books' },
    { key: 'copyOpp', icon: 'add-outline',        title: 'Copy Opposite Entry', subtitle: 'Cash In entry will be added as Cash out entry in other book and vice versa' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={as.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={as.sheet}>
          {/* Header */}
          <View style={as.header}>
            <TouchableOpacity onPress={onClose} style={as.closeBtn}>
              <Ionicons name="close" size={22} color={colors.gray700} />
            </TouchableOpacity>
            <Text style={as.title}>Actions</Text>
          </View>

          {/* Actions */}
          {ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={as.item}
              onPress={() => { onClose(); Alert.alert(action.title, 'Coming soon.'); }}
            >
              <View style={as.iconBox}>
                <Ionicons name={action.icon} size={22} color={colors.gray700} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={as.itemTitle}>{action.title}</Text>
                <Text style={as.itemSub}>{action.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={as.separator} />

          {/* Delete */}
          <TouchableOpacity style={as.item} onPress={() => { onClose(); onDelete(); }}>
            <View style={as.iconBox}>
              <Ionicons name="trash-outline" size={22} color={colors.red} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[as.itemTitle, { color: colors.red }]}>Delete Entry</Text>
              <Text style={as.itemSub}>Entry will get deleted permanently. There is no way to recover</Text>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ── EntryDetailScreen ─────────────────────────────────────────────────────────

export default function EntryDetailScreen({ route, navigation }) {
  const { transaction, bookId, bookName } = route.params;
  const { currentBusinessId } = useApp();
  const [tx]           = useState(transaction);
  const [showActions, setShowActions] = useState(false);

  const isIN   = tx.type === 'IN';
  const hColor = isIN ? colors.green : colors.red;
  const tags   = [tx.category, tx.paymentMode].filter(Boolean);

  const handleDelete = () => {
    Alert.alert('Delete Entry', 'Entry will be deleted permanently. There is no way to recover.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(currentBusinessId, bookId, tx.id);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.message);
          }
        } },
    ]);
  };

  const handleShare = async () => {
    try {
      const parts = [
        `CashBook Entry`,
        `${isIN ? 'Cash In' : 'Cash Out'}: ₹${tx.amount}`,
        tx.party    ? `Party: ${tx.party}`      : null,
        tx.remarks  ? `Remark: ${tx.remarks}`   : null,
        tx.category ? `Category: ${tx.category}`: null,
        fmtDetailDate(tx.created_at || tx.date),
      ].filter(Boolean);
      await Share.share({ message: parts.join('\n') });
    } catch {}
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Entry Details</Text>
        <View style={s.headerRight}>
          <Ionicons name="cloud-done" size={30} color={colors.green} />
          <TouchableOpacity style={s.iconBtn} onPress={() => setShowActions(true)}>
            <Ionicons name="ellipsis-vertical" size={22} color={colors.gray700} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Main entry card */}
        <View style={s.card}>
          <View style={[s.cardColorBar, { backgroundColor: hColor }]} />
          <View style={s.cardBody}>
            {/* Type + Date */}
            <View style={s.cardTopRow}>
              <Text style={s.typeLabel}>{isIN ? 'Cash In' : 'Cash Out'}</Text>
              <Text style={s.dateLabel}>{fmtDetailDate(tx.created_at || tx.date)}</Text>
            </View>
            {/* Amount */}
            <Text style={[s.amountBig, { color: hColor }]}>{tx.amount}</Text>
            <View style={s.divider} />
            {/* Party */}
            {tx.party ? (
              <Text style={s.partyLine}>
                {tx.party}
                {tx.partyType ? <Text style={s.partyType}> ({tx.partyType})</Text> : null}
              </Text>
            ) : null}
            {/* Remark */}
            {tx.remarks ? <Text style={s.remarkLine}>{tx.remarks}</Text> : null}
            {/* Tags */}
            {tags.length > 0 && (
              <View style={s.tagRow}>
                {tags.map(t => (
                  <View key={t} style={s.tag}>
                    <Text style={s.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Edit button */}
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => navigation.navigate('EditEntry', { transaction: tx, bookId, bookName })}
          >
            <Ionicons name="create-outline" size={18} color={colors.blue} />
            <Text style={s.editBtnText}>EDIT ENTRY</Text>
          </TouchableOpacity>
        </View>

        {/* Meta info */}
        <View style={s.metaSection}>
          <View style={s.metaRow}>
            <Text style={s.metaLabel}>Created By</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.metaValueGreen}>You</Text>
              <Text style={s.metaValueSub}>{fmtDetailDate(tx.created_at || tx.date)}</Text>
            </View>
          </View>
          {tx.transferredFrom ? (
            <View style={s.metaRow}>
              <Text style={s.metaLabel}>Last Transferred From</Text>
              <Text style={s.metaValueBold}>{tx.transferredFrom}</Text>
            </View>
          ) : null}
        </View>

        {/* Add More Fields promo */}
        <View style={s.promoCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.promoTitle}>Add More Fields</Text>
            <Text style={s.promoSub}>Add more details to your entries with custom fields</Text>
          </View>
          <TouchableOpacity style={s.addNowBtn} onPress={() => Alert.alert('Add More Fields', 'Coming soon.')}>
            <Text style={s.addNowText}>ADD NOW</Text>
          </TouchableOpacity>
        </View>

        {/* Team promo */}
        <View style={s.teamCard}>
          <Ionicons name="help-buoy" size={24} color={colors.gray400} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.teamTitle}>Tired of dealing with team expenses? Leave it to us.</Text>
            <Text style={s.teamSub}>With CashBook UPI, Issue separate wallet for each employee &amp; control their expenses</Text>
            <TouchableOpacity style={s.knowMoreBtn} onPress={() => Alert.alert('CashBook UPI', 'Coming soon.')}>
              <Text style={s.knowMoreText}>KNOW MORE</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Share entry */}
      <View style={s.shareBar}>
        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
          <Text style={s.shareBtnText}>SHARE ENTRY</Text>
        </TouchableOpacity>
      </View>

      <ActionsSheet
        visible={showActions}
        onClose={() => setShowActions(false)}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: colors.gray100 },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  iconBtn:        { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle:    { flex: 1, textAlign: 'center', fontSize: typography['2xl'], fontFamily: 'Poppins-Medium', color: colors.gray900 },
  headerRight:    { flexDirection: 'row', alignItems: 'center' },
  card:           { backgroundColor: '#fff', margin: spacing[3], borderRadius: radius['2xl'], overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardColorBar:   { height: 4 },
  cardBody:       { padding: spacing[4] },
  cardTopRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeLabel:      { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  dateLabel:      { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  amountBig:      { fontSize: typography['5xl'], fontFamily: 'Poppins-Medium', marginBottom: 12 },
  divider:        { height: 1, backgroundColor: colors.gray100, marginBottom: 12 },
  partyLine:      { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 6 },
  partyType:      { color: colors.gray500, fontFamily: 'Poppins-Regular' },
  remarkLine:     { fontSize: typography.sm, color: colors.gray600, marginBottom: 8, fontFamily: 'Poppins-Regular' },
  tagRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:            { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1.5, borderColor: '#BFDBFE', backgroundColor: colors.blueLight },
  tagText:        { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.blue },
  editBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.gray100 },
  editBtnText:    { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.blue, letterSpacing: 0.5 },
  metaSection:    { backgroundColor: '#fff', marginHorizontal: spacing[3], marginBottom: spacing[3], borderRadius: radius['2xl'], paddingHorizontal: spacing[4] },
  metaRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  metaLabel:      { fontSize: typography.sm, color: colors.gray500, fontFamily: 'Poppins-Regular' },
  metaValueGreen: { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.green },
  metaValueSub:   { fontSize: typography.xs, color: colors.gray400, marginTop: 2, fontFamily: 'Poppins-Regular' },
  metaValueBold:  { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  promoCard:      { backgroundColor: '#fff', marginHorizontal: spacing[3], marginBottom: spacing[3], borderRadius: radius['2xl'], padding: spacing[4], flexDirection: 'row', alignItems: 'center', gap: 12 },
  promoTitle:     { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  promoSub:       { fontSize: typography.sm, color: colors.gray500, marginTop: 2, fontFamily: 'Poppins-Regular' },
  addNowBtn:      { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.blue },
  addNowText:     { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.blue, letterSpacing: 0.3 },
  teamCard:       { borderWidth: 1.5, borderColor: colors.green, marginHorizontal: spacing[3], marginBottom: spacing[3], borderRadius: radius['2xl'], padding: spacing[4], flexDirection: 'row', gap: 12 },
  teamEmoji:      { fontSize: 28, marginTop: 4, fontFamily: 'Poppins-Regular' },
  teamTitle:      { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 4 },
  teamSub:        { fontSize: typography.sm, color: colors.gray500, marginBottom: 12, fontFamily: 'Poppins-Regular' },
  knowMoreBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.green, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.lg },
  knowMoreText:   { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.sm, letterSpacing: 0.5 },
  shareBar:       { position: 'absolute', bottom: 0, left: 0, right: 0 },
  shareBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.green, paddingVertical: 18 },
  shareBtnText:   { color: '#fff', fontFamily: 'Poppins-Medium', fontSize: typography.md, letterSpacing: 0.5 } });

// ── ActionsSheet styles ───────────────────────────────────────────────────────

const as = StyleSheet.create({
  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet:     { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header:    { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing[4], paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  closeBtn:  { width: 28 },
  title:     { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  item:      { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingHorizontal: spacing[4], paddingVertical: 18 },
  iconBox:   { width: 28, alignItems: 'center', marginTop: 1 },
  itemTitle: { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900, marginBottom: 3 },
  itemSub:   { fontSize: typography.sm, color: colors.gray500, lineHeight: 18, fontFamily: 'Poppins-Regular' },
  separator: { height: 1, backgroundColor: colors.gray200, marginHorizontal: spacing[4] } });
