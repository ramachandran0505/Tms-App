import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { roleService } from '../services/api';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import {
  Card,
  Input,
  Button,
  Badge,
  StatCard,
  EmptyState,
  LoadingState,
} from '../components/UI';
import useResponsive from '../hooks/useResponsive';

const PRESET_PERMISSIONS = [
  'manage_users',
  'triage_tickets',
  'view_reports',
  'manage_facilities',
  'system_admin',
  'export_data',
  'manage_departments',
  'read_only',
];

const RoleScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', permissions: '' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchRoles = useCallback(async () => {
    try {
      setError('');
      const response = await roleService.getAll();
      setRoles(response.data || []);
    } catch (err) {
      setError('Failed to fetch authorization levels.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchRoles();
    }
  }, [user, fetchRoles]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRoles();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Role Designation Name is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const permissions = formData.permissions
        .split(',')
        .map((p) => p.trim())
        .filter((p) => p);

      const data = { name: formData.name, permissions };

      if (editingId) {
        await roleService.update(editingId, data);
      } else {
        await roleService.create(data);
      }

      setFormData({ name: '', permissions: '' });
      setEditingId(null);
      setShowForm(false);
      fetchRoles();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Authorization commitment failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (role) => {
    setFormData({
      name: role.name,
      permissions: role.permissions?.join(', ') || '',
    });
    setEditingId(role._id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await roleService.delete(deleteTargetId);
      setDeleteTargetId(null);
      fetchRoles();
    } catch (err) {
      setError('Revocation denied: Active association detected.');
      setDeleteTargetId(null);
    }
  };

  const togglePresetPermission = (perm) => {
    const currentList = formData.permissions
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p);

    let updatedList;
    if (currentList.includes(perm)) {
      updatedList = currentList.filter((p) => p !== perm);
    } else {
      updatedList = [...currentList, perm];
    }
    setFormData({ ...formData, permissions: updatedList.join(', ') });
  };

  const filteredRoles = roles.filter(
    (role) =>
      role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.permissions?.some((p) =>
        p.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const getRoleCardWidth = () => {
    if (isDesktop) return '48.5%';
    return '100%';
  };

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Roles" />
        <EmptyState
          icon="🚫"
          title="Access Restricted"
          subtitle="Security Role configuration requires SuperAdmin clearance."
          actionTitle="Return Home"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Roles" />
        <LoadingState message="Auditing Security Role Matrix..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Roles" />

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
            <View style={{ flex: 1, minWidth: 200, marginBottom: 8 }}>
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
                Roles & Access Matrix
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                Security policy governance, clearance levels, and permission schemes
              </Text>
            </View>
            <Button
              title={showForm ? 'Close Matrix' : 'Define Role'}
              icon={<Ionicons name={showForm ? 'close' : 'add'} size={16} color="#FFFFFF" />}
              onPress={() => {
                setShowForm(!showForm);
                if (showForm) setEditingId(null);
              }}
              style={isSmallMobile ? { width: '100%' } : {}}
            />
          </View>

          {/* Metric Overview */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="🛡️"
              number={String(roles.length)}
              label="Defined Roles"
              color="#6C47FF"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
            <StatCard
              icon="⚡"
              number={String(PRESET_PERMISSIONS.length)}
              label="System Permissions"
              color="#3B82F6"
              style={isSmallMobile ? { minWidth: '46%' } : {}}
            />
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

          {/* Form Drawer */}
          {showForm && (
            <Card style={styles.formCard}>
              <Text style={[styles.formCardTitle, { color: colors.text }]}>
                {editingId ? 'Modify Security Role' : 'Create Role Definition'}
              </Text>

              <Input
                label="Role Designation Name"
                value={formData.name}
                onChangeText={(val) => setFormData({ ...formData, name: val })}
                placeholder="e.g. Facilities Inspector"
              />

              <Input
                label="Permissions List (comma-separated)"
                value={formData.permissions}
                onChangeText={(val) =>
                  setFormData({ ...formData, permissions: val })
                }
                placeholder="manage_users, triage_tickets, view_reports..."
              />

              <Text style={[styles.presetTitle, { color: colors.textMuted }]}>
                Quick Permission Toggles:
              </Text>
              <View style={styles.presetChipsRow}>
                {PRESET_PERMISSIONS.map((perm) => {
                  const isSelected = formData.permissions
                    .split(',')
                    .map((p) => p.trim())
                    .includes(perm);

                  return (
                    <TouchableOpacity
                      key={perm}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.cardSecondary,
                          borderColor: isSelected
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                      onPress={() => togglePresetPermission(perm)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          {
                            color: isSelected ? '#FFFFFF' : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {perm}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.formBtnRow}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  style={{ marginRight: 8 }}
                />
                <Button
                  title={editingId ? 'Update Role' : 'Commit Role'}
                  icon={<Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />}
                  onPress={handleSubmit}
                  loading={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {/* Search Bar */}
          <Card style={styles.searchCard}>
            <Input
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search role designation or specific permission..."
              leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
              containerStyle={{ marginVertical: 0 }}
            />
          </Card>

          {/* Output Roles Grid */}
          <View style={styles.rolesGrid}>
            {filteredRoles.map((role) => (
              <Card
                key={role._id}
                style={[
                  styles.roleCard,
                  { width: getRoleCardWidth() },
                ]}
              >
                <View style={styles.roleCardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.roleName, { color: colors.text }]}>
                      {role.name}
                    </Text>
                    <Text style={[styles.rolePermCount, { color: colors.textMuted }]}>
                      {role.permissions?.length || 0} Permissions Granted
                    </Text>
                  </View>

                  <View style={styles.roleActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.cardSecondary },
                      ]}
                      onPress={() => handleEdit(role)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>

                    {role.name !== 'SuperAdmin' && (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                        ]}
                        onPress={() => setDeleteTargetId(role._id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color={colors.danger}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.permsSection,
                    { borderTopColor: colors.borderSoft },
                  ]}
                >
                  <View style={styles.permPillsWrap}>
                    {role.permissions && role.permissions.length > 0 ? (
                      role.permissions.map((p, i) => (
                        <View
                          key={i}
                          style={[
                            styles.permPill,
                            { backgroundColor: colors.cardSecondary },
                          ]}
                        >
                          <Text
                            style={[
                              styles.permPillText,
                              { color: colors.textMuted },
                            ]}
                          >
                            {p}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text
                        style={[
                          styles.noPermText,
                          { color: colors.textDim },
                        ]}
                      >
                        No active permissions assigned.
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>

          {filteredRoles.length === 0 && (
            <EmptyState
              icon="🛡️"
              title="No Roles Located"
              subtitle="No security roles match your search term."
              actionTitle="Reset Search"
              onAction={() => setSearchTerm('')}
            />
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Revoke Role Matrix"
        message="Are you certain you wish to revoke this role? Users assigned to this role will lose clearance."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pageSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 16,
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
  formCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  formCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 6,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 12,
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  searchCard: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  roleCard: {
    padding: 18,
    borderRadius: 14,
    marginBottom: 12,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '700',
  },
  rolePermCount: {
    fontSize: 12,
    marginTop: 2,
  },
  roleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permsSection: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  permPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  permPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  permPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noPermText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default RoleScreen;
