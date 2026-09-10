import React from 'react';
import {
  Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space, type } from '@/constants/tokens';

interface AuthShellProps {
  /** Small mono label above the title. One per screen, never per section. */
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Only for real state, such as a declined or suspended clearance. */
  badge?: { label: string; tone: 'warn' | 'danger' } | null;
  /** Centres a short body, for the boot screen. Forms stay top-aligned. */
  center?: boolean;
  children: React.ReactNode;
}

/**
 * Chrome shared by the boot, sign-in and approval screens.
 *
 * The three used to render the same floating white card: radius 18, a heavy
 * drop shadow, a pill badge with a coloured dot, and a centred blue eyebrow.
 * A card earns its elevation by separating itself from competing content, and
 * on a screen holding one form there is nothing to compete with. So the card
 * is gone. What is left is the dashboard's own arrangement: the operational
 * shell as a dark band carrying identity, then the light canvas below it
 * holding the work, the two divided by a single hairline.
 */
export default function AuthShell({
  eyebrow, title, subtitle, badge, center, children,
}: AuthShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          /* Styles on the content container, not the ScrollView. On the
           * ScrollView the insets are ignored and the footer sits under the
           * system navigation bar. */
          contentContainerStyle={[
            styles.content,
            center && styles.contentCentered,
            {
              paddingLeft: insets.left,
              paddingRight: insets.right,
              paddingBottom: insets.bottom + space.xl,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.band, { paddingTop: insets.top + space.lg }]}>
            <Image
              source={require('../../imgfolder/download-removebg-preview.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            {badge ? (
              <View style={[styles.badge, badge.tone === 'danger' && styles.badgeDanger]}>
                <Text style={[
                  type.badge,
                  styles.badgeLabel,
                  badge.tone === 'danger' && styles.badgeLabelDanger,
                ]}>
                  {badge.label}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={[styles.body, center && styles.bodyCentered]}>{children}</View>

          <Text style={styles.footer}>
            Utopia Security And Safety Solutions Inc.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.canvas },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  contentCentered: { justifyContent: 'center' },

  /* The operational shell, same ground as the app header. */
  band: {
    backgroundColor: color.shell,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    gap: space.xs,
  },
  logo: { width: 56, height: 63, marginBottom: space.sm },
  eyebrow: { ...type.label, color: color.shellMuted },
  title: { ...type.title, color: color.shellInk, fontSize: 26, letterSpacing: -0.5 },
  subtitle: { ...type.body, color: color.shellMuted, marginTop: space.xs },

  badge: {
    alignSelf: 'flex-start', marginTop: space.sm,
    borderWidth: 1, borderColor: color.warnInk, backgroundColor: color.warnBg,
    paddingHorizontal: space.sm, paddingVertical: 3,
  },
  badgeDanger: { borderColor: color.dangerInk, backgroundColor: color.dangerBg },
  badgeLabel: { color: color.warnInk },
  badgeLabelDanger: { color: color.dangerInk },

  body: { flexGrow: 1 },
  bodyCentered: { justifyContent: 'center' },

  footer: {
    ...type.dataMuted,
    paddingHorizontal: space.lg, paddingTop: space.xl,
  },
});
