// src/screens/AuthScreen.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Platform, StatusBar, Animated, ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, typography, spacing, radius, shadows, IS_MOBILE } from '../styles/theme';

const ND = Platform.OS !== 'web';
const DF = Platform.OS === 'web' ? { fontFamily: "'Cormorant Garamond', Georgia, serif" } : { fontFamily: 'Georgia' };

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode,  setMode]  = useState('login');
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [pw,    setPw]    = useState('');
  const [error, setError] = useState('');
  const [busy,  setBusy]  = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn  = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: ND }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: ND }).start();

  const submit = async () => {
    setError('');
    if (!email.trim() || !pw) { setError('Email and password are required.'); return; }
    if (mode === 'register' && !name.trim()) { setError('Please enter your name.'); return; }
    setBusy(true);
    try {
      mode === 'login'
        ? await login(email.trim().toLowerCase(), pw)
        : await register(name.trim(), email.trim().toLowerCase(), pw);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => { setMode(m => m === 'login' ? 'register' : 'login'); setError(''); };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.nav}>
          <Text style={styles.wordmark}>INNK</Text>
          <Text style={styles.navSub}>Document Intelligence</Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.proverb}>
          <Text style={styles.proverbMark}>"</Text>
          <Text style={styles.proverbText}>The art of being wise is knowing what to overlook.</Text>
          <Text style={styles.proverbAuthor}>— William James</Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.cardSub}>
            {mode === 'login'
              ? 'Sign in to access your documents and history.'
              : 'Start surfacing what matters in your documents.'}
          </Text>

          {mode === 'register' && (
            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName}
                placeholder="Your name" placeholderTextColor={colors.textMuted}
                autoCapitalize="words" />
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="you@example.com" placeholderTextColor={colors.textMuted}
              keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput style={styles.input} value={pw} onChangeText={setPw}
              placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
              placeholderTextColor={colors.textMuted} secureTextEntry />
          </View>

          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity style={styles.btn} onPress={submit}
              onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.88} disabled={busy}>
              {busy
                ? <ActivityIndicator color={colors.textInverse} size="small" />
                : <Text style={styles.btnText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </Text>
            <TouchableOpacity onPress={toggle}>
              <Text style={styles.toggleLink}>{mode === 'login' ? 'Register' : 'Sign in'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>Processed locally · no data leaves your machine</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: IS_MOBILE ? spacing.md : spacing.xl,
    paddingTop: IS_MOBILE ? spacing.xl : spacing['2xl'],
    paddingBottom: spacing['3xl'],
    maxWidth: 480, alignSelf: 'center', width: '100%',
  },

  nav: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: spacing.lg },
  wordmark: { fontSize: typography.lg, fontWeight: typography.bold, color: colors.ink, letterSpacing: 5, ...DF },
  navSub: { fontSize: typography.xs, color: colors.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' },

  rule: { height: 1, backgroundColor: colors.border, marginBottom: spacing.lg },

  proverb: { paddingVertical: spacing.lg, paddingHorizontal: spacing.sm, marginBottom: spacing.lg },
  proverbMark: { fontSize: IS_MOBILE ? 40 : 56, color: colors.gold, lineHeight: IS_MOBILE ? 30 : 42, marginBottom: spacing.xs, ...DF },
  proverbText: {
    fontSize: IS_MOBILE ? typography.lg : typography.xl, fontStyle: 'italic',
    color: colors.ink, lineHeight: (IS_MOBILE ? typography.lg : typography.xl) * 1.4,
    marginBottom: spacing.sm, ...DF,
  },
  proverbAuthor: { fontSize: typography.sm, color: colors.textMuted, fontWeight: typography.medium },

  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: IS_MOBILE ? spacing.lg : spacing.xl,
    marginBottom: spacing.lg,
    ...(Platform.OS === 'web' ? shadows.md : shadows.md),
  },
  cardTitle: { fontSize: IS_MOBILE ? typography.xl : typography['2xl'], fontWeight: '600', color: colors.ink, marginBottom: spacing.xs, ...DF },
  cardSub: { fontSize: typography.sm, color: colors.textSecondary, lineHeight: typography.sm * 1.6, marginBottom: spacing.lg },

  field: { marginBottom: spacing.md },
  label: { fontSize: typography.xs, fontWeight: typography.semibold, color: colors.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.backgroundAlt, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md,
    paddingVertical: IS_MOBILE ? 12 : 14,
    fontSize: typography.base, color: colors.textPrimary,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
  },

  errorBox: { backgroundColor: colors.errorSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.error + '30' },
  errorText: { color: colors.error, fontSize: typography.sm },

  btn: {
    backgroundColor: colors.ink, borderRadius: radius.md,
    paddingVertical: IS_MOBILE ? 14 : 16, alignItems: 'center', marginBottom: spacing.lg,
    ...(Platform.OS === 'web' ? shadows.md : shadows.md),
  },
  btnText: { fontSize: typography.base, fontWeight: typography.semibold, color: colors.textInverse, letterSpacing: 0.3 },

  toggleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xs },
  toggleText: { fontSize: typography.sm, color: colors.textMuted },
  toggleLink: { fontSize: typography.sm, fontWeight: typography.semibold, color: colors.primary },

  footer: { fontSize: typography.xs, color: colors.textMuted, textAlign: 'center', letterSpacing: 0.3 },
});
