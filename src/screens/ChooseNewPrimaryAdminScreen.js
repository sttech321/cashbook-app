import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';

export default function ChooseNewPrimaryAdminScreen({ navigation }) {
  // Hardcoded to empty state to match the screenshot design
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.pageTitle}>Choose New Primary Admin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.emptyStateContainer}>
          <View style={s.avatarCircle}>
            <Ionicons name="person" size={32} color="#fff" />
          </View>
          <Text style={s.emptyTitle}>No admins found!</Text>
          <Text style={s.emptySubtitle}>
            Primary Admin role can be assigned only to an admin
          </Text>
        </View>

        <View style={s.separator} />

        <View style={s.bulletContainer}>
          <View style={s.bulletRow}>
            <View style={s.bullet} />
            <Text style={s.bulletText}>Add Admin from business team page</Text>
          </View>
          <View style={s.bulletRow}>
            <View style={s.bullet} />
            <Text style={s.bulletText}>Alternately you can change the role of existing employee to admin</Text>
          </View>
          <View style={s.bulletRow}>
            <View style={s.bullet} />
            <Text style={s.bulletText}>Once you have Admin in your team, then you can assign Primary Admin role to them</Text>
          </View>
        </View>
        {/* 
        <TouchableOpacity style={s.infoBox} onPress={() => alert('Coming Soon!')}>
          <Ionicons name="information-circle" size={20} color={colors.blue} />
          <Text style={s.infoText}>How to change Primary Admin?</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.gray500} />
        </TouchableOpacity> */}
      </ScrollView>

      <View style={s.bottomContainer}>
        <TouchableOpacity style={s.actionBtnDisabled} disabled={true}>
          <Text style={s.actionBtnTextDisabled}>CHANGE PRIMARY ADMIN</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
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
  pageTitle: { fontSize: typography.base, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  emptyStateContainer: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: typography.sm,
    color: colors.gray900,
    marginBottom: 8
  },
  emptySubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.gray600,
    textAlign: 'center'
  },
  separator: {
    width: 24,
    height: 2,
    backgroundColor: colors.gray200,
    alignSelf: 'center',
    marginVertical: 24,
    borderRadius: 1
  },
  bulletContainer: {
    paddingHorizontal: 32,
    gap: 16,
    marginBottom: 32
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gray400,
    marginTop: 5
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.gray700,
    lineHeight: 16
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: 12
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.gray700
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: '#fff',
    padding: 24
  },
  actionBtnDisabled: {
    backgroundColor: colors.gray200,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center'
  },
  actionBtnTextDisabled: {
    color: colors.gray400,
    fontFamily: 'Poppins-SemiBold',
    fontSize: typography.sm,
    letterSpacing: 0.5
  }
});
