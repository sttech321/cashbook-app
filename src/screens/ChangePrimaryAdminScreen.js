import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';

export default function ChangePrimaryAdminScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={s.pageTitle}>Change Primary Admin</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <View style={s.warningBanner}>
          <Ionicons name="warning" size={40} color={colors.red} style={s.warningIcon} />
          <Text style={s.warningText}>
            This will transfer all your permissions to new Primary Admin
          </Text>
        </View>

        <View style={s.bulletContainer}>
          <View style={s.bulletRow}>
            <View style={s.bullet} />
            <Text style={s.bulletText}>Every business can have only one Primary Admin</Text>
          </View>
          <View style={s.bulletRow}>
            <View style={s.bullet} />
            <Text style={s.bulletText}>Once you set a new Primary Admin, your role will be changed to Admin</Text>
          </View>
          <View style={s.bulletRow}>
            <View style={s.bullet} />
            <Text style={s.bulletText}>New Primary Admin can remove you from business or delete the business</Text>
          </View>
          <View style={s.bulletRow}>
            <View style={s.bullet} />
            <Text style={s.bulletText}>You will not be able to reverse this.</Text>
          </View>
        </View>
      </ScrollView>

      <View style={s.bottomContainer}>
        <View style={s.nextStepRow}>
          <Text style={s.nextStepText}>Next Step:</Text>
          <Text style={s.nextStepBold}>Choose New Primary Admin</Text>
        </View>
        <TouchableOpacity 
          style={s.nextBtn}
          onPress={() => navigation.navigate('ChooseNewPrimaryAdmin')}
        >
          <Text style={s.nextBtnText}>NEXT</Text>
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
  },
  backBtn: { padding: spacing[2] },
  pageTitle: { fontSize: typography.lg, fontFamily: 'Poppins-Medium', color: colors.gray900 },
  container: { flex: 1 },
  content: { paddingBottom: 40 },
  warningBanner: {
    backgroundColor: '#FCE8E8',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 24
  },
  warningIcon: {
    marginBottom: 16
  },
  warningText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: typography.sm,
    color: colors.gray800,
    textAlign: 'center',
    lineHeight: 20
  },
  bulletContainer: {
    paddingHorizontal: 24,
    gap: 16
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
    marginTop: 6
  },
  bulletText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: typography.xs,
    color: colors.gray700,
    lineHeight: 18
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: '#fff'
  },
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB'
  },
  nextStepText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.gray500,
    marginRight: 4
  },
  nextStepBold: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.gray800
  },
  nextBtn: {
    backgroundColor: colors.blue,
    marginHorizontal: 24,
    marginBottom: 24,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center'
  },
  nextBtnText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: typography.sm,
    letterSpacing: 0.5
  }
});
