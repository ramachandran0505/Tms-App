import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import {
  complaintService,
  blockService,
  roomService,
  departmentService,
} from '../services/api';
import Navbar from '../components/Navbar';
import { Card, Button, Input, Select, LoadingState } from '../components/UI';
import useResponsive from '../hooks/useResponsive';

const complaintTypes = [
  'PC Hardware',
  'PC Software',
  'Application Issues',
  'Network',
  'Electronics',
  'Plumbing',
  'Other',
];

const ComplaintFormScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext);
  const { isDesktop, isTablet, isSmallMobile, horizontalPadding } = useResponsive();

  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [blockId, setBlockId] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [type, setType] = useState(complaintTypes[0]);
  const [remarks, setRemarks] = useState('');
  const [attachment, setAttachment] = useState(null);

  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isMultiColumn = isDesktop || isTablet;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const resp = await departmentService.getAll();
        setDepartments(resp.data || []);
      } catch (err) {
        setError('Failed to initialize departmental registry.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchBlocks = async () => {
      if (!departmentId) {
        setBlocks([]);
        setBlockId('');
        return;
      }
      try {
        let resp = await blockService.getAll({ departmentId });
        let blockData = resp.data || [];
        if (blockData.length === 0) {
          const fallbackResp = await blockService.getAll();
          blockData = fallbackResp.data || [];
        }
        setBlocks(blockData);
      } catch (err) {
        console.warn('Failed to load blocks', err?.message);
      }
    };
    fetchBlocks();
    setBlockId('');
    setRoomId('');
    setFilteredRooms([]);
  }, [departmentId]);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!blockId || blockId === '__general__') {
        setFilteredRooms([]);
        setRoomId('');
        return;
      }
      try {
        let resp = await roomService.getAll({ blockId });
        let roomData = resp.data || [];
        if (roomData.length === 0) {
          const fallbackResp = await roomService.getAll();
          roomData = fallbackResp.data || [];
        }
        setFilteredRooms(roomData);
      } catch (err) {
        console.warn('Failed to load rooms', err?.message);
      }
    };
    fetchRooms();
    setRoomId('');
  }, [blockId]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          file: asset.file,
        });
      }
    } catch (e) {
      console.warn('Error picking image', e);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAttachment({
          uri: asset.uri,
          name: asset.name || `doc_${Date.now()}.pdf`,
          type: asset.mimeType || 'application/pdf',
          file: asset.file,
        });
      }
    } catch (e) {
      console.warn('Error picking document', e);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!departmentId) {
      setError('Please select a target Department.');
      return;
    }
    if (!blockId) {
      setError('Please select a Sector / Block.');
      return;
    }

    const selectedDepartment = departments.find((d) => d._id === departmentId);
    const selectedBlock = blocks.find((b) => b._id === blockId);
    const selectedRoom = filteredRooms.find((r) => r._id === roomId);

    const finalBlockName =
      selectedBlock?.name ||
      (blockId === '__general__' ? 'General Block' : 'Main Block');
    const finalRoomNumber =
      roomId === '__manual__'
        ? customRoomNumber
        : selectedRoom?.roomNumber || customRoomNumber || 'General Room';

    if (!finalRoomNumber.trim()) {
      setError('Valid facility / room identifier required.');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('departmentName', selectedDepartment?.name || '');
      formData.append(
        'programmeName',
        selectedBlock?.programme?.name || 'General Programme'
      );
      formData.append('blockName', finalBlockName);
      formData.append('roomNumber', finalRoomNumber);
      formData.append('complaintType', type);
      formData.append('remarks', remarks);

      if (user?.id || user?._id) {
        formData.append('userId', user.id || user._id);
      }

      if (attachment) {
        if (Platform.OS === 'web' && attachment.file) {
          formData.append('attachment', attachment.file);
        } else if (Platform.OS === 'web') {
          try {
            const resp = await fetch(attachment.uri);
            const blob = await resp.blob();
            formData.append('attachment', blob, attachment.name);
          } catch (e) {
            formData.append('attachment', {
              uri: attachment.uri,
              name: attachment.name,
              type: attachment.type,
            });
          }
        } else {
          formData.append('attachment', {
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.type || 'image/jpeg',
          });
        }
      }

      await complaintService.create(formData);
      navigation.navigate('Home');
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to transmit complaint ticket. Please check connection.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData && departments.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Navbar navigation={navigation} currentRoute="ComplaintForm" />
        <LoadingState message="Initializing Secure Form..." />
      </View>
    );
  }

  const blockOptions = [
    ...blocks.map((b) => ({ label: b.name, value: b._id })),
    { label: 'General / Other Block', value: '__general__' },
  ];

  const roomOptions = [
    ...filteredRooms.map((r) => ({
      label: `Room ${r.roomNumber}`,
      value: r._id,
    })),
    { label: 'Manual Entry / Other', value: '__manual__' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Navbar navigation={navigation} currentRoute="ComplaintForm" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formRail}>
            <View style={styles.formHeroHeader}>
              <TouchableOpacity
                style={styles.backLink}
                onPress={() => navigation.navigate('Home')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
                <Text style={[styles.backLinkText, { color: colors.primary }]}>
                  Back to Dashboard
                </Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.formBadge,
                  { backgroundColor: 'rgba(108, 71, 255, 0.15)' },
                ]}
              >
                <Ionicons name="flash" size={14} color={colors.primary} />
                <Text
                  style={[styles.formBadgeText, { color: colors.primary }]}
                >
                  SERVICE DISPATCH DESK
                </Text>
              </View>
              <Text style={[styles.formTitle, { color: colors.text }]}>
                Report Maintenance Incident
              </Text>
              <Text style={[styles.formSubtitle, { color: colors.textMuted }]}>
                Submit a high-priority service ticket to campus facility engineering
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

            <Card style={styles.formCard}>
              {/* Row 1: Department & Block */}
              <View style={[styles.formRow, isMultiColumn ? styles.rowDesktop : {}]}>
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Select
                    label="Target Department"
                    value={departmentId}
                    onValueChange={(val) => setDepartmentId(val)}
                    placeholder="Select Department"
                    options={departments.map((d) => ({
                      label: d.name,
                      value: d._id,
                    }))}
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Select
                    label="Sector / Block"
                    value={blockId}
                    onValueChange={(val) => setBlockId(val)}
                    placeholder="Select Campus Block"
                    disabled={!departmentId}
                    options={blockOptions}
                  />
                </View>
              </View>

              {/* Row 2: Room & Service Category */}
              <View style={[styles.formRow, isMultiColumn ? styles.rowDesktop : {}]}>
                <View style={isMultiColumn ? { flex: 1, marginRight: 8 } : {}}>
                  <Select
                    label="Facility / Room"
                    value={roomId}
                    onValueChange={(val) => setRoomId(val)}
                    placeholder="Select Room Identifier"
                    disabled={!departmentId}
                    options={roomOptions}
                  />
                </View>

                <View style={isMultiColumn ? { flex: 1, marginLeft: 8 } : {}}>
                  <Select
                    label="Service Category"
                    value={type}
                    onValueChange={(val) => setType(val)}
                    options={complaintTypes.map((t) => ({
                      label: t,
                      value: t,
                    }))}
                  />
                </View>
              </View>

              {/* Custom manual room entry if selected */}
              {roomId === '__manual__' && (
                <Input
                  label="Custom Room Identifier"
                  value={customRoomNumber}
                  onChangeText={setCustomRoomNumber}
                  placeholder="e.g. LAB-004 or Workshop-2"
                />
              )}

              {/* Description */}
              <Input
                label="Description of Incident"
                value={remarks}
                onChangeText={setRemarks}
                placeholder="Provide specific details of the operational or hardware breakdown..."
                multiline
                numberOfLines={4}
              />

              {/* File / Media Attachment */}
              <View style={styles.uploadSection}>
                <Text
                  style={[styles.uploadLabel, { color: colors.textMuted }]}
                >
                  Evidentiary Documentation (Photo or PDF)
                </Text>

                {attachment ? (
                  <View
                    style={[
                      styles.attachedFileBox,
                      {
                        backgroundColor: colors.cardSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        attachment.type?.includes('image')
                          ? 'image-outline'
                          : 'document-text-outline'
                      }
                      size={24}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={[styles.attachedFileName, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {attachment.name}
                      </Text>
                      <Text
                        style={[
                          styles.attachedFileSize,
                          { color: colors.textMuted },
                        ]}
                      >
                        Attached ready for transmission
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setAttachment(null)}
                      style={styles.removeFileBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color={colors.danger}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.uploadBtnRow, isSmallMobile && { flexDirection: 'column' }]}>
                    <TouchableOpacity
                      style={[
                        styles.uploadPickerBtn,
                        {
                          backgroundColor: colors.cardSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={pickImage}
                    >
                      <Ionicons
                        name="camera-outline"
                        size={22}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.uploadPickerBtnText,
                          { color: colors.text },
                        ]}
                      >
                        Attach Photo
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.uploadPickerBtn,
                        {
                          backgroundColor: colors.cardSecondary,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={pickDocument}
                    >
                      <Ionicons
                        name="document-attach-outline"
                        size={22}
                        color={colors.primary}
                      />
                      <Text
                        style={[
                          styles.uploadPickerBtnText,
                          { color: colors.text },
                        ]}
                      >
                        Attach Document
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <Button
                title={submitting ? 'Transmitting Ticket...' : 'Initiate Service Request'}
                icon={<Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />}
                onPress={handleSubmit}
                loading={submitting}
                size="lg"
                style={{ marginTop: 24 }}
              />
            </Card>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  formRail: {
    width: '100%',
    maxWidth: 780,
  },
  formHeroHeader: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 6,
    marginBottom: 8,
  },
  formBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  formSubtitle: {
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
    padding: 22,
    borderRadius: 18,
  },
  formRow: {
    flexDirection: 'column',
  },
  rowDesktop: {
    flexDirection: 'row',
  },
  uploadSection: {
    marginTop: 14,
  },
  uploadLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadPickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 8,
    minHeight: 48,
  },
  uploadPickerBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  attachedFileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  attachedFileName: {
    fontSize: 14,
    fontWeight: '600',
  },
  attachedFileSize: {
    fontSize: 11,
    marginTop: 2,
  },
  removeFileBtn: {
    padding: 6,
  },
});

export default ComplaintFormScreen;
