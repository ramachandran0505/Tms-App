import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { authService, complaintService } from '../services/api';
import Navbar from '../components/Navbar';
import { Card, Input, Button, Badge, StatCard } from '../components/UI';
import useResponsive from '../hooks/useResponsive';

const avatarPresets = [
  'https://cdn-icons-png.flaticon.com/512/149/149071.png',
  'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  'https://cdn-icons-png.flaticon.com/512/4140/4140037.png',
  'https://cdn-icons-png.flaticon.com/512/219/219983.png',
  'https://cdn-icons-png.flaticon.com/512/219/219986.png',
  'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
];

const ProfileScreen = ({ navigation }) => {
  const { user, setUser } = useContext(AuthContext);
  const {
    themes,
    currentThemeId,
    themeMode,
    changeThemeMode,
    changeThemeColor,
    colors,
  } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [activeTab, setActiveTab] = useState('general');

  // General State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    profileImage: '',
  });

  // Security State
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Preferences State
  const [prefs, setPrefs] = useState({
    notifications: true,
    compact: false,
  });

  // Stats
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    closed: 0,
    pending: 0,
  });

  const isMultiColumn = isDesktop || isTablet;

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await complaintService.getStats();
        setDashboardStats({
          total: res.data.total || 0,
          closed: res.data.closed || 0,
          pending: (res.data.pending || 0) + (res.data.assigned || 0),
        });
      } catch (err) {
        console.warn('Failed to fetch stats', err?.message);
      }
    };
    if (user) {
      loadStats();
    }
  }, [user]);

  const handleGeneralSubmit = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await authService.updateProfile(formData);
      setUser(response.data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async () => {
    if (!securityData.currentPassword || !securityData.newPassword) {
      setMessage({
        type: 'error',
        text: 'Current and new password are required.',
      });
      return;
    }

    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authService.changePassword({
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Profile" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainRail}>
          {/* Back Navigation */}
          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.navigate('Home')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.primary} />
            <Text style={[styles.backLinkText, { color: colors.primary }]}>
              Dashboard Overview
            </Text>
          </TouchableOpacity>

          {/* Hero Banner */}
          <Card style={styles.heroCard}>
            <View style={[styles.heroRow, isSmallMobile && { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <View
                style={[
                  styles.profileAvatar,
                  { backgroundColor: colors.primary },
                  isSmallMobile && { marginBottom: 12 },
                ]}
              >
                {formData.profileImage ? (
                  <Image
                    source={{ uri: formData.profileImage }}
                    style={styles.avatarImg}
                  />
                ) : (
                  <Text style={styles.avatarLetter}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                )}
                <View style={styles.onlineBadge} />
              </View>

              <View style={{ marginLeft: isSmallMobile ? 0 : 16, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {user?.username}
                  </Text>
                  <Badge
                    label={
                      user?.role === 'SuperAdmin'
                        ? 'Admin Tier'
                        : 'Standard User'
                    }
                    variant={user?.role === 'SuperAdmin' ? 'admin' : 'progress'}
                  />
                </View>
                <Text
                  style={[styles.profileEmail, { color: colors.textMuted }]}
                >
                  {user?.email}
                </Text>
                <Text
                  style={[styles.profileRoleHint, { color: colors.primary }]}
                >
                  Clearance: {user?.role}
                </Text>
              </View>
            </View>
          </Card>

          {/* Quick Metrics */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="🎫"
              number={String(dashboardStats.total)}
              label="Raised Tickets"
              color="#6C47FF"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="✨"
              number={String(dashboardStats.closed)}
              label="Resolved"
              color="#10B981"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="⏳"
              number={String(dashboardStats.pending)}
              label="Pending"
              color="#F59E0B"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
          </View>

          {/* Notification Alert Banner */}
          {message.text ? (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor:
                    message.type === 'success'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(239, 68, 68, 0.15)',
                  borderColor:
                    message.type === 'success'
                      ? colors.success
                      : colors.danger,
                },
              ]}
            >
              <Ionicons
                name={
                  message.type === 'success'
                    ? 'checkmark-circle'
                    : 'alert-circle'
                }
                size={20}
                color={
                  message.type === 'success'
                    ? colors.success
                    : colors.danger
                }
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.alertText,
                  {
                    color:
                      message.type === 'success'
                        ? colors.success
                        : colors.danger,
                  },
                ]}
              >
                {message.text}
              </Text>
            </View>
          ) : null}

          {/* Tab Navigation Scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              styles.tabBar,
              { backgroundColor: colors.cardSecondary, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'general' && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setActiveTab('general')}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={activeTab === 'general' ? '#FFFFFF' : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      activeTab === 'general' ? '#FFFFFF' : colors.textMuted,
                    fontWeight: activeTab === 'general' ? '700' : '500',
                  },
                ]}
              >
                General Info
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'security' && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setActiveTab('security')}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={activeTab === 'security' ? '#FFFFFF' : colors.textMuted}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      activeTab === 'security' ? '#FFFFFF' : colors.textMuted,
                    fontWeight: activeTab === 'security' ? '700' : '500',
                  },
                ]}
              >
                Security & Key
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabBtn,
                activeTab === 'preferences' && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={() => setActiveTab('preferences')}
            >
              <Ionicons
                name="color-palette-outline"
                size={16}
                color={
                  activeTab === 'preferences' ? '#FFFFFF' : colors.textMuted
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color:
                      activeTab === 'preferences'
                        ? '#FFFFFF'
                        : colors.textMuted,
                    fontWeight: activeTab === 'preferences' ? '700' : '500',
                  },
                ]}
              >
                Customization
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* TAB 1: General Info */}
          {activeTab === 'general' && (
            <Card style={styles.contentCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Identity Profile Settings
              </Text>

              {/* Preset Avatar Gallery */}
              <View style={styles.avatarGallery}>
                <Text
                  style={[styles.galleryTitle, { color: colors.textMuted }]}
                >
                  Choose an Avatar Preset
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.avatarScroll}
                >
                  {avatarPresets.map((img, idx) => {
                    const isSelected = formData.profileImage === img;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[
                          styles.presetAvatarBox,
                          isSelected && {
                            borderColor: colors.primary,
                            borderWidth: 3,
                          },
                        ]}
                        onPress={() =>
                          setFormData({ ...formData, profileImage: img })
                        }
                      >
                        <Image
                          source={{ uri: img }}
                          style={styles.presetAvatarImg}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View
                style={[
                  styles.formGrid,
                  isMultiColumn ? styles.formGridDesktop : {},
                ]}
              >
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Input
                    label="Username"
                    value={formData.username}
                    onChangeText={(val) =>
                      setFormData({ ...formData, username: val })
                    }
                    placeholder="Username"
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Input
                    label="Access Role"
                    value={user?.role || 'User'}
                    editable={false}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.formGrid,
                  isMultiColumn ? styles.formGridDesktop : {},
                ]}
              >
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Input
                    label="Digital Contact Email"
                    value={formData.email}
                    onChangeText={(val) =>
                      setFormData({ ...formData, email: val })
                    }
                    placeholder="Email"
                    keyboardType="email-address"
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Input
                    label="Communication Phone"
                    value={formData.phone}
                    onChangeText={(val) =>
                      setFormData({ ...formData, phone: val })
                    }
                    placeholder="Phone"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <Button
                title="Synchronize Profile Changes"
                onPress={handleGeneralSubmit}
                loading={loading}
                size="lg"
                style={{ marginTop: 14 }}
              />
            </Card>
          )}

          {/* TAB 2: Security & Password */}
          {activeTab === 'security' && (
            <Card style={styles.contentCard}>
              <View style={styles.securityHeader}>
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={colors.primary}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Credential Renewal Protocol
                  </Text>
                  <Text
                    style={[styles.securitySub, { color: colors.textMuted }]}
                  >
                    Update your authentication credentials to maintain account protection
                  </Text>
                </View>
              </View>

              <Input
                label="Current Security Key"
                value={securityData.currentPassword}
                onChangeText={(val) =>
                  setSecurityData({ ...securityData, currentPassword: val })
                }
                placeholder="••••••••"
                secureTextEntry
              />

              <View
                style={[
                  styles.formGrid,
                  isMultiColumn ? styles.formGridDesktop : {},
                ]}
              >
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Input
                    label="New Security Key"
                    value={securityData.newPassword}
                    onChangeText={(val) =>
                      setSecurityData({ ...securityData, newPassword: val })
                    }
                    placeholder="••••••••"
                    secureTextEntry
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Input
                    label="Confirm New Security Key"
                    value={securityData.confirmPassword}
                    onChangeText={(val) =>
                      setSecurityData({
                        ...securityData,
                        confirmPassword: val,
                      })
                    }
                    placeholder="••••••••"
                    secureTextEntry
                  />
                </View>
              </View>

              <Button
                title="Renew Credentials"
                onPress={handleSecuritySubmit}
                loading={loading}
                size="lg"
                style={{ marginTop: 14 }}
              />
            </Card>
          )}

          {/* TAB 3: Preferences & Customization */}
          {activeTab === 'preferences' && (
            <Card style={styles.contentCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                System Interface & Themes
              </Text>
              <Text style={[styles.prefSub, { color: colors.textMuted }]}>
                Personalize your cross-platform visual aesthetic and environment
              </Text>

              {/* Display Mode Selection */}
              <View style={styles.themeModeSection}>
                <Text
                  style={[styles.groupHeading, { color: colors.text }]}
                >
                  Display Appearance Mode
                </Text>

                <View style={[styles.modeCardsRow, isSmallMobile && { flexDirection: 'column' }]}>
                  <TouchableOpacity
                    style={[
                      styles.modeSelectCard,
                      {
                        backgroundColor: colors.cardSecondary,
                        borderColor:
                          themeMode === 'light'
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => changeThemeMode('light')}
                  >
                    <Ionicons
                      name="sunny"
                      size={24}
                      color="#F59E0B"
                    />
                    <Text
                      style={[styles.modeTitle, { color: colors.text }]}
                    >
                      Light Mode
                    </Text>
                    <Text
                      style={[styles.modeDesc, { color: colors.textMuted }]}
                    >
                      Crisp, high-contrast bright
                    </Text>
                    {themeMode === 'light' && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.primary}
                        style={{ marginTop: 6 }}
                      />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modeSelectCard,
                      {
                        backgroundColor: colors.cardSecondary,
                        borderColor:
                          themeMode === 'dark'
                            ? colors.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => changeThemeMode('dark')}
                  >
                    <Ionicons
                      name="moon"
                      size={24}
                      color="#6C47FF"
                    />
                    <Text
                      style={[styles.modeTitle, { color: colors.text }]}
                    >
                      Dark Mode
                    </Text>
                    <Text
                      style={[styles.modeDesc, { color: colors.textMuted }]}
                    >
                      Sleek midnight OLED contrast
                    </Text>
                    {themeMode === 'dark' && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.primary}
                        style={{ marginTop: 6 }}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Accent Spectrum */}
              <View style={styles.accentSection}>
                <Text
                  style={[styles.groupHeading, { color: colors.text }]}
                >
                  Accent Color Spectrum
                </Text>

                <View style={styles.colorOrbitsWrap}>
                  {themes.map((t) => {
                    const isSelected = currentThemeId === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => changeThemeColor(t.id)}
                        style={[
                          styles.orbitItem,
                          {
                            backgroundColor: colors.cardSecondary,
                            borderColor: isSelected
                              ? t.color
                              : colors.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.orbitColorCircle,
                            { backgroundColor: t.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.orbitName,
                            {
                              color: isSelected ? t.color : colors.text,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {t.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* System Toggles */}
              <View style={styles.toggleStack}>
                <View
                  style={[
                    styles.toggleRow,
                    { borderTopColor: colors.borderSoft },
                  ]}
                >
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                      style={[styles.toggleTitle, { color: colors.text }]}
                    >
                      Push Communications & Alerts
                    </Text>
                    <Text
                      style={[styles.toggleDesc, { color: colors.textMuted }]}
                    >
                      Receive real-time notifications on ticket assignments and status updates
                    </Text>
                  </View>
                  <Switch
                    value={prefs.notifications}
                    onValueChange={(val) =>
                      setPrefs({ ...prefs, notifications: val })
                    }
                    trackColor={{
                      false: '#767577',
                      true: colors.primary,
                    }}
                  />
                </View>
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  mainRail: {
    width: '100%',
    maxWidth: 960,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 14,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  profileRoleHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabBtnText: {
    fontSize: 13,
  },
  contentCard: {
    padding: 22,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  avatarGallery: {
    marginBottom: 18,
  },
  galleryTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  avatarScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  presetAvatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetAvatarImg: {
    width: '100%',
    height: '100%',
  },
  formGrid: {
    flexDirection: 'column',
  },
  formGridDesktop: {
    flexDirection: 'row',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  securitySub: {
    fontSize: 12,
    marginTop: 2,
  },
  prefSub: {
    fontSize: 13,
    marginTop: -6,
    marginBottom: 16,
  },
  themeModeSection: {
    marginBottom: 20,
  },
  groupHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  modeCardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeSelectCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 8,
  },
  modeDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  accentSection: {
    marginBottom: 20,
  },
  colorOrbitsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  orbitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  orbitColorCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  orbitName: {
    fontSize: 12,
  },
  toggleStack: {
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 14,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleDesc: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default ProfileScreen;
