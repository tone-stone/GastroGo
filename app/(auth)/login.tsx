import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LOGIN_MODES, getLoginModeAccent, type LoginMode } from '@/constants/auth';
import { colors, kitchenAccent, radius, shadows, typography, brandGradient } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useSessionStore } from '@/stores/sessionStore';

const posFeatures = [
  { icon: 'grid-outline' as const, text: 'Mesas en tiempo real' },
  { icon: 'receipt-outline' as const, text: 'Comandas digitales' },
  { icon: 'card-outline' as const, text: 'Cobro integrado' },
];

export default function LoginScreen() {
  const signIn = useSessionStore((s) => s.signIn);
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [mode, setMode] = useState<LoginMode>('sale');
  const [email, setEmail] = useState('demo@gastrogo.app');
  const [password, setPassword] = useState('demo1234');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedMode = LOGIN_MODES.find((m) => m.id === mode)!;

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password, mode);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {isWide ? (
          <LinearGradient
            colors={[...brandGradient]}
            style={styles.heroPanel}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.logoLarge}>
              <Ionicons name="restaurant" size={40} color="#FFF" />
            </View>
            <Text style={styles.heroTitle}>GastroGo</Text>
            <Text style={styles.heroSubtitle}>
              El POS moderno para restaurantes que quieren operar más rápido y con menos errores.
            </Text>
            <View style={styles.features}>
              {posFeatures.map((f) => (
                <View key={f.text} style={styles.feature}>
                  <View style={styles.featureIcon}>
                    <Ionicons name={f.icon} size={18} color={colors.primary} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        ) : null}

        <View style={[styles.formPanel, isWide && styles.formPanelWide]}>
          {!isWide ? (
            <View style={styles.mobileHero}>
              <LinearGradient
                colors={[...brandGradient]}
                style={styles.logo}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="restaurant" size={28} color="#FFF" />
              </LinearGradient>
              <Text style={styles.title}>GastroGo</Text>
              <Text style={styles.subtitle}>Punto de venta para restaurantes</Text>
            </View>
          ) : (
            <Text style={styles.formTitle}>Iniciar sesión</Text>
          )}

          <View style={styles.form}>
            <Text style={styles.modeLabel}>¿Cómo vas a entrar?</Text>
            <View style={[styles.modeList, isWide && styles.modeListWide]}>
              {LOGIN_MODES.map((option) => {
                const active = mode === option.id;
                const accent = getLoginModeAccent(option.id);
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.modeCard,
                      isWide ? styles.modeCardWide : styles.modeCardStack,
                      active && { borderColor: accent, backgroundColor: `${accent}10` },
                    ]}
                    onPress={() => setMode(option.id)}
                  >
                    <View style={[styles.modeCardInner, !isWide && styles.modeCardInnerRow]}>
                      <View style={[styles.modeIcon, { backgroundColor: `${accent}18` }]}>
                        <Ionicons name={option.icon} size={22} color={accent} />
                      </View>
                      <View style={styles.modeCardText}>
                        <Text style={[styles.modeTitle, active && { color: accent }]}>
                          {option.title}
                        </Text>
                        <Text style={styles.modeSub} numberOfLines={2}>
                          {option.subtitle}
                        </Text>
                      </View>
                    </View>
                    {active ? (
                      <View style={[styles.modeCheck, { backgroundColor: accent }]}>
                        <Ionicons name="checkmark" size={12} color="#FFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Input
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder={
                mode === 'admin'
                  ? 'admin@gastrogo.app'
                  : mode === 'kitchen'
                    ? 'cocina@gastrogo.app'
                    : mode === 'waiter'
                      ? 'mesero@gastrogo.app'
                      : 'caja@gastrogo.app'
              }
              icon="mail-outline"
            />
            <Input
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••••"
              icon="lock-closed-outline"
              rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
              onRightIconPress={() => setShowPassword((v) => !v)}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            <Button
              title={
                mode === 'admin'
                  ? 'Entrar al panel admin'
                  : mode === 'kitchen'
                    ? 'Entrar a cocina'
                    : mode === 'waiter'
                      ? 'Entrar como mesero'
                      : 'Entrar a venta'
              }
              onPress={handleLogin}
              loading={loading}
              size="lg"
              icon={selectedMode.icon}
              variant={mode === 'admin' ? 'secondary' : 'primary'}
              containerStyle={mode === 'kitchen' ? styles.kitchenBtn : undefined}
            />

            {!isSupabaseConfigured ? (
              <View style={styles.demoBanner}>
                <View style={styles.demoHeader}>
                  <Ionicons name="sparkles" size={16} color={colors.primary} />
                  <Text style={styles.demoTitle}>Modo demo</Text>
                </View>
                <Text style={styles.demoText}>
                  Elige el modo arriba y usa cualquier correo y contraseña para probar.
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  scrollWide: { flexDirection: 'row', padding: 0, minHeight: '100%' },
  heroPanel: {
    flex: 1,
    padding: 48,
    justifyContent: 'center',
    gap: 16,
    minHeight: 500,
  },
  logoLarge: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heroTitle: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', lineHeight: 24, maxWidth: 360 },
  features: { marginTop: 24, gap: 14 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  formPanel: { gap: 32 },
  formPanelWide: {
    flex: 1,
    justifyContent: 'center',
    padding: 48,
    maxWidth: 560,
    backgroundColor: colors.background,
  },
  mobileHero: { alignItems: 'center', gap: 8 },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadows.lg,
  },
  title: { ...typography.title, fontSize: 30 },
  subtitle: { ...typography.caption, textAlign: 'center' },
  formTitle: { ...typography.heading, marginBottom: 8 },
  form: { gap: 16 },
  modeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  modeList: { gap: 10 },
  modeListWide: { flexDirection: 'row', alignItems: 'stretch' },
  modeCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: 14,
    backgroundColor: colors.surface,
    position: 'relative',
    ...shadows.sm,
  },
  modeCardStack: { width: '100%' },
  modeCardWide: { flex: 1, minWidth: 0 },
  modeCardInner: { gap: 10 },
  modeCardInnerRow: { flexDirection: 'row', alignItems: 'center' },
  modeCardText: { flex: 1, gap: 4 },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modeTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  modeSub: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
  modeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerBg,
    padding: 12,
    borderRadius: radius.md,
  },
  error: { ...typography.caption, color: colors.danger, flex: 1 },
  demoBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    gap: 8,
    ...shadows.sm,
  },
  demoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  demoTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },
  demoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  kitchenBtn: { backgroundColor: kitchenAccent },
});
