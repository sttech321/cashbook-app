import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';

export default function DeleteSuccessScreen({ navigation }) {
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.container}>
        <View style={s.iconCircle}>
          <Ionicons name="trash" size={40} color={colors.red} />
        </View>
        <Text style={s.title}>Business has been deleted permanently.</Text>
      </View>
      <View style={s.bottomContainer}>
        <TouchableOpacity 
          style={s.btn} 
          onPress={() => navigation.navigate('Main')}
        >
          <Text style={s.btnText}>OK, GOT IT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCE8E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: typography.lg,
    color: colors.gray900,
    textAlign: 'center',
    lineHeight: 28
  },
  bottomContainer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: colors.gray100
  },
  btn: {
    backgroundColor: colors.blue,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    width: '100%'
  },
  btnText: {
    color: '#fff',
    fontFamily: 'Poppins-SemiBold',
    fontSize: typography.sm,
    letterSpacing: 0.5
  }
});
