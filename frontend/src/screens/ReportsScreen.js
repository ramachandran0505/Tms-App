import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  complaintService,
  departmentService,
  programmeService,
  userService,
} from '../services/api';
import Navbar from '../components/Navbar';
import {
  Card,
  Input,
  Select,
  Button,
  Badge,
  EmptyState,
  LoadingState,
} from '../components/UI';
import useResponsive from '../hooks/useResponsive';

const statusOptions = [
  { label: 'All States', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Assigned', value: 'Assigned' },
  { label: 'In-Progress', value: 'In-Progress' },
  { label: 'Completed / Closed', value: 'Completed' },
];

const staffRoles = [
  { label: 'All Roles', value: '' },
  { label: 'Networking Staff', value: 'Networking Staff' },
  { label: 'Plumber', value: 'Plumber' },
  { label: 'Electrician', value: 'Electrician' },
  { label: 'Software Developer', value: 'Software Developer' },
  { label: 'Application', value: 'Application' },
  { label: 'PC Hardware', value: 'PC Hardware' },
];

const ReportsScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    department: '',
    programme: '',
    complaintType: '',
    status: '',
    assignee: '',
    assigneeRole: '',
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const isMultiColumn = isDesktop || isTablet;

  const fetchFiltersData = useCallback(async () => {
    if (user?.role !== 'SuperAdmin') return;
    try {
      const [d, p, u] = await Promise.all([
        departmentService.getAll(),
        programmeService.getAll(),
        userService.getAll(),
      ]);
      setDepartments(d.data || []);
      setProgrammes(p.data || []);
      setUsers(u.data || []);
    } catch (e) {
      console.warn('Failed to load report filter sources', e);
    }
  }, [user]);

  const fetchReport = useCallback(
    async (filterParams) => {
      setError('');
      setLoading(true);
      try {
        const params = { ...filterParams };
        Object.keys(params).forEach((k) => {
          if (!params[k]) delete params[k];
        });
        const res = await complaintService.report(params);
        setResults(res.data || []);
      } catch (err) {
        setError('Intelligence retrieval failed.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchFiltersData();
    const loadSaved = async () => {
      try {
        const savedFilters = await AsyncStorage.getItem('superadmin_report_filters');
        const hasGenerated = await AsyncStorage.getItem('superadmin_report_generated');
        if (hasGenerated && savedFilters) {
          const parsed = JSON.parse(savedFilters);
          setFilters(parsed);
          fetchReport(parsed);
        } else {
          fetchReport({});
        }
      } catch (e) {
        fetchReport({});
      }
    };
    loadSaved();
  }, [fetchFiltersData, fetchReport]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport(filters);
  };

  const handleSearch = async () => {
    try {
      await AsyncStorage.setItem(
        'superadmin_report_filters',
        JSON.stringify(filters)
      );
      await AsyncStorage.setItem('superadmin_report_generated', 'true');
    } catch (e) {}
    fetchReport(filters);
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = [
      'Date',
      'Dept',
      'Programme',
      'Block',
      'Room',
      'Type',
      'Status',
      'CreatedBy',
      'Staff Role',
      'Assignee',
    ];
    const rows = results.map((r) => [
      r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
      r.departmentName || '-',
      r.programmeName || '-',
      r.blockName,
      r.roomNumber,
      r.complaintType,
      r.status,
      r.createdBy?.username || r.createdBy?.email || '',
      r.assignedTo?.role || '-',
      r.assignedTo?.username || r.assignedTo?.email || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => `"${('' + (cell || '')).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TMS_Report_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('CSV Export generated with ' + results.length + ' records.');
    }
  };

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Reports" />
        <EmptyState
          icon="🔒"
          title="Security Clearance Required"
          subtitle="Access to Analytical Reports is restricted to SuperAdmin tier."
          actionTitle="Return Home"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  const filteredStaffUsers = users.filter(
    (u) => !filters.assigneeRole || u.role === filters.assigneeRole
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Reports" />

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
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
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
              <Text style={[styles.pageTitle, { color: colors.text }]}>
                Intelligence Center
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                Advanced multi-dimensional filtering, metric analysis, and CSV export
              </Text>
            </View>
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

          {/* Filter Console */}
          <Card style={styles.filterCard}>
            <View style={styles.filterCardHeaderRow}>
              <Ionicons name="funnel-outline" size={18} color={colors.primary} />
              <Text style={[styles.filterTitle, { color: colors.text, marginLeft: 8 }]}>
                Intelligence Query Console
              </Text>
            </View>

            <View
              style={[
                styles.filterGrid,
                isMultiColumn ? styles.filterGridDesktop : {},
              ]}
            >
              <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                <Select
                  label="Department Unit"
                  value={filters.department}
                  onValueChange={(val) =>
                    setFilters({ ...filters, department: val })
                  }
                  options={[
                    { label: 'All Department Units', value: '' },
                    ...departments.map((d) => ({
                      label: d.name,
                      value: d._id,
                    })),
                  ]}
                />
              </View>

              <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                <Select
                  label="Programme Hub"
                  value={filters.programme}
                  onValueChange={(val) =>
                    setFilters({ ...filters, programme: val })
                  }
                  options={[
                    { label: 'All Programmes', value: '' },
                    ...programmes.map((p) => ({
                      label: p.name,
                      value: p._id,
                    })),
                  ]}
                />
              </View>
            </View>

            <View
              style={[
                styles.filterGrid,
                isMultiColumn ? styles.filterGridDesktop : {},
              ]}
            >
              <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                <Input
                  label="Operational Category / Code"
                  value={filters.complaintType}
                  onChangeText={(val) =>
                    setFilters({ ...filters, complaintType: val })
                  }
                  placeholder="e.g. PC Hardware, Network..."
                />
              </View>

              <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                <Select
                  label="Staff Access Role"
                  value={filters.assigneeRole}
                  onValueChange={(val) =>
                    setFilters({
                      ...filters,
                      assigneeRole: val,
                      assignee: '',
                    })
                  }
                  options={staffRoles}
                />
              </View>
            </View>

            <View
              style={[
                styles.filterGrid,
                isMultiColumn ? styles.filterGridDesktop : {},
              ]}
            >
              <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                <Select
                  label="Specific Personnel"
                  value={filters.assignee}
                  onValueChange={(val) =>
                    setFilters({ ...filters, assignee: val })
                  }
                  options={[
                    { label: 'All Personnel', value: '' },
                    ...filteredStaffUsers.map((u) => ({
                      label: `${u.username} (${u.role})`,
                      value: u._id,
                    })),
                  ]}
                />
              </View>

              <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                <Select
                  label="Lifecycle Status"
                  value={filters.status}
                  onValueChange={(val) =>
                    setFilters({ ...filters, status: val })
                  }
                  options={statusOptions}
                />
              </View>
            </View>

            <View style={[styles.btnActionRow, isSmallMobile && { flexDirection: 'column', gap: 8 }]}>
              <Button
                title="Export CSV"
                icon={<Ionicons name="download-outline" size={16} color={colors.text} />}
                variant="secondary"
                onPress={exportCSV}
                disabled={results.length === 0}
                style={{ flex: 1, marginRight: isSmallMobile ? 0 : 8 }}
              />
              <Button
                title="Run Analysis"
                icon={<Ionicons name="search-outline" size={16} color="#FFFFFF" />}
                variant="primary"
                onPress={handleSearch}
                loading={loading}
                style={{ flex: 1, marginLeft: isSmallMobile ? 0 : 8 }}
              />
            </View>
          </Card>

          {/* Results Grid */}
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeaderRow}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                Analytical Results Grid
              </Text>
              <Badge
                label={`${results.length} Nodes Found`}
                variant="progress"
              />
            </View>

            {loading ? (
              <LoadingState message="Processing Intelligence Query..." />
            ) : (
              results.map((r) => (
                <Card key={r._id} style={styles.resultCard}>
                  <View style={styles.resultCardTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text
                        style={[
                          styles.resultFacility,
                          { color: colors.text },
                        ]}
                      >
                        {r.blockName} • Room {r.roomNumber}
                      </Text>
                      <Text
                        style={[
                          styles.resultDept,
                          { color: colors.textMuted },
                        ]}
                      >
                        {r.departmentName || 'Global'} •{' '}
                        {r.programmeName || 'General'}
                      </Text>
                    </View>
                    <Badge label={r.status} />
                  </View>

                  <View
                    style={[
                      styles.resultMetaRow,
                      { borderTopColor: colors.borderSoft },
                    ]}
                  >
                    <View style={styles.resultMetaCol}>
                      <Text
                        style={[
                          styles.resultMetaLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        Category
                      </Text>
                      <Text
                        style={[
                          styles.resultMetaVal,
                          { color: colors.text },
                        ]}
                      >
                        {r.complaintType}
                      </Text>
                    </View>

                    <View style={styles.resultMetaCol}>
                      <Text
                        style={[
                          styles.resultMetaLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        Originator
                      </Text>
                      <Text
                        style={[
                          styles.resultMetaVal,
                          { color: colors.text },
                        ]}
                      >
                        {r.createdBy?.username || 'N/A'}
                      </Text>
                    </View>

                    <View style={styles.resultMetaCol}>
                      <Text
                        style={[
                          styles.resultMetaLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        Technician
                      </Text>
                      <Text
                        style={[
                          styles.resultMetaVal,
                          { color: colors.primary },
                        ]}
                      >
                        {r.assignedTo?.username || 'Unassigned'}
                      </Text>
                    </View>

                    <View style={styles.resultMetaCol}>
                      <Text
                        style={[
                          styles.resultMetaLabel,
                          { color: colors.textMuted },
                        ]}
                      >
                        Logged Date
                      </Text>
                      <Text
                        style={[
                          styles.resultMetaVal,
                          { color: colors.textMuted },
                        ]}
                      >
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))
            )}

            {!loading && results.length === 0 && (
              <EmptyState
                icon="📊"
                title="No Nodes Identified"
                subtitle="No complaint records matched the specified query parameters."
                actionTitle="Reset Filters"
                onAction={() => {
                  const reset = {
                    department: '',
                    programme: '',
                    complaintType: '',
                    status: '',
                    assignee: '',
                    assigneeRole: '',
                  };
                  setFilters(reset);
                  fetchReport(reset);
                }}
              />
            )}
          </View>
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
    maxWidth: 1100,
  },
  headerRow: {
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
  filterCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pageSubtitle: {
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
  filterCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  filterGrid: {
    flexDirection: 'column',
  },
  filterGridDesktop: {
    flexDirection: 'row',
  },
  btnActionRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  resultsSection: {
    marginTop: 6,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  resultCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  resultFacility: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultDept: {
    fontSize: 12,
    marginTop: 2,
  },
  resultMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 14,
  },
  resultMetaCol: {
    minWidth: 100,
    flex: 1,
  },
  resultMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  resultMetaVal: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default ReportsScreen;
