import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { complaintService, getApiBaseUrl } from '../services/api';
import Navbar from '../components/Navbar';
import {
  Card,
  Badge,
  StatCard,
  Button,
  EmptyState,
  LoadingState,
} from '../components/UI';
import useResponsive from '../hooks/useResponsive';

const filterTabs = ['All', 'Pending', 'Assigned', 'In-Progress', 'Completed'];

const UserComplaintDashboardScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isSmallMobile, horizontalPadding, width } = useResponsive();

  const [complaints, setComplaints] = useState([]);
  const [myStats, setMyStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const userId = user?.id || user?._id;

  const loadData = useCallback(async () => {
    try {
      setError('');
      const res = await complaintService.getAll();
      const allComplaints = res.data || [];

      const userComplaints = allComplaints.filter((c) => {
        const createdById = c.createdBy?._id || c.createdBy;
        const assignedToId = c.assignedTo?._id || c.assignedTo;
        return (
          String(createdById) === String(userId) ||
          String(assignedToId) === String(userId)
        );
      });

      setComplaints(userComplaints);

      const stats = {
        total: userComplaints.length,
        pending: userComplaints.filter((c) => c.status === 'Pending').length,
        assigned: userComplaints.filter((c) => c.status === 'Assigned').length,
        closed: userComplaints.filter(
          (c) => c.status === 'Completed' || c.status === 'Closed'
        ).length,
      };
      setMyStats(stats);
    } catch (err) {
      setError('Failed to load tickets feed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await complaintService.updateStatus(id, newStatus);
      loadData();
      if (selectedComplaint && selectedComplaint._id === id) {
        setSelectedComplaint((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      setError('Status update failed.');
    }
  };

  const openAttachment = (attachmentPath) => {
    if (!attachmentPath) return;
    const cleanBaseUrl = getApiBaseUrl().replace(/\/api\/?$/, '');
    const cleanPath = attachmentPath.startsWith('/') ? attachmentPath : `/${attachmentPath}`;
    const url = `${cleanBaseUrl}${cleanPath}`;
    Linking.openURL(url).catch((err) =>
      console.warn('Cannot open attachment link', err)
    );
  };

  const filteredComplaints =
    filterStatus === 'All'
      ? complaints
      : complaints.filter((c) => {
          if (filterStatus === 'Completed') {
            return c.status === 'Completed' || c.status === 'Closed';
          }
          return c.status === filterStatus;
        });

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="MyComplaints" />
        <LoadingState message="Initializing Personal Ticket Feed..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="MyComplaints" />

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
          {/* Header */}
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
              My Performance & Service Tickets
            </Text>
            <Text style={[styles.heroSub, { color: colors.textMuted }]}>
              Tracking maintenance issues reported by you or assigned to your queue
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

          {/* Stats Overview */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="🎫"
              number={String(myStats.total)}
              label="Total Engagement"
              color="#6C47FF"
              onPress={() => setFilterStatus('All')}
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="⏳"
              number={String(myStats.pending)}
              label="Pending Review"
              color="#F59E0B"
              onPress={() => setFilterStatus('Pending')}
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="✨"
              number={String(myStats.closed)}
              label="Success Closed"
              color="#10B981"
              onPress={() => setFilterStatus('Completed')}
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
          </View>

          {/* Filter Tabs Scrollable */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContainer}
          >
            {filterTabs.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor:
                      filterStatus === tab
                        ? colors.primary
                        : colors.cardSecondary,
                    borderColor:
                      filterStatus === tab ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFilterStatus(tab)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    {
                      color: filterStatus === tab ? '#FFFFFF' : colors.text,
                      fontWeight: filterStatus === tab ? '700' : '500',
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Ticket Feed List */}
          <View style={styles.ticketFeed}>
            {filteredComplaints.map((c) => {
              const isAssignedToMe =
                c.assignedTo &&
                String(c.assignedTo._id || c.assignedTo) === String(userId);

              return (
                <Card
                  key={c._id}
                  style={styles.ticketCard}
                  onPress={() => setSelectedComplaint(c)}
                >
                  <View style={styles.ticketCardHeader}>
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
                        {isAssignedToMe && (
                          <Badge
                            label="Assigned to You"
                            variant="assigned"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.ticketLocationText,
                          { color: colors.text },
                        ]}
                      >
                        {c.blockName} • Room {c.roomNumber}
                      </Text>
                    </View>

                    <Text style={[styles.ticketDateText, { color: colors.textMuted }]}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                    </Text>
                  </View>

                  <Text
                    style={[styles.ticketDescPreview, { color: colors.textMuted }]}
                    numberOfLines={2}
                  >
                    {c.remarks || 'No detailed remarks recorded for this ticket.'}
                  </Text>

                  <View
                    style={[
                      styles.ticketCardFooter,
                      { borderTopColor: colors.borderSoft },
                    ]}
                  >
                    <View style={styles.footerMetaItem}>
                      <Text
                        style={[
                          styles.footerMetaLabel,
                          { color: colors.textDim },
                        ]}
                      >
                        Category
                      </Text>
                      <Text
                        style={[styles.footerMetaVal, { color: colors.text }]}
                      >
                        {c.complaintType}
                      </Text>
                    </View>

                    <View style={styles.footerMetaItem}>
                      <Text
                        style={[
                          styles.footerMetaLabel,
                          { color: colors.textDim },
                        ]}
                      >
                        Handler
                      </Text>
                      <Text
                        style={[
                          styles.footerMetaVal,
                          {
                            color: c.assignedTo
                              ? colors.primary
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {c.assignedTo?.username || 'Queued for Assignment'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.viewDetailsPrompt,
                        { color: colors.primary },
                      ]}
                    >
                      View Details →
                    </Text>
                  </View>
                </Card>
              );
            })}

            {filteredComplaints.length === 0 && (
              <EmptyState
                icon="📭"
                title="No Tickets in this Queue"
                subtitle="You do not have any logged complaints or assigned jobs under this category."
                actionTitle="Submit New Complaint"
                onAction={() => navigation.navigate('ComplaintForm')}
              />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Ticket Details Modal */}
      {selectedComplaint && (
        <Modal
          visible={!!selectedComplaint}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedComplaint(null)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedComplaint(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={[
                styles.detailModalCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  maxWidth: Math.min(560, width - 32),
                },
              ]}
            >
              <View style={styles.detailModalHeader}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={[styles.detailModalId, { color: colors.primary }]}>
                    #{selectedComplaint._id.slice(-6).toUpperCase()}
                  </Text>
                  <Text
                    style={[styles.detailModalLocation, { color: colors.text }]}
                  >
                    {selectedComplaint.blockName} • Room {selectedComplaint.roomNumber}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedComplaint(null)}
                  style={styles.detailCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <View style={styles.detailMetaGrid}>
                  <View style={styles.detailMetaBlock}>
                    <Text style={[styles.detailMetaLabel, { color: colors.textMuted }]}>
                      Status
                    </Text>
                    <Badge
                      label={selectedComplaint.status}
                      style={{ marginTop: 4 }}
                    />
                  </View>

                  <View style={styles.detailMetaBlock}>
                    <Text style={[styles.detailMetaLabel, { color: colors.textMuted }]}>
                      Category
                    </Text>
                    <Text style={[styles.detailMetaVal, { color: colors.text }]}>
                      {selectedComplaint.complaintType}
                    </Text>
                  </View>

                  <View style={styles.detailMetaBlock}>
                    <Text style={[styles.detailMetaLabel, { color: colors.textMuted }]}>
                      Logged Date
                    </Text>
                    <Text style={[styles.detailMetaVal, { color: colors.text }]}>
                      {selectedComplaint.createdAt
                        ? new Date(selectedComplaint.createdAt).toLocaleString()
                        : '—'}
                    </Text>
                  </View>

                  <View style={styles.detailMetaBlock}>
                    <Text style={[styles.detailMetaLabel, { color: colors.textMuted }]}>
                      Technician Assigned
                    </Text>
                    <Text style={[styles.detailMetaVal, { color: colors.primary }]}>
                      {selectedComplaint.assignedTo?.username || 'Unassigned'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                    Incident Breakdown / Remarks
                  </Text>
                  <Text style={[styles.detailBodyText, { color: colors.textMuted }]}>
                    {selectedComplaint.remarks || 'No detailed notes provided.'}
                  </Text>
                </View>

                {selectedComplaint.attachment && (
                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionTitle, { color: colors.text }]}>
                      Evidentiary Documentation
                    </Text>
                    <Button
                      title="View Evidence"
                      icon={<Ionicons name="attach-outline" size={16} color={colors.primary} />}
                      variant="outline"
                      size="sm"
                      onPress={() => openAttachment(selectedComplaint.attachment)}
                      style={{ alignSelf: 'flex-start', marginTop: 6 }}
                    />
                  </View>
                )}

                {/* Worker Controls if assigned */}
                {selectedComplaint.assignedTo &&
                  String(selectedComplaint.assignedTo._id || selectedComplaint.assignedTo) ===
                    String(userId) &&
                  selectedComplaint.status !== 'Completed' && (
                    <View style={styles.workerControlsBox}>
                      <Text
                        style={[
                          styles.workerControlTitle,
                          { color: colors.text },
                        ]}
                      >
                        Assigned Task Actions
                      </Text>
                      <View style={styles.workerBtnRow}>
                        {selectedComplaint.status !== 'In-Progress' && (
                          <Button
                            title="Start Work"
                            icon={<Ionicons name="flash-outline" size={14} color={colors.primary} />}
                            variant="outline"
                            onPress={() =>
                              handleStatusUpdate(
                                selectedComplaint._id,
                                'In-Progress'
                              )
                            }
                            style={{ flex: 1, marginRight: 6 }}
                          />
                        )}
                        <Button
                          title="Mark Resolved"
                          icon={<Ionicons name="checkmark-done-outline" size={15} color="#FFFFFF" />}
                          variant="success"
                          onPress={() =>
                            handleStatusUpdate(
                              selectedComplaint._id,
                              'Completed'
                            )
                          }
                          style={{ flex: 1, marginLeft: 6 }}
                        />
                      </View>
                    </View>
                  )}
              </ScrollView>

              <View
                style={[
                  styles.detailModalFooter,
                  { borderTopColor: colors.borderSoft },
                ]}
              >
                <Button
                  title="Close Inspector"
                  icon={<Ionicons name="close-outline" size={18} color={colors.text} />}
                  variant="secondary"
                  onPress={() => setSelectedComplaint(null)}
                  style={{ width: '100%' }}
                />
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
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
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    marginBottom: 16,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
  },
  ticketFeed: {
    marginTop: 4,
  },
  ticketCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
  ticketLocationText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  ticketDateText: {
    fontSize: 12,
  },
  ticketDescPreview: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    flexWrap: 'wrap',
    gap: 12,
  },
  footerMetaItem: {
    marginRight: 16,
  },
  footerMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerMetaVal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  viewDetailsPrompt: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 'auto',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailModalCard: {
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
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailModalId: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailModalLocation: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  detailCloseBtn: {
    padding: 4,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 16,
  },
  detailMetaBlock: {
    minWidth: 120,
    flex: 1,
  },
  detailMetaLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailMetaVal: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  detailSection: {
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  detailBodyText: {
    fontSize: 13,
    lineHeight: 18,
  },
  workerControlsBox: {
    marginTop: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 71, 255, 0.08)',
  },
  workerControlTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  workerBtnRow: {
    flexDirection: 'row',
  },
  detailModalFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});

export default UserComplaintDashboardScreen;
