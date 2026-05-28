// src/screens/HomeScreen.js

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import UploadCard from '../components/UploadCard';
import { highlightText } from '../services/api';
import { colors, typography, spacing, radius, shadows } from '../styles/theme';

const HomeScreen = ({ navigation }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const ctaBtnScale = useRef(new Animated.Value(1)).current;

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setError('');
  };

  const handlePressIn = () => {
    Animated.spring(ctaBtnScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(ctaBtnScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a PDF or DOCX file first.');
      return;
    }
    setError('');

    navigation.navigate('Processing', {
      file: {
        uri: selectedFile.uri,
        name: selectedFile.name,
        mimeType: selectedFile.mimeType,
        size: selectedFile.size,
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>TF-IDF  ·  AI MCQ  ·  PDF Export</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>
            Smart{'\n'}Document{'\n'}Highlighter
          </Text>
          <Text style={styles.heroSubtitle}>
            Upload any PDF or DOCX. We extract the most important sentences,
            highlight them, generate MCQs, and return a polished PDF.
          </Text>
        </View>

        {/* Feature chips */}
        <View style={styles.featureRow}>
          {[
            { icon: '🎯', label: 'TF-IDF Scoring' },
            { icon: '✨', label: 'AI Highlights' },
            { icon: '📝', label: 'Auto MCQs' },
          ].map((f) => (
            <View key={f.label} style={styles.featureChip}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>

        {/* Upload section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SELECT DOCUMENT</Text>
          <UploadCard
            onFileSelected={handleFileSelected}
            selectedFile={selectedFile}
          />
        </View>

        {/* Error */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        )}

        {/* CTA */}
        <Animated.View style={{ transform: [{ scale: ctaBtnScale }] }}>
          <TouchableOpacity
            style={[
              styles.ctaButton,
              !selectedFile && styles.ctaButtonDisabled,
            ]}
            onPress={handleSubmit}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.85}
            disabled={!selectedFile}
          >
            <Text style={styles.ctaText}>Generate Highlights  →</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Info footer */}
        <Text style={styles.footerNote}>
          Processing happens locally on your backend at localhost:5000
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },

  // Hero
  hero: {
    marginBottom: spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  badgeText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.warning,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: typography['3xl'],
    fontWeight: typography.extrabold,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    lineHeight: typography['3xl'] * 1.15,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    fontSize: typography.base,
    color: colors.textSecondary,
    lineHeight: typography.base * typography.relaxed,
  },

  // Feature chips
  featureRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    flexWrap: 'wrap',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  featureIcon: {
    fontSize: 14,
  },
  featureLabel: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },

  // Section
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.xs,
    fontWeight: typography.extrabold,
    letterSpacing: 1.5,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  // Error
  errorBox: {
    backgroundColor: colors.errorLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },

  // CTA
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 4,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.textMuted,
    ...shadows.sm,
  },
  ctaText: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    color: colors.textInverse,
    letterSpacing: 0.3,
  },

  footerNote: {
    fontSize: typography.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default HomeScreen;
