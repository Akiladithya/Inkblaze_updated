// src/components/LoadingView.js

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { colors, typography, spacing, radius } from '../styles/theme';

const STEPS = [
  { label: 'Extracting document text…', icon: '📄' },
  { label: 'Scoring sentences with TF-IDF…', icon: '📊' },
  { label: 'Highlighting key sentences…', icon: '✏️' },
  { label: 'Generating MCQs with AI…', icon: '🤖' },
  { label: 'Assembling your PDF…', icon: '📎' },
];

const LoadingView = ({ uploadProgress }) => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  const stepAnims = useRef(STEPS.map(() => new Animated.Value(0))).current;

  // Spinner
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Staggered step animations
  useEffect(() => {
    const animations = stepAnims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: i * 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      })
    );
    Animated.stagger(600, animations).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      {/* Spinner Ring */}
      <Animated.View
        style={[styles.spinnerOuter, { transform: [{ scale: pulseAnim }] }]}
      >
        <Animated.View
          style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]}
        />
        <View style={styles.spinnerInner}>
          <Text style={styles.spinnerEmoji}>⚡</Text>
        </View>
      </Animated.View>

      <Text style={styles.title}>Processing your document</Text>
      <Text style={styles.subtitle}>This may take a minute for large files</Text>

      {/* Upload progress bar (shown during upload) */}
      {uploadProgress !== undefined && uploadProgress < 100 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${uploadProgress}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>
            Uploading… {uploadProgress}%
          </Text>
        </View>
      )}

      {/* Steps */}
      <View style={styles.stepsList}>
        {STEPS.map((step, i) => (
          <Animated.View
            key={i}
            style={[
              styles.stepRow,
              {
                opacity: stepAnims[i],
                transform: [
                  {
                    translateX: stepAnims[i].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <Text style={styles.stepLabel}>{step.label}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },

  // Spinner
  spinnerOuter: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  spinnerRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'transparent',
    borderTopColor: colors.accent,
    borderRightColor: colors.primary,
  },
  spinnerInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerEmoji: {
    fontSize: 30,
  },

  title: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },

  // Progress bar
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  progressLabel: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },

  // Steps
  stepsList: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.sm,
  },
  stepIcon: {
    fontSize: 18,
  },
  stepLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default LoadingView;
