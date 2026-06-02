// src/components/UploadCard.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, typography, spacing, radius, shadows } from '../styles/theme';

const UploadCard = ({ onFileSelected, selectedFile }) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const ND = Platform.OS !== 'web';

  const handlePress = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.99, duration: 80, useNativeDriver: ND }),
      Animated.timing(scaleAnim, { toValue: 1,    duration: 80, useNativeDriver: ND }),
    ]).start();
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        if (Platform.OS === 'web' && asset.file) asset._webFile = asset.file;
        onFileSelected(asset);
      }
    } catch (err) {
      console.warn('Document picker error:', err);
    }
  };

  const ext = selectedFile?.name?.split('.').pop()?.toUpperCase();
  const fileSize = selectedFile?.size
    ? selectedFile.size < 1024 * 1024
      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
      : `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
    : null;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity activeOpacity={0.85} onPress={handlePress}
        style={[styles.card, selectedFile && styles.cardFilled]}>

        {selectedFile ? (
          <View style={styles.fileRow}>
            <View style={styles.extBadge}>
              <Text style={styles.extText}>{ext}</Text>
            </View>
            <View style={styles.fileMeta}>
              <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
              {fileSize && <Text style={styles.fileSize}>{fileSize}</Text>}
            </View>
            <TouchableOpacity style={styles.changeBtn} onPress={handlePress}>
              <Text style={styles.changeBtnText}>Replace</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.empty}>
            <View style={styles.uploadMark}>
              <Text style={styles.uploadMarkText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>Select or drop a document</Text>
            <Text style={styles.emptySubtitle}>PDF or DOCX · up to 50 MB</Text>
            <View style={styles.pills}>
              {['PDF', 'DOCX'].map(f => (
                <View key={f} style={styles.pill}>
                  <Text style={styles.pillText}>{f}</Text>
                </View>
              ))}
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderMid,
    padding: spacing.xl,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? shadows.sm : shadows.sm),
  },
  cardFilled: {
    borderStyle: 'solid',
    borderColor: colors.primary,
    minHeight: 'auto',
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
  },

  empty: { alignItems: 'center', gap: spacing.sm },
  uploadMark: {
    width: 44, height: 44, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.borderMid,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  uploadMarkText: {
    fontSize: 24, color: colors.textMuted,
    fontWeight: typography.regular, lineHeight: 28,
  },
  emptyTitle: {
    fontSize: typography.base, fontWeight: typography.medium,
    color: colors.textPrimary,
  },
  emptySubtitle: { fontSize: typography.sm, color: colors.textMuted },
  pills: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  pill: {
    paddingHorizontal: spacing.sm, paddingVertical: 3,
    borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.backgroundAlt,
  },
  pillText: {
    fontSize: typography.xs, fontWeight: typography.semibold,
    color: colors.textMuted, letterSpacing: 1,
  },

  fileRow: { flexDirection: 'row', alignItems: 'center', width: '100%', gap: spacing.md },
  extBadge: {
    width: 42, height: 42, borderRadius: radius.sm,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  extText: {
    fontSize: typography.xs, fontWeight: typography.extrabold,
    color: colors.textInverse, letterSpacing: 0.5,
  },
  fileMeta: { flex: 1 },
  fileName: {
    fontSize: typography.base, fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  fileSize: { fontSize: typography.xs, color: colors.textMuted, marginTop: 2 },
  changeBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.sm, borderWidth: 1,
    borderColor: colors.borderMid, backgroundColor: colors.surface,
  },
  changeBtnText: {
    fontSize: typography.xs, fontWeight: typography.medium,
    color: colors.textSecondary,
  },
});

export default UploadCard;
