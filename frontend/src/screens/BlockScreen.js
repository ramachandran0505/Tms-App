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
import {
  blockService,
  departmentService,
  programmeService,
} from '../services/api';
import Navbar from '../components/Navbar';
import ConfirmModal from '../components/ConfirmModal';
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

const BlockScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    programme: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const isMultiColumn = isDesktop || isTablet;

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [blockRes, deptRes, progRes] = await Promise.all([
        blockService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
      ]);
      setBlocks(blockRes.data || []);
      setDepartments(deptRes.data || []);
      setProgrammes(progRes.data || []);
    } catch (err) {
      setError('Infrastructure data synchronization failed.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'SuperAdmin') {
      fetchData();
    }
  }, [user, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.department || !formData.programme) {
      setError('Block Name, Department, and Programme are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingId) {
        await blockService.update(editingId, formData);
      } else {
        await blockService.create(formData);
      }
      setFormData({ name: '', department: '', programme: '' });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Operation failed: Database write error.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (block) => {
    setFormData({
      name: block.name,
      department: block.department?._id || block.department || '',
      programme: block.programme?._id || block.programme || '',
    });
    setEditingId(block._id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await blockService.delete(deleteTargetId);
      setDeleteTargetId(null);
      fetchData();
    } catch (err) {
      setError('Deletion failed: Structural dependency detected.');
      setDeleteTargetId(null);
    }
  };

  const filteredBlocks = blocks.filter(
    (block) =>
      block.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.programme?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Blocks" />
        <EmptyState
          icon="🚫"
          title="Access Restricted"
          subtitle="Campus infrastructure topology requires SuperAdmin clearance."
          actionTitle="Return Home"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Blocks" />
        <LoadingState message="Syncing Structural Block Registry..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Blocks" />

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
                Campus Blocks & Buildings
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                Building physical zones, structures, wings, and facility complexes
              </Text>
            </View>
            <Button
              title={showForm ? 'Close Form' : 'Add Block'}
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

          {/* Form Drawer */}
          {showForm && (
            <Card style={styles.formCard}>
              <Text style={[styles.formCardTitle, { color: colors.text }]}>
                {editingId ? 'Modify Campus Block' : 'Register New Campus Block'}
              </Text>

              <Input
                label="Official Block Designation / Title"
                value={formData.name}
                onChangeText={(val) => setFormData({ ...formData, name: val })}
                placeholder="e.g. Technology Tower - Block A"
              />

              <View
                style={[
                  styles.formGrid,
                  isMultiColumn ? styles.formGridDesktop : {},
                ]}
              >
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Select
                    label="Assigned Department"
                    value={formData.department}
                    onValueChange={(val) =>
                      setFormData({ ...formData, department: val })
                    }
                    placeholder="Select Department"
                    options={departments.map((d) => ({
                      label: `${d.name} (${d.shortName})`,
                      value: d._id,
                    }))}
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Select
                    label="Associated Academic Programme"
                    value={formData.programme}
                    onValueChange={(val) =>
                      setFormData({ ...formData, programme: val })
                    }
                    placeholder="Select Programme"
                    options={programmes.map((p) => ({
                      label: `${p.name} (${p.shortName})`,
                      value: p._id,
                    }))}
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
                  title={editingId ? 'Update Block' : 'Register Block'}
                  icon={<Ionicons name="checkmark-outline" size={16} color="#FFFFFF" />}
                  onPress={handleSubmit}
                  loading={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          )}

          {/* Search Card */}
          <Card style={styles.searchCard}>
            <Input
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search block name, parent department, or programme..."
              leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
              containerStyle={{ marginVertical: 0 }}
            />
          </Card>

          {/* Output List */}
          <View style={styles.listSection}>
            <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
              Facility Infrastructure Index ({filteredBlocks.length})
            </Text>

            {filteredBlocks.map((block) => (
              <Card key={block._id} style={styles.itemCard}>
                <View style={styles.itemMainRow}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.blockIconBox,
                        { backgroundColor: colors.cardSecondary },
                      ]}
                    >
                      <Ionicons
                        name="cube-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.blockName, { color: colors.text }]}>
                        {block.name}
                      </Text>
                      <View style={styles.tagRow}>
                        <Badge
                          label={block.department?.name || 'Department'}
                          variant="assigned"
                        />
                        <Text
                          style={[
                            styles.blockSubText,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {block.programme?.name || 'General Programme'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.cardSecondary },
                      ]}
                      onPress={() => handleEdit(block)}
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
                      onPress={() => setDeleteTargetId(block._id)}
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

            {filteredBlocks.length === 0 && (
              <EmptyState
                icon="🏢"
                title="No Blocks Identified"
                subtitle="No building or infrastructure blocks match your search query."
                actionTitle="Reset Search"
                onAction={() => setSearchTerm('')}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Revoke Building Structure"
        message="Are you certain you wish to delete this campus block record? All rooms situated within will be orphaned."
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
    minWidth: 220,
  },
  blockIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockName: {
    fontSize: 15,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  blockSubText: {
    fontSize: 12,
    marginLeft: 6,
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

export default BlockScreen;
