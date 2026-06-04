import {
  AppleButton,
  appleAuth,
} from '@invertase/react-native-apple-authentication';
import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Config from 'react-native-config';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import {useAuth} from '../context/AuthContext';
import {useTheme} from '../context/ThemeContext';
import {radii, spacing, typography} from '../theme';

export default function SignInScreen() {
  const {theme, glass} = useTheme();
  const {signInWithApple, signInDev} = useAuth();
  const [loading, setLoading] = useState(false);

  const gradientTop    = theme.primary['300'];
  const gradientBottom = theme.primary['500'];

  // ── Production: Sign in with Apple ────────────────────────────────────────

  async function handleAppleSignIn() {
    setLoading(true);
    try {
      const credential = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple');
      }
      await signInWithApple(credential.identityToken);
    } catch (err: any) {
      if (err.code === appleAuth.Error.CANCELED) return;
      const detail = err?.response?.data?.detail ?? err?.message ?? String(err);
      Alert.alert('Sign in failed', detail);
    } finally {
      setLoading(false);
    }
  }

  // ── Dev: email/password bypass (AUTH_DEV_MODE=1 only) ────────────────────

  async function handleDevSignIn() {
    setLoading(true);
    try {
      await signInDev();
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? String(err);
      Alert.alert('Dev sign-in failed', detail);
    } finally {
      setLoading(false);
    }
  }

  return (
    <LinearGradient colors={[gradientTop, gradientBottom]} style={s.gradient}>
      <SafeAreaView style={s.safe}>

        <View style={s.logoWrap}>
          <Icon name="compass" size={22} color={glass.textPrimary} stroke={1.8} />
        </View>

        <Text style={[s.brand, {color: glass.textPrimary}]}>wandur</Text>

        <Text style={[s.headline, {color: glass.textPrimary}]}>
          Trips that actually{'\n'}come together.
        </Text>

        <View style={s.spacer} />

        <View style={s.bottom}>
          {loading ? (
            <View style={s.loader}>
              <ActivityIndicator color={glass.textPrimary} />
            </View>
          ) : (
            <>
              {/* ── Production: Sign in with Apple ── */}
              <AppleButton
                buttonStyle={AppleButton.Style.WHITE}
                buttonType={AppleButton.Type.CONTINUE}
                style={s.appleBtn}
                onPress={handleAppleSignIn}
              />

              {/* ── Dev only: bypass Apple auth for simulator / unpaid account testing ── */}
              {Config.AUTH_DEV_MODE === '1' && (
                <TouchableOpacity style={s.devBtn} onPress={handleDevSignIn} activeOpacity={0.7}>
                  <Text style={[s.devBtnText, {color: glass.textPrimary}]}>
                    Sign in as test user (dev only)
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <Text style={[s.legal, {color: glass.textSecondary}]}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  gradient: {flex: 1},
  safe: {
    flex: 1,
    paddingHorizontal: spacing.xl + 4,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brand: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    letterSpacing: -0.3,
    marginBottom: spacing.xl + 4,
  },
  headline: {
    fontSize: 38,
    fontWeight: typography.bold,
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  spacer: {flex: 1},
  bottom: {gap: spacing.lg},
  appleBtn: {
    width: '100%',
    height: 54,
    borderRadius: radii.xl,
  },
  loader: {height: 54, alignItems: 'center', justifyContent: 'center'},
  // Dev button — intentionally plain to distinguish it from the production Apple button
  devBtn: {
    width: '100%',
    height: 44,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
  },
  legal: {
    fontSize: typography.xs,
    textAlign: 'center',
    lineHeight: 17,
  },
});
