/*
 * Settings screen.
 *
 * Holds preferences, integrations, profile editing, privacy, friend management,
 * and account/data controls. These interactions currently update local state
 * and display feedback. Backend wiring should hydrate this screen from profile,
 * social, logs, integration, and auth APIs.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "../../src/shared/ui/AppHeader";
import BottomNav from "../../src/shared/ui/BottomNav";
import useMobileFrame from "../../src/shared/hooks/useMobileFrame";

// Settings dropdown options are local UI choices until account management APIs exist.
// Keep option labels stable if possible because the render helpers switch on them.
const logManagementOptions = [
  "Delete old logs",
  "Edit logged goals",
  "Export weekly logs",
];

const friendOptions = [
  "Manage friend requests",
  "Remove friend",
  "Refuse friend connection",
];

const initialManagedLogs = [
  // Demo rows for the settings management panels. Replace with logsApi data.
  { id: "log-1", title: "Upper body workout", date: "Today", type: "Workout" },
  { id: "log-2", title: "8,400 steps", date: "Yesterday", type: "Steps" },
  { id: "log-3", title: "Sleep entry", date: "Mon", type: "Sleep" },
];

const initialFriendConnections = [
  // Demo connections for the friend management panels. Replace with socialApi data.
  { id: "friend-1", name: "Maya", username: "@maya.moves", status: "Friend" },
  { id: "friend-2", name: "Rio", username: "@rio.run", status: "Friend" },
  { id: "friend-3", name: "Sam", username: "@sam.strength", status: "Pending" },
];

function SegmentedControl({ label, options, value, onChange }) {
  // Reusable two-option/toggle control used for units, integrations, and privacy.
  return (
    <View style={styles.settingGroup}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.segmentedShell}>
        {options.map((option) => {
          const isSelected = option === value;

          return (
            <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityLabel={`Select ${option}`}
              onPress={() => onChange(option)}
              style={({ pressed }) => [
                styles.segment,
                isSelected && styles.segmentSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  isSelected && styles.segmentTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function DropdownSetting({
  label,
  value,
  isOpen,
  onToggle,
  options,
  onSelect,
  helper,
}) {
  return (
    <View style={styles.settingGroup}>
      <Text style={styles.groupLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${label}`}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.dropdownButton,
          pressed && styles.buttonPressed,
        ]}
      >
        <View style={styles.dropdownCopy}>
          <Text style={styles.dropdownValue}>{value}</Text>
          <Text style={styles.dropdownHelper}>{helper}</Text>
        </View>
        <Ionicons
          name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
          size={18}
          color="#111827"
        />
      </Pressable>

      {isOpen ? (
        <View style={styles.dropdownMenu}>
          {options.map((option) => (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.dropdownMenuItem,
                option === value && styles.dropdownMenuItemSelected,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.dropdownMenuText,
                  option === value && styles.dropdownMenuTextSelected,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    cardWidth,
  } = useMobileFrame();
  const [unitSystem, setUnitSystem] = useState("Metric");
  const [integration, setIntegration] = useState("Apple Health");
  const [logAction, setLogAction] = useState(logManagementOptions[0]);
  const [friendAction, setFriendAction] = useState(friendOptions[0]);
  const [isLogMenuOpen, setIsLogMenuOpen] = useState(false);
  const [isFriendMenuOpen, setIsFriendMenuOpen] = useState(false);
  const [hasProfilePhoto, setHasProfilePhoto] = useState(false);
  const [managedLogs, setManagedLogs] = useState(initialManagedLogs);
  const [friendConnections, setFriendConnections] = useState(
    initialFriendConnections,
  );
  const [profile, setProfile] = useState({
    username: "jhoom.user",
    email: "demo@jhoom.app",
    age: "",
  });
  const [privacy, setPrivacy] = useState("Friends only");
  const [settingsNotice, setSettingsNotice] = useState("");

  function handleSelectLogAction(option) {
    setLogAction(option);
    setIsLogMenuOpen(false);
    setSettingsNotice(`${option} selected. Use the action panel below to continue.`);
  }

  function handleSelectFriendAction(option) {
    setFriendAction(option);
    setIsFriendMenuOpen(false);
    setSettingsNotice(`${option} selected. Friend changes update this screen instantly.`);
  }

  function handleUnitChange(option) {
    setUnitSystem(option);
    setSettingsNotice(
      `Units changed to ${option}. Logged health values will use this preference when backend sync is connected.`,
    );
  }

  function handleIntegrationChange(option) {
    // Selecting an integration does not connect health data yet. Real support
    // should launch the correct permission/OAuth flow, then persist connection status.
    setIntegration(option);
    setSettingsNotice(
      `${option} selected. The real connection flow can plug into this control later.`,
    );
  }

  function handlePrivacyChange(option) {
    setPrivacy(option);
    setSettingsNotice(`Profile visibility changed to ${option}.`);
  }

  function handleProfileChange(field, value) {
    // Profile edits stay local until updateMyProfile is connected.
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleProfilePhotoToggle() {
    setHasProfilePhoto((current) => {
      const nextValue = !current;

      setSettingsNotice(
        nextValue
          ? "Profile photo selected. Upload storage can be connected from this button later."
          : "Profile photo selection removed.",
      );

      return nextValue;
    });
  }

  function handleSaveProfile() {
    const trimmedUsername = profile.username.trim();
    const trimmedEmail = profile.email.trim();
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!trimmedUsername) {
      setSettingsNotice("Please add a username before saving your profile.");
      return;
    }

    if (!hasValidEmail) {
      setSettingsNotice("Please enter a valid email address before saving.");
      return;
    }

    setProfile((current) => ({
      ...current,
      username: trimmedUsername,
      email: trimmedEmail,
    }));
    setSettingsNotice("Profile saved locally. This is ready to connect to your account API.");
  }

  function handleDeleteOldLogs() {
    if (managedLogs.length === 0) {
      setSettingsNotice("There are no saved sample logs left to delete.");
      return;
    }

    setManagedLogs([]);
    setSettingsNotice("Old logs removed from this frontend view.");
  }

  function handleExportWeeklyLogs() {
    setSettingsNotice(
      `Weekly export prepared for ${managedLogs.length} visible log${
        managedLogs.length === 1 ? "" : "s"
      }. Backend file generation can connect here.`,
    );
  }

  function handleAcceptFriend(friendId) {
    setFriendConnections((current) =>
      current.map((friend) =>
        friend.id === friendId ? { ...friend, status: "Friend" } : friend,
      ),
    );
    setSettingsNotice("Friend request accepted.");
  }

  function handleRemoveFriend(friendId) {
    setFriendConnections((current) =>
      current.filter((friend) => friend.id !== friendId),
    );
    setSettingsNotice("Friend connection removed.");
  }

  function renderLogRows() {
    if (managedLogs.length === 0) {
      return <Text style={styles.emptyPanelText}>No logs are currently listed.</Text>;
    }

    return managedLogs.map((log) => (
      <View key={log.id} style={styles.panelRow}>
        <View style={styles.panelRowCopy}>
          <Text style={styles.panelRowTitle}>{log.title}</Text>
          <Text style={styles.panelRowMeta}>
            {log.type} - {log.date}
          </Text>
        </View>
      </View>
    ));
  }

  function renderLogActionPanel() {
    // The selected dropdown action controls which management panel appears.
    // This keeps the UI compact while still giving each option a real action.
    if (logAction === "Edit logged goals") {
      return (
        <View style={styles.actionPanel}>
          <Text style={styles.panelTitle}>Logged goals</Text>
          <Text style={styles.panelText}>
            Goals live on the milestones screen so they stay linked with progress.
          </Text>
          <Pressable
            onPress={() => router.push("/milestones")}
            style={({ pressed }) => [
              styles.panelButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.panelButtonText}>Open milestones</Text>
          </Pressable>
        </View>
      );
    }

    if (logAction === "Export weekly logs") {
      return (
        <View style={styles.actionPanel}>
          <Text style={styles.panelTitle}>Weekly logs</Text>
          <Text style={styles.panelText}>
            Preview the logs that would be included before backend export files are generated.
          </Text>
          {renderLogRows()}
          <Pressable
            onPress={handleExportWeeklyLogs}
            style={({ pressed }) => [
              styles.panelButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.panelButtonText}>Create export</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.actionPanel}>
        <Text style={styles.panelTitle}>Old logs</Text>
        <Text style={styles.panelText}>
          Delete visible sample logs here. Real log deletion should call the logs API.
        </Text>
        {renderLogRows()}
        <Pressable
          onPress={handleDeleteOldLogs}
          style={({ pressed }) => [
            styles.panelButton,
            styles.panelButtonDanger,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={[styles.panelButtonText, styles.panelButtonDangerText]}>
            Delete listed logs
          </Text>
        </Pressable>
      </View>
    );
  }

  function renderFriendRows(filterStatus, actionLabel, onAction) {
    const filteredFriends = friendConnections.filter(
      (friend) => friend.status === filterStatus,
    );

    if (filteredFriends.length === 0) {
      return (
        <Text style={styles.emptyPanelText}>
          No {filterStatus.toLowerCase()} connections right now.
        </Text>
      );
    }

    return filteredFriends.map((friend) => (
      <View key={friend.id} style={styles.panelRow}>
        <View style={styles.panelRowCopy}>
          <Text style={styles.panelRowTitle}>{friend.name}</Text>
          <Text style={styles.panelRowMeta}>{friend.username}</Text>
        </View>
        <Pressable
          onPress={() => onAction(friend.id)}
          style={({ pressed }) => [
            styles.inlinePanelButton,
            actionLabel === "Remove" && styles.inlineDangerButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text
            style={[
              styles.inlinePanelButtonText,
              actionLabel === "Remove" && styles.inlineDangerButtonText,
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      </View>
    ));
  }

  function renderFriendActionPanel() {
    // Friend management mirrors the settings wireframe: one dropdown chooses
    // the action, then the panel below lets the user complete it.
    if (friendAction === "Remove friend") {
      return (
        <View style={styles.actionPanel}>
          <Text style={styles.panelTitle}>Friends</Text>
          <Text style={styles.panelText}>Remove people from your active friend list.</Text>
          {renderFriendRows("Friend", "Remove", handleRemoveFriend)}
        </View>
      );
    }

    if (friendAction === "Refuse friend connection") {
      return (
        <View style={styles.actionPanel}>
          <Text style={styles.panelTitle}>Pending requests</Text>
          <Text style={styles.panelText}>Refuse any incoming requests you do not want.</Text>
          {renderFriendRows("Pending", "Refuse", handleRemoveFriend)}
        </View>
      );
    }

    return (
      <View style={styles.actionPanel}>
        <Text style={styles.panelTitle}>Friend requests</Text>
        <Text style={styles.panelText}>Accept pending requests from this panel.</Text>
        {renderFriendRows("Pending", "Accept", handleAcceptFriend)}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View
          style={[
            styles.outerShell,
            {
              paddingHorizontal: shellPaddingHorizontal,
              paddingVertical: shellPaddingVertical,
            },
          ]}
        >
          <View
            style={[
              styles.inner,
              {
                minHeight: Math.max(shellMinHeight, 840),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader title="SETTINGS." />

            <View style={styles.contentSection}>
              <View style={[styles.settingsCard, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>Preferences</Text>
                    <Text style={styles.sectionTitle}>App settings</Text>
                  </View>
                  <Ionicons name="settings-outline" size={22} color="#4EA955" />
                </View>

                <SegmentedControl
                  label="Units"
                  options={["Imperial", "Metric"]}
                  value={unitSystem}
                  onChange={handleUnitChange}
                />

                <SegmentedControl
                  label="Integrations"
                  options={["Apple Health", "Google Fit"]}
                  value={integration}
                  onChange={handleIntegrationChange}
                />

                <DropdownSetting
                  label="Delete / edit logs"
                  value={logAction}
                  isOpen={isLogMenuOpen}
                  onToggle={() => setIsLogMenuOpen((current) => !current)}
                  options={logManagementOptions}
                  onSelect={handleSelectLogAction}
                  helper="Select old logs or goals to manage"
                />
                {renderLogActionPanel()}

                <DropdownSetting
                  label="Friends"
                  value={friendAction}
                  isOpen={isFriendMenuOpen}
                  onToggle={() => setIsFriendMenuOpen((current) => !current)}
                  options={friendOptions}
                  onSelect={handleSelectFriendAction}
                  helper="Add, delete, or refuse connections"
                />
                {renderFriendActionPanel()}

                {settingsNotice ? (
                  <Text style={styles.statusNotice}>{settingsNotice}</Text>
                ) : null}
              </View>

              <View style={[styles.profileCard, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>Profile</Text>
                    <Text style={styles.sectionTitle}>Account details</Text>
                  </View>
                  <Ionicons name="person-circle-outline" size={22} color="#4EA955" />
                </View>

                <TextInput
                  value={profile.username}
                  onChangeText={(value) => handleProfileChange("username", value)}
                  placeholder="Username"
                  placeholderTextColor="#7A8699"
                  style={styles.profileInput}
                  autoCapitalize="none"
                />

                <TextInput
                  value={profile.email}
                  onChangeText={(value) => handleProfileChange("email", value)}
                  placeholder="Email"
                  placeholderTextColor="#7A8699"
                  style={styles.profileInput}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  value={profile.age}
                  onChangeText={(value) => handleProfileChange("age", value)}
                  placeholder="Age / basic info"
                  placeholderTextColor="#7A8699"
                  style={styles.profileInput}
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change profile photo"
                  onPress={handleProfilePhotoToggle}
                  style={({ pressed }) => [
                    styles.uploadButton,
                    hasProfilePhoto && styles.uploadButtonActive,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Ionicons
                    name={hasProfilePhoto ? "checkmark-circle-outline" : "cloud-upload-outline"}
                    size={24}
                    color={hasProfilePhoto ? "#FFFFFF" : "#4EA955"}
                  />
                </Pressable>

                <Text style={styles.profileActionText}>
                  {hasProfilePhoto ? "Profile photo selected" : "Change profile photo"}
                </Text>
                <Text style={styles.profileHelperText}>
                  Upload will connect to account storage later.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Save profile settings"
                  onPress={handleSaveProfile}
                  style={({ pressed }) => [
                    styles.saveProfileButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.saveProfileText}>Save profile</Text>
                </Pressable>
              </View>

              <View style={[styles.settingsCard, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>Privacy</Text>
                    <Text style={styles.sectionTitle}>Social visibility</Text>
                  </View>
                  <Ionicons name="shield-checkmark-outline" size={22} color="#4EA955" />
                </View>

                <SegmentedControl
                  label="Profile visibility"
                  options={["Friends only", "Private"]}
                  value={privacy}
                  onChange={handlePrivacyChange}
                />
              </View>

              <View style={[styles.settingsCard, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>Data controls</Text>
                    <Text style={styles.sectionTitle}>Account data</Text>
                  </View>
                  <Ionicons name="folder-open-outline" size={22} color="#4EA955" />
                </View>

                <View style={styles.dataActionGrid}>
                  <Pressable
                    onPress={() =>
                      setSettingsNotice(
                        "Data export will be generated when backend storage is connected.",
                      )
                    }
                    style={({ pressed }) => [
                      styles.dataActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.dataActionText}>Export data</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setSettingsNotice(
                        "Account deletion will require confirmation once auth is connected.",
                      )
                    }
                    style={({ pressed }) => [
                      styles.dataActionButton,
                      styles.dangerActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={[styles.dataActionText, styles.dangerActionText]}>
                      Delete account
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => router.replace("/(auth)/login")}
                  style={({ pressed }) => [
                    styles.logoutButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.logoutText}>Log out</Text>
                </Pressable>
              </View>
            </View>

            <BottomNav />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FB",
  },
  scrollContent: {
    flexGrow: 1,
  },
  outerShell: {
    flexGrow: 1,
  },
  inner: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  contentSection: {
    flex: 1,
    alignItems: "center",
    gap: 16,
    paddingBottom: 24,
  },
  settingsCard: {
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    padding: 18,
  },
  profileCard: {
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    padding: 18,
    alignItems: "center",
  },
  profileInput: {
    width: "100%",
    height: 50,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  sectionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectionTitle: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 0.2,
  },
  settingGroup: {
    marginBottom: 18,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  segmentedShell: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    flexDirection: "row",
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  segmentSelected: {
    backgroundColor: "#4EA955",
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
  },
  segmentTextSelected: {
    color: "#FFFFFF",
  },
  dropdownButton: {
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  dropdownCopy: {
    flex: 1,
  },
  dropdownValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  dropdownHelper: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
  },
  dropdownMenu: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    padding: 8,
  },
  dropdownMenuItem: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownMenuItemSelected: {
    backgroundColor: "#DCFCE7",
  },
  dropdownMenuText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  dropdownMenuTextSelected: {
    color: "#4EA955",
  },
  actionPanel: {
    marginTop: -6,
    marginBottom: 18,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    padding: 14,
    gap: 10,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  panelText: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
  },
  panelRow: {
    minHeight: 48,
    borderRadius: 18,
    backgroundColor: "#F7F8FB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  panelRowCopy: {
    flex: 1,
  },
  panelRowTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#111827",
  },
  panelRowMeta: {
    marginTop: 3,
    fontSize: 9,
    lineHeight: 13,
    fontWeight: "700",
    color: "#7A8699",
  },
  emptyPanelText: {
    borderRadius: 18,
    backgroundColor: "#F7F8FB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
  },
  panelButton: {
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  panelButtonDanger: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  panelButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
    textAlign: "center",
  },
  panelButtonDangerText: {
    color: "#991B1B",
  },
  inlinePanelButton: {
    minHeight: 30,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  inlineDangerButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  inlinePanelButtonText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  inlineDangerButtonText: {
    color: "#991B1B",
  },
  statusNotice: {
    marginTop: 2,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "700",
    color: "#5E6B7F",
    textAlign: "center",
  },
  uploadButton: {
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  uploadButtonActive: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  profileActionText: {
    marginTop: 14,
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
    textTransform: "uppercase",
  },
  profileHelperText: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
  },
  saveProfileButton: {
    width: "100%",
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  saveProfileText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  dataActionGrid: {
    flexDirection: "row",
    gap: 10,
  },
  dataActionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  dangerActionButton: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  dataActionText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#4EA955",
    textTransform: "uppercase",
    textAlign: "center",
  },
  dangerActionText: {
    color: "#991B1B",
  },
  logoutButton: {
    minHeight: 42,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
