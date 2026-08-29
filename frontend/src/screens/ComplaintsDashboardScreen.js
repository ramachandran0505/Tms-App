import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { complaintService, userService } from '../services/api';
import Navbar from '../components/Navbar';
import {
  Card,
  Badge,
  Input,
  Select,
  Button,
  StatCard,
  EmptyState,
  LoadingState,
} from '../components/UI';
import useResponsive from '../hooks/useResponsive';

const categories = [
  'All',
  'PC Hardware',
  'PC Software',
  'Application Issues',
  'Network',
  'Electronics',
  'Plumbing',
  'Other',
];

const ComplaintsDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding, width } = useResponsive();

  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Assignment Modal State
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assigning, setAssigning] = useState(false);

  const isSuperAdmin = user?.role === 'SuperAdmin';

  const loadData = useCallback(async () => {
    try {
      setError('');
      const [compRes, statRes] = await Promise.all([
        complaintService.getAll(),
        complaintService.getStats(),
      ]);
      setComplaints(compRes.data || []);
      setStats(statRes.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
    } catch (err) {
      setError('Network failure: Unable to retrieve global ticket feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    if (isSuperAdmin) {
      userService
        .getAll()
        .then((res) => setUsers(res.data || []))
        .catch(() => {});
    }
  }, [loadData, isSuperAdmin]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openAssignModal = (complaint) => {
    setActiveComplaint(complaint);
    setSelectedAssignee(complaint.assignedTo?._id || complaint.assignedTo || '');
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedAssignee || !activeComplaint) return;
    setAssigning(true);
    try {
      await complaintService.assign(activeComplaint._id, selectedAssignee);
      setAssignModalVisible(false);
      loadData();
    } catch (err) {
      setError('Assignment rejected by server.');
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await complaintService.updateStatus(id, status);
      loadData();
    } catch (err) {
      setError('Failed to update status.');
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (c.blockName && c.blockName.toLowerCase().includes(term)) ||
      (c.roomNumber && c.roomNumber.toLowerCase().includes(term)) ||
      (c.complaintType && c.complaintType.toLowerCase().includes(term)) ||
      (c.createdBy?.username && c.createdBy.username.toLowerCase().includes(term)) ||
      (c._id && c._id.toLowerCase().includes(term));
    const matchesCategory =
      filterCategory === 'All' || c.complaintType === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Complaints" />
        <LoadingState message="Accessing Global Ticket Repository..." />
      </View>
    );
  }

  const staffUsers = users.filter((u) => u.role !== 'SuperAdmin');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Complaints" />

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
        <View style={styles.dashboardRail}>
          {/* Hero Header */}
          <View style={styles.heroHeader}>
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

            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Global Ticket Management
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              Centralized complaint tracking, technician assignment, and status controls
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

          {/* Top Metric Cards */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="📂"
              number={String(stats.total)}
              label="Total Tickets"
              color="#6C47FF"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="⏳"
              number={String(stats.pending)}
              label="Awaiting Triage"
              color="#F59E0B"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="👤"
              number={String(stats.assigned)}
              label="In Field / Assigned"
              color="#8B5CF6"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="✅"
              number={String(stats.closed)}
              label="Closed / Resolved"
              color="#10B981"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
          </View>

          {/* Search & Filter Bar */}
          <Card style={styles.filterCard}>
            <View
              style={[
                styles.filterRow,
                (isDesktop || isTablet) ? styles.filterRowDesktop : {},
              ]}
            >
              <View style={{ flex: isDesktop ? 2 : 1 }}>
                <Input
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Search ticket ID, location, category, user..."
                  leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
                  containerStyle={{ marginVertical: 0 }}
                />
              </View>

              <View
                style={[
                  styles.filterRightGroup,
                  (isDesktop || isTablet) ? { flex: 1, marginLeft: 12 } : { marginTop: 10 },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Select
                    value={filterCategory}
                    onValueChange={setFilterCategory}
                    options={categories.map((c) => ({ label: c, value: c }))}
                    containerStyle={{ marginVertical: 0 }}
                  />
                </View>

                <Button
                  title="Sync Feed"
                  icon={<Ionicons name="sync-outline" size={16} color={colors.text} />}
                  variant="secondary"
                  onPress={onRefresh}
                  style={{ marginLeft: 8 }}
                />
              </View>
            </View>
          </Card>

          {/* Tickets List */}
          <View style={styles.listSection}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.listTitle, { color: colors.text }]}>
                Ticket Registry ({filteredComplaints.length})
              </Text>
            </View>

            {filteredComplaints.map((c) => {
              const isAssignedToCurrent =
                c.assignedTo &&
                String(c.assignedTo._id || c.assignedTo) ===
                  String(user?.id || user?._id);

              return (
                <Card key={c._id} style={styles.ticketCard}>
                  <View style={styles.ticketCardTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={styles.ticketIdRow}>
                        <Text
                          style={[
                            styles.ticketIdText,
                            { color: colors.primary },
                          ]}
                        >
                          #{c._id.slice(-6).toUpperCase()}
                        </Text>
                        <Badge label={c.status} style={{ marginLeft: 8 }} />
                      </View>
                      <Text
                        style={[
                          styles.ticketLocation,
                          { color: colors.text },
                        ]}
                      >
                        {c.blockName} • Room {c.roomNumber}
                      </Text>
                    </View>

                    <Text style={[styles.ticketDate, { color: colors.textMuted }]}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.ticketMetaRow,
                      { borderTopColor: colors.borderSoft },
                    ]}
                  >
                    <View style={styles.metaItem}>
                      <Text
                        style={[styles.metaLabel, { color: colors.textMuted }]}
                      >
                        Category
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: colors.text }]}
                      >
                        {c.complaintType}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Text
                        style={[styles.metaLabel, { color: colors.textMuted }]}
                      >
                        Originator
                      </Text>
                      <Text
                        style={[styles.metaValue, { color: colors.text }]}
                      >
                        {c.createdBy?.username || 'Anonymous'}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Text
                        style={[styles.metaLabel, { color: colors.textMuted }]}
                      >
                        Technician
                      </Text>
                      <Text
                        style={[
                          styles.metaValue,
                          {
                            color: c.assignedTo
                              ? colors.primary
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {c.assignedTo?.username || 'Unassigned'}
                      </Text>
                    </View>
                  </View>

                  {c.remarks ? (
                    <Text
                      style={[
                        styles.ticketRemarks,
                        { color: colors.textMuted },
                      ]}
                      numberOfLines={3}
                    >
                      {c.remarks}
                    </Text>
                  ) : null}

                  {/* Management Action Buttons */}
                  <View
                    style={[
                      styles.ticketActionsRow,
                      { borderTopColor: colors.borderSoft },
                    ]}
                  >
                    {isSuperAdmin && c.status !== 'Completed' && (
                      <Button
                        title={c.assignedTo ? 'Reassign' : 'Assign'}
                        icon={<Ionicons name="person-outline" size={14} color={colors.text} />}
                        variant="secondary"
                        size="sm"
                        onPress={() => openAssignModal(c)}
                        style={{ marginRight: 8, marginBottom: 4 }}
                      />
                    )}

                    {(isAssignedToCurrent || isSuperAdmin) &&
                      c.status !== 'Completed' && (
                        <>
                          {c.status !== 'In-Progress' && (
                            <Button
                              title="Start Work"
                              icon={<Ionicons name="flash-outline" size={14} color={colors.primary} />}
                              variant="outline"
                              size="sm"
                              onPress={() =>
                                handleStatusUpdate(c._id, 'In-Progress')
                              }
                              style={{ marginRight: 8, marginBottom: 4 }}
                            />
                          )}
                          <Button
                            title="Close Ticket"
                            icon={<Ionicons name="checkmark-done-outline" size={15} color="#FFFFFF" />}
                            variant="success"
                            size="sm"
                            onPress={() =>
                              handleStatusUpdate(c._id, 'Completed')
                            }
                            style={{ marginBottom: 4 }}
                          />
                        </>
                      )}
                  </View>
                </Card>
              );
            })}

            {filteredComplaints.length === 0 && (
              <EmptyState
                icon="🎫"
                title="No Tickets Found"
                subtitle="No maintenance issues found matching your filters."
                actionTitle="Clear Search"
                onAction={() => {
                  setSearchTerm('');
                  setFilterCategory('All');
                }}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Assignment Modal */}
      <Modal
        visible={assignModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAssignModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[
              styles.assignModalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                maxWidth: Math.min(460, width - 32),
              },
            ]}
          >
            <Text style={[styles.assignModalTitle, { color: colors.text }]}>
              Assign Technician to Ticket
            </Text>
            <Text
              style={[styles.assignModalSub, { color: colors.textMuted }]}
            >
              Ticket #{activeComplaint?._id?.slice(-6).toUpperCase()} •{' '}
              {activeComplaint?.complaintType}
            </Text>

            <Select
              label="Select Personnel / Staff"
              value={selectedAssignee}
              onValueChange={setSelectedAssignee}
              placeholder="Select technician"
              options={staffUsers.map((u) => ({
                label: `${u.username} (${u.role})`,
                value: u._id,
              }))}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setAssignModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Confirm Assignment"
                variant="primary"
                onPress={handleAssignSubmit}
                loading={assigning}
                disabled={!selectedAssignee}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  dashboardRail: {
    width: '100%',
    maxWidth: 1200,
  },
  heroHeader: {
    marginBottom: 16,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    alignSelf: 'flex-start',
    gap: 6,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroSub: {
    fontSize: 13,
    marginTop: 4,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  filterCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'column',
  },
  filterRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listSection: {
    marginTop: 4,
  },
  listHeaderRow: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  ticketCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
  },
  ticketCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  ticketIdText: {
    fontSize: 15,
    fontWeight: '800',
  },
  ticketLocation: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  ticketDate: {
    fontSize: 12,
  },
  ticketMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 10,
    gap: 16,
  },
  metaItem: {
    minWidth: 100,
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  ticketRemarks: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  ticketActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  assignModalCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 16px 36px rgba(0,0,0,0.35)' },
    }),
  },
  assignModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  assignModalSub: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  modalBtnRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
});

export default ComplaintsDashboardScreen;
