import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { userService, departmentService } from '../services/api';
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

const roles = [
  'SuperAdmin',
  'User',
  'Networking Staff',
  'Plumber',
  'Electrician',
  'Software Developer',
  'Application',
  'PC Hardware',
];

const UserScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'User',
    department: '',
    profileImage: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const isMultiColumn = isDesktop || isTablet;

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [userRes, deptRes] = await Promise.all([
        userService.getAll(),
        departmentService.getAll(),
      ]);
      setUsers(userRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      setError('User directory synchronization failed.');
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
    if (!formData.username.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Username, Email, and Contact Phone are required.');
      return;
    }

    if (!editingId && !formData.password.trim()) {
      setError('Security key required for new identities.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const submitData = { ...formData };
      if (editingId && !submitData.password) {
        delete submitData.password;
      }
      if (submitData.department === '') {
        delete submitData.department;
      }

      if (editingId) {
        await userService.update(editingId, submitData);
      } else {
        await userService.create(submitData);
      }

      setFormData({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'User',
        department: '',
        profileImage: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || 'Identity registration failed.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (userData) => {
    setFormData({
      username: userData.username,
      email: userData.email,
      phone: userData.phone || '',
      password: '',
      role: userData.role || 'User',
      department: userData.department?._id || userData.department || '',
      profileImage: userData.profileImage || '',
    });
    setEditingId(userData._id);
    setShowForm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await userService.delete(deleteTargetId);
      setDeleteTargetId(null);
      fetchData();
    } catch (err) {
      setError('Identity removal rejected by server.');
      setDeleteTargetId(null);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserCardWidth = () => {
    if (isDesktop) return '48.5%';
    return '100%';
  };

  if (user?.role !== 'SuperAdmin') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Users" />
        <EmptyState
          icon="🚫"
          title="Access Restricted"
          subtitle="User account directory management is restricted to SuperAdmin clearance."
          actionTitle="Return Home"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="Users" />
        <LoadingState message="Accessing Account Registry..." />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="Users" />

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
                User Account Directory
              </Text>
              <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
                Manage technicians, administrative staff, students, and operators
              </Text>
            </View>
            <Button
              title={showForm ? 'Close Directory' : 'Add User'}
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
                {editingId ? 'Modify User Identity' : 'Provision User Account'}
              </Text>

              <View
                style={[
                  styles.formGrid,
                  isMultiColumn ? styles.formGridDesktop : {},
                ]}
              >
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Input
                    label="Full Name / Handle"
                    value={formData.username}
                    onChangeText={(val) =>
                      setFormData({ ...formData, username: val })
                    }
                    placeholder="e.g. Alex Morgan"
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Input
                    label="Email Identity"
                    value={formData.email}
                    onChangeText={(val) =>
                      setFormData({ ...formData, email: val })
                    }
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
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
                    label="Contact Telephone"
                    value={formData.phone}
                    onChangeText={(val) =>
                      setFormData({ ...formData, phone: val })
                    }
                    placeholder="+1 555-0199"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Input
                    label={editingId ? 'New Password (Optional)' : 'Security Key'}
                    value={formData.password}
                    onChangeText={(val) =>
                      setFormData({ ...formData, password: val })
                    }
                    placeholder="••••••••"
                    secureTextEntry
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
                  <Select
                    label="Account Role & Clearance"
                    value={formData.role}
                    onValueChange={(val) =>
                      setFormData({ ...formData, role: val })
                    }
                    options={roles.map((r) => ({ label: r, value: r }))}
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Select
                    label="Department Affiliation (Optional)"
                    value={formData.department}
                    onValueChange={(val) =>
                      setFormData({ ...formData, department: val })
                    }
                    placeholder="Select Department"
                    options={[
                      { label: 'None / General', value: '' },
                      ...departments.map((d) => ({
                        label: `${d.name} (${d.shortName})`,
                        value: d._id,
                      })),
                    ]}
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
                  title={editingId ? 'Update Identity' : 'Provision Identity'}
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
              placeholder="Search name, email, phone, role, or department..."
              leftIcon={<Ionicons name="search-outline" size={18} color={colors.textMuted} />}
              containerStyle={{ marginVertical: 0 }}
            />
          </Card>

          {/* Users Grid Output */}
          <View style={styles.usersGrid}>
            {filteredUsers.map((u) => (
              <Card
                key={u._id}
                style={[
                  styles.userCard,
                  { width: getUserCardWidth() },
                ]}
              >
                <View style={styles.userCardTop}>
                  <View
                    style={[
                      styles.userAvatar,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    {u.profileImage ? (
                      <Image
                        source={{ uri: u.profileImage }}
                        style={styles.avatarImg}
                      />
                    ) : (
                      <Text style={styles.avatarLetter}>
                        {u.username?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    )}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.userName, { color: colors.text }]}>
                      {u.username}
                    </Text>
                    <Text style={[styles.userEmail, { color: colors.textMuted }]}>
                      {u.email}
                    </Text>
                  </View>

                  <View style={styles.userActions}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: colors.cardSecondary },
                      ]}
                      onPress={() => handleEdit(u)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color={colors.primary}
                      />
                    </TouchableOpacity>

                    {u._id !== user?.id && u._id !== user?._id && (
                      <TouchableOpacity
                        style={[
                          styles.actionBtn,
                          { backgroundColor: 'rgba(239, 68, 68, 0.12)' },
                        ]}
                        onPress={() => setDeleteTargetId(u._id)}
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
                    styles.userCardBottom,
                    { borderTopColor: colors.borderSoft },
                  ]}
                >
                  <Badge
                    label={u.role}
                    variant={u.role === 'SuperAdmin' ? 'admin' : 'progress'}
                  />
                  <Text style={[styles.userPhone, { color: colors.textMuted }]}>
                    📞 {u.phone || 'No phone'}
                  </Text>
                  {u.department && (
                    <Text
                      style={[styles.userDept, { color: colors.textDim }]}
                      numberOfLines={1}
                    >
                      🏢 {u.department.name || u.department}
                    </Text>
                  )}
                </View>
              </Card>
            ))}
          </View>

          {filteredUsers.length === 0 && (
            <EmptyState
              icon="👥"
              title="No User Records Located"
              subtitle="No accounts match your query parameters."
              actionTitle="Reset Search"
              onAction={() => setSearchTerm('')}
            />
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Revoke User Account"
        message="Are you certain you wish to purge this user identity? Active assigned tickets will become unassigned."
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
  usersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  userCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  userCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: 44,
    height: 44,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  userActions: {
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
  userCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 12,
  },
  userPhone: {
    fontSize: 12,
  },
  userDept: {
    fontSize: 12,
    flex: 1,
  },
});

export default UserScreen;
