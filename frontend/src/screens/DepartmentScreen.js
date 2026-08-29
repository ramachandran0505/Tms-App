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
import { departmentService } from '../services/api';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
import {
  Card,
  Input,
  Button,
  Badge,
  EmptyState,
  LoadingState,
} from '../components/UI';
import useResponsive from '../hooks/useResponsive';

const DepartmentScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', shortName: '' });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const isMultiColumn = isDesktop || isTablet;

  const fetchDepartments = useCallback(async () => {
    try {
      setError('');
      const response = await departmentService.getAll();
      setDepartments(response.data || []);
    } catch (err) {
      setError('Failed to fetch department records from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchDepartments();
    }
  }, [user, fetchDepartments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDepartments();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.shortName.trim()) {
      setError('Official Name and Code Identifier are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingId) {
        await departmentService.update(editingId, formData);
      } else {
        await departmentService.create(formData);
      }
      setFormData({ name: '', shortName: '' });
      setEditingId(null);
      setShowForm(false);
      fetchDepartments();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to save department record.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (dept) => {
    setFormData({ name: dept.name, shortName: dept.shortName });
    setEditingId(dept._id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await departmentService.delete(deleteTargetId);
      setDeleteTargetId(null);
      fetchDepartments();
    } catch (err) {
      setError('Deletion failed: Active dependencies linked to this department.');
      setDeleteTargetId(null);
    }
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.shortName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Departments" />
        <EmptyState
          icon="🚫"
          title="Access Restricted"
          subtitle="Department management is restricted to SuperAdmin clearance."
          actionTitle="Return Home"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Departments" />
        <LoadingState message="Syncing Department Records..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Departments" />

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
                Department Hub
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                Campus academic divisions and administrative department records
              </Text>
            </View>
            <Button
              title={showForm ? 'Close Form' : 'New Department'}
              icon={<Ionicons name={showForm ? 'close' : 'add'} size={16} color="#FFFFFF" />}
              onPress={() => {
                setShowForm(!showForm);
                if (showForm) setEditingId(null);
              }}
              style={isSmallMobile ? { width: '100%' } : {}}
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

          {/* Form Drawer Card */}
          {showForm && (
            <Card style={styles.formCard}>
              <Text style={[styles.formCardTitle, { color: colors.text }]}>
                {editingId ? 'Modify Department Record' : 'Register New Department'}
              </Text>

              <View
                style={[
                  styles.formGrid,
                  isMultiColumn ? styles.formGridDesktop : {},
                ]}
              >
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Input
                    label="Official Department Name"
                    value={formData.name}
                    onChangeText={(val) =>
                      setFormData({ ...formData, name: val })
                    }
                    placeholder="e.g. Information Technology"
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Input
                    label="Code Identifier (Short Name)"
                    value={formData.shortName}
                    onChangeText={(val) =>
                      setFormData({ ...formData, shortName: val })
                    }
                    placeholder="e.g. IT"
                    autoCapitalize="characters"
                  />
                </View>
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
                  title={editingId ? 'Update Record' : 'Commit Record'}
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
              placeholder="Search department by name or code..."
              leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
              containerStyle={{ marginVertical: 0 }}
            />
          </Card>

          {/* Department List Items */}
          <View style={styles.listSection}>
            <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
              Registry Output ({filteredDepartments.length})
            </Text>

            {filteredDepartments.map((dept) => (
              <Card key={dept._id} style={styles.itemCard}>
                <View style={styles.itemMainRow}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.deptIconBox,
                        { backgroundColor: colors.cardSecondary },
                      ]}
                    >
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.deptName, { color: colors.text }]}>
                        {dept.name}
                      </Text>
                      <View style={{ flexDirection: 'row', marginTop: 4 }}>
                        <Badge label={dept.shortName} variant="progress" />
                      </View>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.cardSecondary },
                      ]}
                      onPress={() => handleEdit(dept)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                      ]}
                      onPress={() => setDeleteTargetId(dept._id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}

            {filteredDepartments.length === 0 && (
              <EmptyState
                icon="🏢"
                title="No Departments Found"
                subtitle="No active department matches your search criteria."
                actionTitle="Reset Search"
                onAction={() => setSearchTerm('')}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Revoke Department Record"
        message="Are you certain you want to purge this department? All dependent structural records may be affected."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
        confirmText="Confirm Purge"
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
  formGrid: {
    flexDirection: 'column',
  },
  formGridDesktop: {
    flexDirection: 'row',
  },
  formBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 14,
  },
  searchCard: {
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  listSection: {
    marginTop: 4,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  itemCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
  },
  itemMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 200,
  },
  deptIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deptName: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemActions: {
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
});

export default DepartmentScreen;
