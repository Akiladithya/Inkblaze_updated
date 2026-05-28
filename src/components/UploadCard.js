// src/components/UploadCard.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, typography, spacing, radius, shadows } from '../styles/theme';

const UploadCard = ({ onFileSelected, selectedFile }) => {
  const [pressing, setPressing] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    try {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.97,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onFileSelected(result.assets[0]);
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  const fileExtension = selectedFile
    ? selectedFile.name?.split('.').pop()?.toUpperCase()
    : null;

  const fileSize = selectedFile?.size
    ? selectedFile.size < 1024 * 1024
      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
      : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
    : null;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.card, selectedFile && styles.cardFilled]}
      >
        {/* Dashed border overlay */}
        <View style={styles.dashedBorder} />

        {selectedFile ? (
          <View style={styles.fileInfo}>
            <View style={styles.fileIconBadge}>
              <Text style={styles.fileIconText}>{fileExtension}</Text>
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={2}>
                {selectedFile.name}
              </Text>
              {fileSize && <Text style={styles.fileSize}>{fileSize}</Text>}
            </View>
            <View style={styles.changeChip}>
              <Text style={styles.changeChipText}>Change</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.uploadIconCircle}>
              <Text style={styles.uploadArrow}>↑</Text>
            </View>
            <Text style={styles.uploadTitle}>Drop your document here</Text>
            <Text style={styles.uploadSubtitle}>PDF or DOCX supported</Text>
            <View style={styles.formatPills}>
              <View style={styles.pill}>
                <Text style={styles.pillText}>PDF</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillText}>DOCX</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    ...shadows.md,
  },
  cardFilled: {
    borderStyle: 'solid',
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    padding: spacing.lg,
    minHeight: 'auto',
  },
  dashedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  uploadArrow: {
    fontSize: 28,
    color: colors.textInverse,
    fontWeight: typography.bold,
  },
  uploadTitle: {
    fontSize: typography.md,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontSize: typography.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  formatPills: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  pill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
    letterSpacing: 1,
  },

  // File info (filled state)
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing.md,
  },
  fileIconBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  fileIconText: {
    fontSize: typography.xs,
    fontWeight: typography.extrabold,
    color: colors.textInverse,
    letterSpacing: 0.5,
  },
  fileMeta: {
    flex: 1,
  },
  fileName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
    lineHeight: typography.base * typography.normal,
  },
  fileSize: {
    fontSize: typography.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  changeChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    flexShrink: 0,
  },
  changeChipText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.textInverse,
  },
});

export default UploadCard;
