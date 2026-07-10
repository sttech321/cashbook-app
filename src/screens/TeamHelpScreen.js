import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';

export default function TeamHelpScreen({ navigation }) {
  const [feedback, setFeedback] = useState(null);


  const handleContactUs = () => {
    Linking.openURL('whatsapp://send?text=Hello%20CashBook%20Support');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.gray900} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.paragraph}>
          In a <b>Business team,</b> some roles have the permission to manage other roles. Managing roles means the members have the permission to add certain roles, edit roles, remove, change roles, etc., in the business/book.
        </Text>

        <Text style={s.paragraph}>
          ● Primary Admin can manage other Admins. Other admins cannot manage Primary Admin.
        </Text>

        <Text style={s.paragraph}>
          ● Business Admins can manage all Employee Roles. Employee Roles consist of Book Admins, Data Operators and Viewers.
        </Text>

        <Text style={s.paragraph}>
          ● Book Admins can add and remove Data Operators and Viewers.
        </Text>

        <Text style={s.paragraph}>
          ● Data Operators and Viewers cannot take action on any members or add them.
        </Text>

        <Text style={s.paragraph}>
          A business team can have two kinds of members:
        </Text>

        <Text style={s.paragraph}>
          a) Business Roles: Primary Admin/Admin
        </Text>

        <Text style={s.paragraph}>
          b) Employee Roles: Book Admins, Data Operators and Viewers
        </Text>

        {/* Feedback Card */}
        <View style={s.feedbackCard}>
          <Text style={s.feedbackText}>Was this helpful?</Text>
          <View style={s.feedbackActions}>
            <TouchableOpacity onPress={() => setFeedback('up')} style={s.feedbackBtn}>
              <Ionicons name="thumbs-up-outline" size={22} color={feedback === 'up' ? '#10B981' : colors.gray500} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFeedback('down')} style={s.feedbackBtn}>
              <Ionicons name="thumbs-down-outline" size={22} color={feedback === 'down' ? '#EF4444' : colors.gray500} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer Support */}
      {/* <View style={s.footer}>
        <View style={{ flex: 1 }}>
          <Text style={s.footerTitle}>Need more support?</Text>
          <Text style={s.footerSub}>Send us a message</Text>
        </View>
        <TouchableOpacity style={s.contactBtn} onPress={handleContactUs}>
          <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          <Text style={s.contactText}>CONTACT US</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  iconBtn: { padding: 4, marginLeft: -4, alignSelf: 'flex-start' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  paragraph: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: colors.gray800,
    lineHeight: 20,
    marginBottom: 20
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 20,
    marginBottom: 20
  },
  feedbackText: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: colors.gray900
  },
  feedbackActions: {
    flexDirection: 'row',
    gap: 16
  },
  feedbackBtn: {
    padding: 4
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray100
  },
  footerTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: colors.gray900
  },
  footerSub: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: colors.gray500
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
    gap: 8
  },
  contactText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5
  }
});
