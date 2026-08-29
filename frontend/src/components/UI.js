import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export const ResponsiveContainer = ({ children, style, maxWidth = 1200 }) => {
  const { width } = useWindowDimensions();
  const padH = width < 480 ? 12 : width < 768 ? 16 : width < 1024 ? 24 : 32;

  return (
    <View
      style={[
        styles.responsiveContainerBase,
        {
          maxWidth,
          paddingHorizontal: padH,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useContext(ThemeContext);

  let bg = colors.primary;
  let fg = '#FFFFFF';
  let border = 'transparent';

  if (variant === 'secondary') {
    bg = colors.cardSecondary;
    fg = colors.text;
    border = colors.border;
  } else if (variant === 'danger') {
    bg = colors.danger;
    fg = '#FFFFFF';
  } else if (variant === 'outline') {
    bg = 'transparent';
    fg = colors.primary;
    border = colors.primary;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    fg = colors.textMuted;
  } else if (variant === 'success') {
    bg = colors.success;
    fg = '#FFFFFF';
  }

  const minH = size === 'sm' ? 36 : size === 'lg' ? 50 : 44;
  const padV = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
  const padH = size === 'sm' ? 12 : size === 'lg' ? 24 : 18;
  const fontSz = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btnBase,
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: border === 'transparent' ? 0 : 1,
          paddingVertical: padV,
          paddingHorizontal: padH,
          minHeight: minH,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon && <View style={styles.btnIconBox}>{icon}</View>}
          <Text
            style={[
              styles.btnText,
              { color: fg, fontSize: fontSz, fontWeight: '600' },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const Card = ({ children, style, secondary = false, onPress }) => {
  const { colors } = useContext(ThemeContext);
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={onPress ? 0.85 : 1}
      style={[
        styles.cardBase,
        {
          backgroundColor: secondary ? colors.cardSecondary : colors.card,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </Container>
  );
};

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  multiline,
  numberOfLines,
  error,
  style,
  containerStyle,
  editable = true,
  rightElement,
  leftIcon,
  icon,
}) => {
  const { colors } = useContext(ThemeContext);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isSecure = secureTextEntry && !showPassword;
  const leadIcon = leftIcon || icon;

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: colors.inputBg,
            borderColor: error
              ? colors.danger
              : isFocused
              ? colors.primary
              : colors.border,
            minHeight: multiline ? (numberOfLines || 3) * 24 + 20 : 48,
          },
          style,
        ]}
      >
        {leadIcon && (
          <View style={styles.inputLeadIconBox}>
            {typeof leadIcon === 'string' ? (
              <Text style={{ fontSize: 16 }}>{leadIcon}</Text>
            ) : (
              leadIcon
            )}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textDim}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.inputField,
            {
              color: colors.text,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.inputActionBtn}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
        {rightElement && (
          <View style={styles.inputActionBtn}>{rightElement}</View>
        )}
      </View>
      {error ? (
        <Text style={[styles.inputError, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

export const Select = ({
  label,
  value,
  onValueChange,
  options = [],
  placeholder = 'Select option',
  disabled = false,
  containerStyle,
}) => {
  const { colors } = useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);
  const { height, width } = useWindowDimensions();

  const selectedOption = options.find(
    (o) => String(o.value ?? o._id ?? o) === String(value)
  );
  const displayText = selectedOption
    ? selectedOption.label ?? selectedOption.name ?? selectedOption.roomNumber ?? selectedOption
    : placeholder;

  const maxModalHeight = Math.min(420, height * 0.75);

  return (
    <View style={[styles.inputContainer, containerStyle]}>
      {label && (
        <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
      )}
      <TouchableOpacity
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
        style={[
          styles.selectTrigger,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: selectedOption ? colors.text : colors.textDim,
            },
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {}}
            style={[
              styles.modalSelectContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                maxWidth: Math.min(440, width - 32),
              },
            ]}
          >
            <View style={styles.modalSelectHeader}>
              <Text style={[styles.modalSelectTitle, { color: colors.text }]} numberOfLines={1}>
                {label || placeholder}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close dialog"
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: maxModalHeight }} keyboardShouldPersistTaps="handled">
              {options.map((opt, i) => {
                const optVal = opt.value ?? opt._id ?? opt;
                const optLabel =
                  opt.label ?? opt.name ?? opt.roomNumber ?? opt;
                const isSelected = String(optVal) === String(value);

                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.modalOptionItem,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : 'transparent',
                        borderColor: colors.borderSoft,
                      },
                    ]}
                    onPress={() => {
                      onValueChange(optVal);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                          flex: 1,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {optLabel}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.primary}
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const Badge = ({
  label,
  variant = 'default',
  icon,
  style,
  textStyle,
}) => {
  const { colors } = useContext(ThemeContext);

  let bg = colors.cardSecondary;
  let fg = colors.textMuted;

  if (
    variant === 'pending' ||
    label === 'Pending' ||
    label === 'Awaiting Triage'
  ) {
    bg = 'rgba(245, 158, 11, 0.15)';
    fg = '#F59E0B';
  } else if (variant === 'assigned' || label === 'Assigned') {
    bg = 'rgba(139, 92, 246, 0.15)';
    fg = '#8B5CF6';
  } else if (
    variant === 'progress' ||
    label === 'In-Progress' ||
    label === 'In Progress'
  ) {
    bg = 'rgba(59, 130, 246, 0.15)';
    fg = '#3B82F6';
  } else if (variant === 'onhold' || label === 'Onhold' || label === 'On Hold') {
    bg = 'rgba(234, 88, 12, 0.15)';
    fg = '#EA580C';
  } else if (
    variant === 'completed' ||
    label === 'Completed' ||
    label === 'Closed'
  ) {
    bg = 'rgba(16, 185, 129, 0.15)';
    fg = '#10B981';
  } else if (variant === 'admin' || label === 'SuperAdmin') {
    bg = 'rgba(108, 71, 255, 0.18)';
    fg = colors.primary;
  }

  return (
    <View style={[styles.badgeBase, { backgroundColor: bg }, style]}>
      {icon && <View style={{ marginRight: 4 }}>{icon}</View>}
      <Text
        style={[
          styles.badgeText,
          { color: fg, fontWeight: '600' },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

export const StatCard = ({
  icon,
  number,
  label,
  color,
  onPress,
  style,
}) => {
  const { colors } = useContext(ThemeContext);
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={[
        styles.statCardBase,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderTopColor: color || colors.primary,
          borderTopWidth: 3,
        },
        style,
      ]}
    >
      <View style={styles.statTopRow}>
        {typeof icon === 'string' ? (
          <Text style={styles.statIcon}>{icon}</Text>
        ) : (
          <View style={styles.statIconBox}>{icon}</View>
        )}
        <Text
          style={[
            styles.statNumber,
            { color: colors.text },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {number}
        </Text>
      </View>
      <Text
        style={[styles.statLabel, { color: colors.textMuted }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Container>
  );
};

export const EmptyState = ({
  icon = '📂',
  title = 'No Records Found',
  subtitle = 'Try adjusting your search criteria or create a new item.',
  actionTitle,
  onAction,
}) => {
  const { colors } = useContext(ThemeContext);

  return (
    <View style={styles.emptyStateContainer}>
      {typeof icon === 'string' ? (
        <Text style={styles.emptyStateIcon}>{icon}</Text>
      ) : (
        <View style={{ marginBottom: 12 }}>{icon}</View>
      )}
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.emptyStateSubtitle, { color: colors.textMuted }]}>
        {subtitle}
      </Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          style={{ marginTop: 16 }}
        />
      )}
    </View>
  );
};

export const LoadingState = ({ message = 'Loading System Data...' }) => {
  const { colors } = useContext(ThemeContext);

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textMuted }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  responsiveContainerBase: {
    width: '100%',
    alignSelf: 'center',
  },
  btnBase: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconBox: {
    marginRight: 8,
  },
  btnText: {
    letterSpacing: 0.3,
  },
  cardBase: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
      },
    }),
  },
  inputContainer: {
    marginVertical: 8,
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    width: '100%',
  },
  inputField: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
    ...Platform.select({
      web: { outlineStyle: 'none' },
    }),
  },
  inputLeadIconBox: {
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputActionBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputError: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    width: '100%',
  },
  selectText: {
    fontSize: 14,
    flex: 1,
    marginRight: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSelectContent: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 12px 32px rgba(0,0,0,0.28)' },
    }),
  },
  modalSelectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalSelectTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
  },
  modalOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 3,
    borderBottomWidth: 0.5,
  },
  modalOptionText: {
    fontSize: 14,
  },
  badgeBase: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
  },
  statCardBase: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    minWidth: 130,
    flex: 1,
    margin: 6,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 24,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 36,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

