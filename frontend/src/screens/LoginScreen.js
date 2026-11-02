import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Button, Input, Card } from '../components/UI';
import { getApiBaseUrl } from '../services/api';
import useResponsive from '../hooks/useResponsive';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const { colors, isDark, toggleThemeMode } = useContext(ThemeContext);
  const { isSmallMobile, insets, width } = useResponsive();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.message === 'Network Error'
          ? 'Network Error: Cannot reach backend server at ' + getApiBaseUrl()
          : err.message || 'Login failed. Please check credentials.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Platform.OS !== 'web' ? insets.top : 0,
          paddingBottom: Platform.OS !== 'web' ? insets.bottom : 0,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: isSmallMobile ? 12 : 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Navbar */}
        <View style={[styles.topBar, { maxWidth: Math.min(460, width - 24) }]}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={[styles.brandTitle, { color: colors.text }]}>TMS</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.themeBtn,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleThemeMode}
            accessibilityLabel="Toggle Dark and Light Theme"
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Login Card */}
        <View style={[styles.cardWrapper, { maxWidth: Math.min(460, width - 24) }]}>
          <Card style={[styles.loginCard, isSmallMobile && { padding: 20 }]}>
            <View style={styles.headerSection}>
              <View
                style={[
                  styles.glowBadge,
                  { backgroundColor: 'rgba(108, 71, 255, 0.15)' },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={colors.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.glowBadgeText, { color: colors.primary }]}>
                  AUTHENTICATION PROTOCOL
                </Text>
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                Welcome Back
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Secure System Access Portal
              </Text>
            </View>

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderColor: colors.danger,
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle"
                  size={18}
                  color={colors.danger}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <View style={styles.formCluster}>
              <Input
                label="Email Identity"
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Input
                label="Security Key"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                leftIcon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                secureTextEntry
              />

              <Button
                title="Establish Session"
                icon={<Ionicons name="log-in-outline" size={18} color="#FFFFFF" />}
                onPress={handleSubmit}
                loading={loading}
                style={styles.submitBtn}
                size="lg"
              />
            </View>

            <View style={styles.cardFooter}>
              <Text style={[styles.footerHint, { color: colors.textDim }]}>
                TMS Enterprise Facility & Issue Tracking Engine
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: Platform.OS === 'web' ? '100vh' : '100%',
    paddingVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  logoIconPod: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextLetter: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginLeft: 10,
  },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    width: '100%',
  },
  loginCard: {
    padding: 28,
    borderRadius: 20,
  },
  headerSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  glowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  glowBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  formCluster: {
    gap: 4,
  },
  submitBtn: {
    marginTop: 14,
  },
  cardFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerHint: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoginScreen;
