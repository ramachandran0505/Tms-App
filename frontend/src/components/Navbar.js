import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import useResponsive from '../hooks/useResponsive';

const Navbar = ({ navigation, currentRoute }) => {
  const { user, logout, isAuthenticated } = useContext(AuthContext);
  const { colors, isDark, toggleThemeMode } = useContext(ThemeContext);
  const { isDesktop, insets, width } = useResponsive();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const isSuperAdmin = user?.role === 'SuperAdmin';

  const navigateTo = (routeName) => {
    setDrawerOpen(false);
    setAdminMenuOpen(false);
    setProfileMenuOpen(false);
    if (navigation && navigation.navigate) {
      navigation.navigate(routeName);
    }
  };

  const handleLogout = async () => {
    setDrawerOpen(false);
    setAdminMenuOpen(false);
    setProfileMenuOpen(false);
    await logout();
  };

  const isActive = (route) => currentRoute === route;

  const adminModules = [
    { name: 'Departments', icon: 'business-outline', route: 'Departments' },
    { name: 'Programmes', icon: 'school-outline', route: 'Programmes' },
    { name: 'Campus Blocks', icon: 'cube-outline', route: 'Blocks' },
    { name: 'Room Registry', icon: 'key-outline', route: 'Rooms' },
    { name: 'Roles & Access', icon: 'shield-checkmark-outline', route: 'Roles' },
    { name: 'User Directory', icon: 'people-outline', route: 'Users' },
  ];

  if (!isAuthenticated) return null;

  return (
    <>
      {isDesktop && (adminMenuOpen || profileMenuOpen) && (
        <TouchableOpacity
          style={[
            styles.desktopBackdrop,
            Platform.OS === 'web' ? { position: 'fixed' } : StyleSheet.absoluteFillObject,
          ]}
          activeOpacity={1}
          onPress={() => {
            setAdminMenuOpen(false);
            setProfileMenuOpen(false);
          }}
        />
      )}
      <View
        style={[
          styles.navbarContainer,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS !== 'web' ? Math.max(insets.top, 8) : 0,
          },
        ]}
      >
        <View style={styles.navInner}>
          {/* Left: Brand Identity */}
          <TouchableOpacity
            style={styles.brandContainer}
            onPress={() => navigateTo('Home')}
            activeOpacity={0.8}
          >
          <View
            style={[
              styles.brandIconPod,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="layers" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={[styles.brandTitle, { color: colors.text }]}>TMS</Text>
            <View style={styles.brandStatusDotRow}>
              <View style={styles.statusDot} />
              <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
                PORTAL
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Center: Desktop Navigation Links (>=1024px) */}
        {isDesktop && (
          <View style={styles.desktopNavGroup}>
            <TouchableOpacity
              onPress={() => navigateTo('Home')}
              style={[
                styles.desktopNavLink,
                isActive('Home') && {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={isActive('Home') ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.desktopNavText,
                  {
                    color: isActive('Home') ? colors.primary : colors.text,
                    fontWeight: isActive('Home') ? '700' : '500',
                  },
                ]}
              >
                Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                navigateTo(isSuperAdmin ? 'Complaints' : 'MyComplaints')
              }
              style={[
                styles.desktopNavLink,
                (isActive('Complaints') || isActive('MyComplaints')) && {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color={
                  isActive('Complaints') || isActive('MyComplaints')
                    ? colors.primary
                    : colors.textMuted
                }
              />
              <Text
                style={[
                  styles.desktopNavText,
                  {
                    color:
                      isActive('Complaints') || isActive('MyComplaints')
                        ? colors.primary
                        : colors.text,
                    fontWeight:
                      isActive('Complaints') || isActive('MyComplaints')
                        ? '700'
                        : '500',
                  },
                ]}
              >
                {isSuperAdmin ? 'Tickets' : 'My Tickets'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigateTo('ComplaintForm')}
              style={[
                styles.desktopNavCta,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.desktopNavCtaText}>Raise Ticket</Text>
            </TouchableOpacity>

            {isSuperAdmin && (
              <>
                <TouchableOpacity
                  onPress={() => navigateTo('Reports')}
                  style={[
                    styles.desktopNavLink,
                    isActive('Reports') && {
                      backgroundColor: colors.cardSecondary,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="bar-chart-outline"
                    size={16}
                    color={isActive('Reports') ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.desktopNavText,
                      {
                        color: isActive('Reports') ? colors.primary : colors.text,
                        fontWeight: isActive('Reports') ? '700' : '500',
                      },
                    ]}
                  >
                    Reports
                  </Text>
                </TouchableOpacity>

                {/* Admin Modules Dropdown Trigger */}
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity
                    onPress={() => {
                      setAdminMenuOpen(!adminMenuOpen);
                      setProfileMenuOpen(false);
                    }}
                    style={[
                      styles.desktopNavLink,
                      adminMenuOpen && {
                        backgroundColor: colors.cardSecondary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name="settings-outline"
                      size={16}
                      color={colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.desktopNavText,
                        { color: colors.text, fontWeight: '500' },
                      ]}
                    >
                      Administration
                    </Text>
                    <Ionicons
                      name={adminMenuOpen ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>

                  {/* Popover menu for Admin modules */}
                  {adminMenuOpen && (
                    <View
                      style={[
                        styles.adminPopoverMenu,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.popoverHeader}>
                        <Text
                          style={[
                            styles.popoverHeaderTitle,
                            { color: colors.textMuted },
                          ]}
                        >
                          SYSTEM MODULES
                        </Text>
                      </View>
                      {adminModules.map((m, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={[
                            styles.popoverItem,
                            isActive(m.route) && {
                              backgroundColor: colors.cardSecondary,
                            },
                          ]}
                          onPress={() => navigateTo(m.route)}
                        >
                          <Ionicons
                            name={m.icon}
                            size={18}
                            color={
                              isActive(m.route)
                                ? colors.primary
                                : colors.textMuted
                            }
                            style={{ marginRight: 10 }}
                          />
                          <Text
                            style={[
                              styles.popoverItemText,
                              {
                                color: isActive(m.route)
                                  ? colors.primary
                                  : colors.text,
                                fontWeight: isActive(m.route) ? '700' : '500',
                              },
                            ]}
                          >
                            {m.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

        {/* Right: Actions & Profile */}
        <View style={styles.navRightGroup}>
          {/* Dark / Light Mode Switch */}
          <TouchableOpacity
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.cardSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={toggleThemeMode}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Dark and Light Mode"
          >
            <Ionicons
              name={isDark ? 'sunny-outline' : 'moon-outline'}
              size={18}
              color={colors.text}
            />
          </TouchableOpacity>

          {/* Desktop Profile Capsule */}
          {isDesktop ? (
            <View style={{ position: 'relative' }}>
              <TouchableOpacity
                style={[
                  styles.profileCapsule,
                  {
                    backgroundColor: colors.cardSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setProfileMenuOpen(!profileMenuOpen);
                  setAdminMenuOpen(false);
                }}
              >
                <View
                  style={[
                    styles.avatarOrb,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  {user?.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarLetter}>
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={styles.profileMeta}>
                  <Text
                    style={[styles.profileName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {user?.username || 'User'}
                  </Text>
                  <Text
                    style={[
                      styles.profileClearance,
                      { color: isSuperAdmin ? colors.primary : colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {isSuperAdmin ? 'SuperAdmin' : 'User'}
                  </Text>
                </View>
                <Ionicons
                  name={profileMenuOpen ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.textMuted}
                />
              </TouchableOpacity>

              {/* Profile dropdown popover */}
              {profileMenuOpen && (
                <View
                  style={[
                    styles.profilePopover,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.profilePopoverHeader}>
                    <Text
                      style={[styles.popoverUserName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {user?.username}
                    </Text>
                    <Text
                      style={[
                        styles.popoverUserEmail,
                        { color: colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {user?.email}
                    </Text>
                  </View>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <TouchableOpacity
                    style={styles.popoverItem}
                    onPress={() => navigateTo('Profile')}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={18}
                      color={colors.textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[styles.popoverItemText, { color: colors.text }]}
                    >
                      Account Profile
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.popoverItem}
                    onPress={() => navigateTo('Home')}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={18}
                      color={colors.textMuted}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[styles.popoverItemText, { color: colors.text }]}
                    >
                      Dashboard Overview
                    </Text>
                  </TouchableOpacity>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <TouchableOpacity
                    style={styles.popoverItem}
                    onPress={handleLogout}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={18}
                      color={colors.danger}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={[
                        styles.popoverItemText,
                        { color: colors.danger, fontWeight: '600' },
                      ]}
                    >
                      Sign Out Session
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            /* Mobile & Tablet Hamburger Toggle (<1024px) */
            <TouchableOpacity
              style={[
                styles.iconBtn,
                {
                  backgroundColor: colors.cardSecondary,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setDrawerOpen(true)}
              accessibilityLabel="Open Navigation Menu"
            >
              <Ionicons name="menu-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile Drawer Modal */}
      {!isDesktop && (
        <Modal
          visible={drawerOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setDrawerOpen(false)}
        >
          <View style={styles.mobileDrawerOverlay}>
            <TouchableOpacity
              style={styles.mobileDrawerBackdrop}
              activeOpacity={1}
              onPress={() => setDrawerOpen(false)}
            />
            <View
              style={[
                styles.mobileDrawerSheet,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  paddingTop: Math.max(insets.top, 16) + 8,
                  paddingBottom: Math.max(insets.bottom, 16) + 8,
                  width: Math.min(340, width * 0.85),
                },
              ]}
            >
              {/* Drawer Top Row */}
              <View style={styles.drawerHeaderRow}>
                <Text style={[styles.drawerNavTitle, { color: colors.textMuted }]}>
                  NAVIGATION MENU
                </Text>
                <TouchableOpacity
                  onPress={() => setDrawerOpen(false)}
                  style={styles.drawerCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* User Identity Card */}
              <TouchableOpacity
                style={[
                  styles.drawerUserCard,
                  {
                    backgroundColor: colors.cardSecondary,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => navigateTo('Profile')}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.avatarOrb,
                    { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22 },
                  ]}
                >
                  {user?.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage }}
                      style={[styles.avatarImage, { width: 44, height: 44, borderRadius: 22 }]}
                    />
                  ) : (
                    <Text style={[styles.avatarLetter, { fontSize: 18 }]}>
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.drawerUserName, { color: colors.text }]} numberOfLines={1}>
                    {user?.username || 'User'}
                  </Text>
                  <Text style={[styles.drawerUserEmail, { color: colors.textMuted }]} numberOfLines={1}>
                    {user?.email || ''}
                  </Text>
                  <Text
                    style={[
                      styles.drawerClearance,
                      { color: isSuperAdmin ? colors.primary : colors.textMuted },
                    ]}
                  >
                    {isSuperAdmin ? 'SuperAdmin Clearance' : 'Standard User'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Drawer Scrollable Links */}
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <TouchableOpacity
                  style={[
                    styles.drawerNavLink,
                    isActive('Home') && {
                      backgroundColor: colors.cardSecondary,
                    },
                  ]}
                  onPress={() => navigateTo('Home')}
                >
                  <Ionicons
                    name="grid-outline"
                    size={20}
                    color={isActive('Home') ? colors.primary : colors.text}
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={[
                      styles.drawerNavText,
                      {
                        color: isActive('Home') ? colors.primary : colors.text,
                        fontWeight: isActive('Home') ? '700' : '500',
                      },
                    ]}
                  >
                    Dashboard Overview
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.drawerNavLink,
                    (isActive('Complaints') || isActive('MyComplaints')) && {
                      backgroundColor: colors.cardSecondary,
                    },
                  ]}
                  onPress={() =>
                    navigateTo(isSuperAdmin ? 'Complaints' : 'MyComplaints')
                  }
                >
                  <Ionicons
                    name="document-text-outline"
                    size={20}
                    color={
                      isActive('Complaints') || isActive('MyComplaints')
                        ? colors.primary
                        : colors.text
                    }
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={[
                      styles.drawerNavText,
                      {
                        color:
                          isActive('Complaints') || isActive('MyComplaints')
                            ? colors.primary
                            : colors.text,
                        fontWeight:
                          isActive('Complaints') || isActive('MyComplaints')
                            ? '700'
                            : '500',
                      },
                    ]}
                  >
                    {isSuperAdmin ? 'Ticket Registry' : 'My Complaints'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.drawerNavLink,
                    isActive('ComplaintForm') && {
                      backgroundColor: colors.cardSecondary,
                    },
                  ]}
                  onPress={() => navigateTo('ComplaintForm')}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.primary}
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={[
                      styles.drawerNavText,
                      { color: colors.primary, fontWeight: '700' },
                    ]}
                  >
                    Raise Ticket
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.drawerNavLink,
                    isActive('Profile') && {
                      backgroundColor: colors.cardSecondary,
                    },
                  ]}
                  onPress={() => navigateTo('Profile')}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={isActive('Profile') ? colors.primary : colors.text}
                    style={{ marginRight: 14 }}
                  />
                  <Text
                    style={[
                      styles.drawerNavText,
                      {
                        color: isActive('Profile') ? colors.primary : colors.text,
                        fontWeight: isActive('Profile') ? '700' : '500',
                      },
                    ]}
                  >
                    Account Profile
                  </Text>
                </TouchableOpacity>

                {isSuperAdmin && (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.drawerNavLink,
                        isActive('Reports') && {
                          backgroundColor: colors.cardSecondary,
                        },
                      ]}
                      onPress={() => navigateTo('Reports')}
                    >
                      <Ionicons
                        name="bar-chart-outline"
                        size={20}
                        color={isActive('Reports') ? colors.primary : colors.text}
                        style={{ marginRight: 14 }}
                      />
                      <Text
                        style={[
                          styles.drawerNavText,
                          {
                            color: isActive('Reports')
                              ? colors.primary
                              : colors.text,
                            fontWeight: isActive('Reports') ? '700' : '500',
                          },
                        ]}
                      >
                        Analytics & Reports
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.drawerSectionHeader}>
                      <Text
                        style={[
                          styles.drawerSectionTitle,
                          { color: colors.textMuted },
                        ]}
                      >
                        ADMINISTRATION MASTER
                      </Text>
                    </View>

                    {adminModules.map((m, i) => (
                      <TouchableOpacity
                        key={i}
                        style={[
                          styles.drawerNavLink,
                          isActive(m.route) && {
                            backgroundColor: colors.cardSecondary,
                          },
                        ]}
                        onPress={() => navigateTo(m.route)}
                      >
                        <Ionicons
                          name={m.icon}
                          size={18}
                          color={
                            isActive(m.route) ? colors.primary : colors.textMuted
                          }
                          style={{ marginRight: 14 }}
                        />
                        <Text
                          style={[
                            styles.drawerNavText,
                            {
                              color: isActive(m.route)
                                ? colors.primary
                                : colors.text,
                              fontWeight: isActive(m.route) ? '700' : '500',
                            },
                          ]}
                        >
                          {m.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </ScrollView>

              {/* Drawer Footer: Logout */}
              <View
                style={[
                  styles.drawerFooter,
                  { borderTopColor: colors.border },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.drawerLogoutBtn,
                    { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                  ]}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                  <Text
                    style={[
                      styles.drawerLogoutText,
                      { color: colors.danger },
                    ]}
                  >
                    Sign Out Session
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  navbarContainer: {
    width: '100%',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      web: {
        position: 'sticky',
        top: 0,
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      },
    }),
  },
  navInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
    maxWidth: 1300,
    alignSelf: 'center',
    width: '100%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIconPod: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextGroup: {
    marginLeft: 10,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandStatusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  desktopNavGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopNavLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  desktopNavText: {
    fontSize: 14,
  },
  desktopNavCta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 4,
  },
  desktopNavCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  navRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  avatarOrb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  profileMeta: {
    maxWidth: 110,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileClearance: {
    fontSize: 10,
    fontWeight: '600',
  },
  adminPopoverMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    }),
  },
  popoverHeader: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  popoverHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  popoverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  popoverItemText: {
    fontSize: 13,
  },
  profilePopover: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    }),
  },
  profilePopoverHeader: {
    padding: 10,
  },
  popoverUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  popoverUserEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  mobileDrawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  mobileDrawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  mobileDrawerSheet: {
    height: '100%',
    paddingHorizontal: 18,
    borderLeftWidth: 1,
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
  },
  drawerNavTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  drawerCloseBtn: {
    padding: 4,
  },
  drawerUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  drawerUserName: {
    fontSize: 15,
    fontWeight: '700',
  },
  drawerUserEmail: {
    fontSize: 12,
    marginTop: 1,
  },
  drawerClearance: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  drawerNavLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  drawerNavText: {
    fontSize: 14,
  },
  drawerSectionHeader: {
    marginTop: 18,
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  drawerSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  drawerFooter: {
    paddingTop: 14,
    borderTopWidth: 1,
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  drawerLogoutText: {
    fontSize: 14,
    fontWeight: '700',
  },
  desktopBackdrop: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    backgroundColor: 'transparent',
  },
});

export default Navbar;
