import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { complaintService } from '../services/api';
import Navbar from '../components/Navbar';
import { Card, StatCard, Button } from '../components/UI';
import useResponsive from '../hooks/useResponsive';

const HomeScreen = ({ navigation }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    closed: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isSuperAdmin = user?.role === 'SuperAdmin';

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await complaintService.getStats();
      setStats({
        total: res.data.total || 0,
        pending: res.data.pending || 0,
        inProgress: res.data.assigned || 0,
        closed: res.data.closed || 0,
      });
    } catch (err) {
      console.warn('Failed to load dashboard metrics', err?.message);
    } finally {
      setLoadingStats(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const adminLinks = [
    {
      to: 'Reports',
      label: 'Analytics & Reports',
      desc: 'System intelligence, metric trends & CSV export',
      icon: 'bar-chart-outline',
      tag: 'Analytics',
      color: '#6C47FF',
    },
    {
      to: 'Departments',
      label: 'Departments',
      desc: 'Manage campus academic divisions and units',
      icon: 'business-outline',
      tag: 'Master',
      color: '#3B82F6',
    },
    {
      to: 'Programmes',
      label: 'Programmes',
      desc: 'Academic degree pathways and curriculums',
      icon: 'school-outline',
      tag: 'Academic',
      color: '#10B981',
    },
    {
      to: 'Blocks',
      label: 'Campus Blocks',
      desc: 'Building structures, zones, and wings',
      icon: 'cube-outline',
      tag: 'Facility',
      color: '#F59E0B',
    },
    {
      to: 'Rooms',
      label: 'Room Registry',
      desc: 'Individual classrooms, labs & facility spaces',
      icon: 'key-outline',
      tag: 'Space',
      color: '#EC4899',
    },
    {
      to: 'Roles',
      label: 'Roles & Security',
      desc: 'Permission matrix and access policies',
      icon: 'shield-checkmark-outline',
      tag: 'Security',
      color: '#8B5CF6',
    },
    {
      to: 'Users',
      label: 'User Directory',
      desc: 'Staff, student and engineer accounts',
      icon: 'people-outline',
      tag: 'Accounts',
      color: '#06B6D4',
    },
    {
      to: 'Complaints',
      label: 'Ticket Registry',
      desc: 'Global issue triage, dispatch and work log',
      icon: 'receipt-outline',
      tag: 'Operations',
      color: '#6366F1',
    },
  ];

  // Helper for module card width
  const getModuleCardWidth = () => {
    if (isDesktop) return '23.5%';
    if (isTablet) return '48.5%';
    return '100%';
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Home" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainRail}>
          {/* Top Hero Banner */}
          <Card style={styles.heroCard}>
            <View style={styles.heroLayout}>
              <View style={styles.heroLeft}>
                <View
                  style={[
                    styles.heroAvatar,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  {user?.profileImage ? (
                    <Image
                      source={{ uri: user.profileImage }}
                      style={styles.heroAvatarImg}
                    />
                  ) : (
                    <Text style={styles.heroAvatarLetter}>
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>

                <View style={styles.heroTextGroup}>
                  <View
                    style={[
                      styles.clearancePill,
                      {
                        backgroundColor: isSuperAdmin
                          ? 'rgba(108, 71, 255, 0.15)'
                          : 'rgba(59, 130, 246, 0.15)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.clearanceDot,
                        {
                          backgroundColor: isSuperAdmin
                            ? colors.primary
                            : colors.info,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.clearanceText,
                        {
                          color: isSuperAdmin ? colors.primary : colors.info,
                        },
                      ]}
                    >
                      {isSuperAdmin
                        ? 'SUPERADMIN CLEARANCE'
                        : 'USER CLEARANCE'}
                    </Text>
                  </View>

                  <Text style={[styles.heroGreeting, { color: colors.text }]}>
                    Welcome back,{' '}
                    <Text style={{ color: colors.primary }}>
                      {user?.username || 'Operator'}
                    </Text>
                  </Text>
                  <Text style={[styles.heroSub, { color: colors.textMuted }]}>
                    Campus Operations & Facility Management Control System
                  </Text>
                </View>
              </View>

              <View style={[styles.heroRight, isSmallMobile && { width: '100%' }]}>
                <Button
                  title="Raise Ticket"
                  icon={<Ionicons name="add" size={18} color="#FFFFFF" />}
                  onPress={() => navigation.navigate('ComplaintForm')}
                  size="md"
                  style={isSmallMobile ? { width: '100%' } : {}}
                />
              </View>
            </View>
          </Card>

          {/* Live Metrics Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="📂"
              number={loadingStats ? '...' : String(stats.total)}
              label="Total Tickets"
              color="#6C47FF"
              onPress={() =>
                navigation.navigate(isSuperAdmin ? 'Complaints' : 'MyComplaints')
              }
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="⏳"
              number={loadingStats ? '...' : String(stats.pending)}
              label="Pending Action"
              color="#F59E0B"
              onPress={() =>
                navigation.navigate(isSuperAdmin ? 'Complaints' : 'MyComplaints')
              }
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="🔄"
              number={loadingStats ? '...' : String(stats.inProgress)}
              label="In Progress"
              color="#3B82F6"
              onPress={() =>
                navigation.navigate(isSuperAdmin ? 'Complaints' : 'MyComplaints')
              }
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="✅"
              number={loadingStats ? '...' : String(stats.closed)}
              label="Resolved & Closed"
              color="#10B981"
              onPress={() =>
                navigation.navigate(isSuperAdmin ? 'Complaints' : 'MyComplaints')
              }
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
          </View>

          {/* Operational Modules (SuperAdmin) or User Action Cards */}
          {isSuperAdmin ? (
            <View style={styles.modulesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  ⚡ Administrative Operational Console
                </Text>
                <Text
                  style={[styles.sectionSubtitle, { color: colors.textMuted }]}
                >
                  Direct system management and master registry configuration
                </Text>
              </View>

              <View style={styles.modulesGrid}>
                {adminLinks.map((item, idx) => (
                  <Card
                    key={idx}
                    onPress={() => navigation.navigate(item.to)}
                    style={[
                      styles.moduleCard,
                      { width: getModuleCardWidth() },
                    ]}
                  >
                    <View style={styles.moduleTopRow}>
                      <View
                        style={[
                          styles.moduleIconBox,
                          { backgroundColor: `${item.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={20}
                          color={item.color}
                        />
                      </View>
                      <View
                        style={[
                          styles.moduleTag,
                          { backgroundColor: colors.cardSecondary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.moduleTagText,
                            { color: colors.textMuted },
                          ]}
                        >
                          {item.tag}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[styles.moduleTitle, { color: colors.text }]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[styles.moduleDesc, { color: colors.textMuted }]}
                      numberOfLines={2}
                    >
                      {item.desc}
                    </Text>

                    <View style={styles.moduleFooter}>
                      <Text
                        style={[styles.moduleLinkText, { color: colors.primary }]}
                      >
                        Access Module →
                      </Text>
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.modulesSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  🚀 Service Desk Actions
                </Text>
                <Text
                  style={[styles.sectionSubtitle, { color: colors.textMuted }]}
                >
                  Report facility maintenance issues or track your active service tickets
                </Text>
              </View>

              <View
                style={[
                  styles.userActionGrid,
                  (isDesktop || isTablet) ? styles.userActionGridRow : {},
                ]}
              >
                <Card
                  onPress={() => navigation.navigate('ComplaintForm')}
                  style={[
                    styles.userActionCard,
                    (isDesktop || isTablet) ? { flex: 1, marginRight: 8 } : {},
                    { borderColor: colors.primary },
                  ]}
                >
                  <View
                    style={[
                      styles.actionIconBox,
                      { backgroundColor: 'rgba(108, 71, 255, 0.15)' },
                    ]}
                  >
                    <Ionicons
                      name="create-outline"
                      size={26}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: colors.text }]}>
                    Submit New Ticket
                  </Text>
                  <Text
                    style={[
                      styles.actionCardDesc,
                      { color: colors.textMuted },
                    ]}
                  >
                    Log a maintenance request for campus rooms, equipment, hardware, or network.
                  </Text>
                  <Text
                    style={[styles.actionCardBtnText, { color: colors.primary }]}
                  >
                    Open Ticket Form →
                  </Text>
                </Card>

                <Card
                  onPress={() => navigation.navigate('MyComplaints')}
                  style={[
                    styles.userActionCard,
                    (isDesktop || isTablet) ? { flex: 1, marginLeft: 8 } : { marginTop: 12 },
                  ]}
                >
                  <View
                    style={[
                      styles.actionIconBox,
                      { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                    ]}
                  >
                    <Ionicons
                      name="list-outline"
                      size={26}
                      color={colors.success}
                    />
                  </View>
                  <Text style={[styles.actionCardTitle, { color: colors.text }]}>
                    Track My Complaints
                  </Text>
                  <Text
                    style={[
                      styles.actionCardDesc,
                      { color: colors.textMuted },
                    ]}
                  >
                    View real-time status updates, dispatch details and feedback on your reported tickets.
                  </Text>
                  <Text
                    style={[styles.actionCardBtnText, { color: colors.success }]}
                  >
                    View My Feed →
                  </Text>
                </Card>
              </View>
            </View>
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
    maxWidth: 1200,
  },
  heroCard: {
    padding: 22,
    borderRadius: 18,
    marginBottom: 16,
  },
  heroLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 260,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroAvatarImg: {
    width: 56,
    height: 56,
  },
  heroAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  heroTextGroup: {
    marginLeft: 14,
    flex: 1,
  },
  clearancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  clearanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  clearanceText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroSub: {
    fontSize: 13,
    marginTop: 3,
  },
  heroRight: {
    alignSelf: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 20,
  },
  modulesSection: {
    marginTop: 6,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 3,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  moduleCard: {
    padding: 16,
    borderRadius: 14,
    justifyContent: 'space-between',
    minHeight: 155,
  },
  moduleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moduleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  moduleTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  moduleDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  moduleFooter: {
    marginTop: 'auto',
  },
  moduleLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  userActionGrid: {
    flexDirection: 'column',
  },
  userActionGridRow: {
    flexDirection: 'row',
  },
  userActionCard: {
    padding: 22,
    borderRadius: 16,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  actionCardDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  actionCardBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default HomeScreen;
