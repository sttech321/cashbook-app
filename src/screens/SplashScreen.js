import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography } from '../theme';

export default function SplashScreen() {
  const scale = new Animated.Value(0.8);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={s.container}>
      <Animated.View style={[s.logoWrap, { transform: [{ scale }], opacity }]}>
        <View style={s.logoIcon}>
          <Text style={s.logoLetter}>C</Text>
        </View>
        <Text style={s.logoText}>CashBook</Text>
        <Text style={s.tagline}>Business Expense Management</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  logoWrap:  { alignItems: 'center', gap: 12 },
  logoIcon:  { width: 80, height: 80, borderRadius: 18, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', shadowColor: colors.blue, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  logoLetter:{ color: '#fff', fontSize: 42, fontFamily: 'Poppins-Medium' },
  logoText:  { fontSize: typography['4xl'], fontFamily: 'Poppins-Medium', color: colors.blue },
  tagline:   { fontSize: typography.base, color: colors.gray400, fontFamily: 'Poppins-Regular' } });
