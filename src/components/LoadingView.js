// src/components/LoadingView.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { colors, typography, spacing, radius, IS_MOBILE } from '../styles/theme';

const ND = Platform.OS !== 'web';

const STEPS = [
  'Extracting document text',
  'Scoring sentences with TF-IDF',
  'Placing highlight annotations',
  'Generating comprehension questions',
  'Assembling final PDF',
];

const displayFont = Platform.OS === 'web'
  ? { fontFamily: "'Cormorant Garamond', Georgia, serif" }
  : { fontFamily: 'Georgia' };

const LoadingView = ({ uploadProgress }) => {
  const spinAnim  = useRef(new Animated.Value(0)).current;
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: ND })
    ).start();
  }, []);

  useEffect(() => {
    Animated.stagger(700, stepAnims.map(anim =>
      Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: ND, easing: Easing.out(Easing.ease) })
    )).start();
  }, []);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <View style={styles.spinnerWrap}>
        <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]} />
        <View style={styles.spinnerCore}>
          <Text style={styles.spinnerLabel}>INNK</Text>
        </View>
      </View>

      <Text style={styles.title}>Analysing your document</Text>
      <Text style={styles.subtitle}>This takes around 20–40 seconds</Text>

      {uploadProgress !== undefined && uploadProgress < 100 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>Uploading — {uploadProgress}%</Text>
        </View>
      )}

      <View style={styles.steps}>
        {STEPS.map((label, i) => (
          <Animated.View key={i} style={[styles.stepRow, {
            opacity: stepAnims[i],
            transform: [{ translateY: stepAnims[i].interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
          }]}>
            <Text style={styles.stepIndex}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={styles.stepLabel}>{label}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center',
    paddingVertical: IS_MOBILE ? spacing.xl : spacing['2xl'],
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },

  spinnerWrap: {
    width: 72, height: 72,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xl,
  },
  spinnerRing: {
    position: 'absolute', width: 72, height: 72, borderRadius: 36,
    borderWidth: 1.5, borderColor: colors.border,
    borderTopColor: colors.gold,
  },
  spinnerCore: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  spinnerLabel: {
    fontSize: 10, fontWeight: typography.bold,
    color: colors.primary, letterSpacing: 2,
    ...displayFont,
  },

  title: {
    fontSize: IS_MOBILE ? typography.xl : typography['2xl'],
    fontWeight: '600', color: colors.ink,
    textAlign: 'center', marginBottom: spacing.xs,
    ...displayFont,
  },
  subtitle: {
    fontSize: typography.sm, color: colors.textMuted,
    textAlign: 'center', marginBottom: spacing.xl,
    letterSpacing: 0.2,
  },

  progressWrap: { width: '100%', maxWidth: 300, marginBottom: spacing.xl },
  progressTrack: {
    height: 2, backgroundColor: colors.border,
    borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: radius.full },
  progressLabel: {
    fontSize: typography.xs, color: colors.textMuted,
    textAlign: 'center', marginTop: spacing.xs, letterSpacing: 0.5,
  },

  steps: { width: '100%', maxWidth: 340 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  stepIndex: {
    fontSize: typography.xs, fontWeight: typography.bold,
    color: colors.gold, width: 22, letterSpacing: 0.5,
    ...displayFont,
  },
  stepLabel: {
    fontSize: typography.sm, color: colors.textSecondary, flex: 1,
  },
});

export default LoadingView;
