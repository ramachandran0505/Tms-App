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
import { programmeService, departmentService } from '../services/api';
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

const ProgrammeScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    department: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const isMultiColumn = isDesktop || isTablet;

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [progRes, deptRes] = await Promise.all([
        programmeService.getAll(),
        departmentService.getAll(),
      ]);
      setProgrammes(progRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      setError('Data synchronization failed.');
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
    if (!formData.name.trim() || !formData.shortName.trim() || !formData.department) {
      setError('Programme Name, Code, and Parent Department are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingId) {
        await programmeService.update(editingId, formData);
      } else {
        await programmeService.create(formData);
      }
      setFormData({ name: '', shortName: '', department: '' });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to commit academic programme record.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (prog) => {
    setFormData({
      name: prog.name,
      shortName: prog.shortName,
      department: prog.department?._id || prog.department || '',
    });
    setEditingId(prog._id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await programmeService.delete(deleteTargetId);
      setDeleteTargetId(null);
      fetchData();
    } catch (err) {
      setError('Deletion restricted by active dependencies.');
      setDeleteTargetId(null);
    }
  };

  const filteredProgrammes = programmes.filter(
    (prog) =>
      prog.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.shortName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Programmes" />
        <EmptyState
          icon="🚫"
          title="Access Restricted"
          subtitle="Programme registry configuration requires SuperAdmin clearance."
          actionTitle="Return Home"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Programmes" />
        <LoadingState message="Accessing Academic Curriculum Directory..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Programmes" />

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
                Academic Programmes
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                Degree curricula, study branches, and departmental faculties
              </Text>
            </View>
            <Button
              title={showForm ? 'Close Form' : 'Add Programme'}
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
                {editingId ? 'Modify Academic Programme' : 'Register Programme Pathway'}
              </Text>

              <View
                style={[
                  styles.formGrid,
                  isMultiColumn ? styles.formGridDesktop : {},
                ]}
              >
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Input
                    label="Official Programme Title"
                    value={formData.name}
                    onChangeText={(val) =>
                      setFormData({ ...formData, name: val })
                    }
                    placeholder="e.g. B.Tech Computer Science & Engineering"
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Input
                    label="Programme Code (Abbreviation)"
                    value={formData.shortName}
                    onChangeText={(val) =>
                      setFormData({ ...formData, shortName: val })
                    }
                    placeholder="e.g. BTECH-CSE"
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <Select
                label="Parent Department Assignment"
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
                  title={editingId ? 'Update Record' : 'Register Programme'}
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
              placeholder="Search programme title, code, or department..."
              leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
              containerStyle={{ marginVertical: 0 }}
            />
          </Card>

          {/* List Output */}
          <View style={styles.listSection}>
            <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
              Programme Index ({filteredProgrammes.length})
            </Text>

            {filteredProgrammes.map((prog) => (
              <Card key={prog._id} style={styles.itemCard}>
                <View style={styles.itemMainRow}>
                  <View style={styles.itemLeft}>
                    <View
                      style={[
                        styles.progIconBox,
                        { backgroundColor: colors.cardSecondary },
                      ]}
                    >
                      <Ionicons
                        name="school-outline"
                        size={20}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={[styles.progName, { color: colors.text }]}>
                        {prog.name}
                      </Text>
                      <View style={styles.tagRow}>
                        <Badge label={prog.shortName} variant="admin" />
                        <Text
                          style={[
                            styles.deptSubText,
                            { color: colors.textMuted },
                          ]}
                          numberOfLines={1}
                        >
                          {prog.department?.name || 'Unassigned Dept'}
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
                      onPress={() => handleEdit(prog)}
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
                      onPress={() => setDeleteTargetId(prog._id)}
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

            {filteredProgrammes.length === 0 && (
              <EmptyState
                icon="🎓"
                title="No Programmes Found"
                subtitle="No academic curriculum records match your query."
                actionTitle="Reset Search"
                onAction={() => setSearchTerm('')}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Revoke Academic Programme"
        message="Are you sure you want to permanently erase this programme registry?"
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
  progIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progName: {
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
  deptSubText: {
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

export default ProgrammeScreen;
