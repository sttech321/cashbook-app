import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  confirmText:{ fontSize: typography.md, fontFamily: 'Poppins-Medium', color: '#fff' }
});

function SettingRow({ icon, iconBg, label, sublabel, onPress, isDanger }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress || (() => Alert.alert('Coming Soon', 'This feature will be available soon.'))}>
      <View style={[s.iconWrap, { backgroundColor: iconBg || '#EFF6FF' }]}>
        <Ionicons name={icon} size={20} color={isDanger ? colors.red : colors.blue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.label, isDanger && { color: colors.gray900 }]}>{label}</Text>
        {sublabel ? <Text style={s.sublabel}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.gray300} />
    </TouchableOpacity>
  );
}

export default function BusinessSettingsScreen({ navigation }) {
  const [modal, setModal] = useState(null);

  const confirmDelete = () => {
    setModal({
      title: 'Delete Business',
      message: 'All your data for this business will be permanently deleted. This cannot be undone.',
      confirmText: 'Delete',
      isDanger: true,
      onConfirm: () => {
        setModal(null);
        setModal({
          title: 'Request Sent',
          message: 'Business deletion request has been submitted.',
          confirmText: 'OK',
          isDanger: false,
          onConfirm: () => setModal(null)
        });
      }
    });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.pageTitle}>Business Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.container}>
        <Text style={s.sectionHeader}>General</Text>
        <View style={s.section}>
          <SettingRow 
            icon="business-outline" 
            label="Business Profile" 
            sublabel="Add or Edit Business details" 
            onPress={() => navigation.navigate('BusinessProfile')} 
          />
          <View style={s.divider} />
          <SettingRow 
            icon="swap-horizontal-outline" 
            iconBg="#FEF2F2"
            label="Change Primary Admin" 
            sublabel="Current Primary Admin: You" 
            isDanger={true}
            onPress={() => navigation.navigate('ChangePrimaryAdmin')}
          />
          <View style={s.divider} />
          <SettingRow 
            icon="trash-outline" 
            iconBg="#FEF2F2"
            label="Delete Business" 
            sublabel="Delete all the data of this business permanently" 
            isDanger={true}
            onPress={() => navigation.navigate('DeleteBusiness')}
          />
        </View>
      </View>

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
  safe: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    backgroundColor: '#fff', 
    paddingHorizontal: spacing[2], 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100
  },
  backBtn: { padding: spacing[2] },
  pageTitle: { fontSize: typography.xl, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  container: { flex: 1 },
  sectionHeader: { fontSize: typography.sm, fontFamily: 'Poppins-Medium', color: colors.gray500, paddingHorizontal: spacing[4], paddingVertical: 12, marginTop: 4 },
  section: { backgroundColor: '#fff' },
  divider: { height: 1, backgroundColor: colors.gray100, marginLeft: 68 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing[4], paddingVertical: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: typography.md, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  sublabel: { fontSize: typography.sm, color: colors.gray400, marginTop: 1, fontFamily: 'Poppins-Regular' }
});
