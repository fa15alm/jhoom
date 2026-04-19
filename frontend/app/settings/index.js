/*
 * Settings screen.
 *
 * Holds preferences, integrations, profile editing, privacy, friend management,
 * and account/data controls.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Platform,
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
import { getMyProfile, updateMyProfile } from "../../src/services/api/profileApi";
import { resolveApiAssetUrl } from "../../src/services/api/client";
import { exportAccountData, deleteAccount as deleteAccountApi } from "../../src/services/api/accountApi";
import { getLogs, deleteLog } from "../../src/services/api/logsApi";
import { uploadProfilePhoto } from "../../src/services/api/uploadApi";
import {
  getConnections,
  removeFriend as removeFriendApi,
  respondToFriendRequest,
} from "../../src/services/api/socialApi";
import {
  clearSession,
  getAuthToken,
  getCurrentUser,
  updateCurrentUser,
} from "../../src/services/authSession";

const SETTINGS_STORAGE_KEY = "jhoom.settings.preferences";

function canUseSettingsStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadStoredPreferences() {
  if (!canUseSettingsStorage()) {
    return {};
  }

  try {
    return JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStoredPreferences(preferences) {
  if (!canUseSettingsStorage()) {
    return;
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(preferences));
}

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
  const storedPreferences = loadStoredPreferences();
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
  const [integration, setIntegration] = useState(storedPreferences.integration || "Apple Health");
  const [logAction, setLogAction] = useState(logManagementOptions[0]);
  const [friendAction, setFriendAction] = useState(friendOptions[0]);
  const [isLogMenuOpen, setIsLogMenuOpen] = useState(false);
  const [isFriendMenuOpen, setIsFriendMenuOpen] = useState(false);
  const [managedLogs, setManagedLogs] = useState([]);
  const [friendConnections, setFriendConnections] = useState([]);
  const [profile, setProfile] = useState({
    username: getCurrentUser()?.username || "jhoom.user",
    email: getCurrentUser()?.email || "",
    fullName: "",
    age: "",
    heightCm: "",
    bio: "",
    profilePictureUrl: "",
  });
  const [privacy, setPrivacy] = useState("Friends only");
  const [settingsNotice, setSettingsNotice] = useState("");
  const [localProfilePhotoPreview, setLocalProfilePhotoPreview] = useState("");
  const [profilePhotoVersion, setProfilePhotoVersion] = useState(Date.now());
  const [profilePhotoLoadFailed, setProfilePhotoLoadFailed] = useState(false);
  const resolvedProfilePhotoUri = resolveApiAssetUrl(profile.profilePictureUrl);
  const isUsingLocalProfilePhotoPreview = Boolean(localProfilePhotoPreview);
  const profilePhotoUri = localProfilePhotoPreview || (resolvedProfilePhotoUri
    ? `${resolvedProfilePhotoUri}${resolvedProfilePhotoUri.includes("?") ? "&" : "?"}v=${profilePhotoVersion}`
    : "");
  const hasProfilePhoto = isUsingLocalProfilePhotoPreview
    || (Boolean(resolvedProfilePhotoUri) && !profilePhotoLoadFailed);

  useEffect(() => {
    setProfilePhotoLoadFailed(false);
    setProfilePhotoVersion(Date.now());
  }, [profile.profilePictureUrl]);

  useEffect(() => {
    function normaliseConnections(connections) {
      return [
        ...(connections.friends || []).map((friend) => ({
          ...friend,
          status: "Friend",
        })),
        ...(connections.pendingIncoming || []).map((friend) => ({
          ...friend,
          status: "Pending",
        })),
      ];
    }

    function normaliseLogs(logs) {
      return logs.slice(0, 10).map((log) => ({
        id: log.id,
        title: log.name,
        date: log.dateKey,
        type: log.typeKey,
      }));
    }

    async function loadProfile() {
      const token = getAuthToken();

      if (!token) {
        return;
      }

      try {
        const apiProfile = await getMyProfile(token);
        setProfile((current) => ({
          ...current,
          username: apiProfile.username || current.username,
          email: apiProfile.email || current.email,
          fullName: apiProfile.full_name || "",
          age: apiProfile.age != null ? String(apiProfile.age) : "",
          heightCm: apiProfile.height_cm != null ? String(apiProfile.height_cm) : "",
          bio: apiProfile.bio || "",
          profilePictureUrl: apiProfile.profile_picture_url || "",
        }));
        setPrivacy(
          apiProfile.is_dob_public || apiProfile.is_age_public || apiProfile.is_height_public || apiProfile.is_weight_public
            ? "Friends only"
            : "Private",
        );
        updateCurrentUser({
          username: apiProfile.username,
          email: apiProfile.email,
          profile_picture_url: apiProfile.profile_picture_url || "",
          profile_picture_preview_url: "",
        });
        setLocalProfilePhotoPreview("");
        setProfilePhotoLoadFailed(false);
      } catch (error) {
        setSettingsNotice(error.message || "Could not load your profile.");
      }
    }

    async function loadFriends() {
      const token = getAuthToken();

      if (!token) {
        return;
      }

      try {
        setFriendConnections(normaliseConnections(await getConnections(token)));
      } catch {
        setFriendConnections([]);
      }
    }

    async function loadManagedLogs() {
      const token = getAuthToken();

      if (!token) {
        return;
      }

      try {
        setManagedLogs(normaliseLogs(await getLogs(token)));
      } catch {
        setManagedLogs([]);
      }
    }

    loadProfile();
    loadFriends();
    loadManagedLogs();
  }, []);

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

  function handleIntegrationChange(option) {
    setIntegration(option);
    saveStoredPreferences({
      ...loadStoredPreferences(),
      integration: option,
    });
    setSettingsNotice(
      `${option} preference saved. Connection permissions still need to be completed separately.`,
    );
  }

  async function handlePrivacyChange(option) {
    setPrivacy(option);
    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before changing profile visibility.");
      return;
    }

    const isVisible = option === "Friends only";

    try {
      await updateMyProfile(token, {
        is_dob_public: isVisible,
        is_age_public: isVisible,
        is_height_public: isVisible,
        is_weight_public: isVisible,
      });
      setSettingsNotice(`Profile visibility saved as ${option}.`);
    } catch (error) {
      setSettingsNotice(error.message || "Could not update profile visibility.");
    }
  }

  function handleProfileChange(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleProfilePhotoToggle() {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      setSettingsNotice("Profile photo upload is available in the web app.");
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before changing your profile photo.");
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];

      if (!file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setSettingsNotice("Choose an image file for your profile photo.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          setLocalProfilePhotoPreview(reader.result);
          setProfilePhotoLoadFailed(false);
          updateCurrentUser({
            profile_picture_preview_url: reader.result,
          });
          const uploadedPhoto = await uploadProfilePhoto(token, {
            dataUrl: reader.result,
            filename: file.name,
          });
          const response = await updateMyProfile(token, {
            profile_picture_url: uploadedPhoto.url,
          });
          setProfile((current) => ({
            ...current,
            profilePictureUrl:
              response.profile?.profile_picture_url || uploadedPhoto.url,
          }));
          setProfilePhotoLoadFailed(false);
          setProfilePhotoVersion(Date.now());
          updateCurrentUser({
            profile_picture_url:
              response.profile?.profile_picture_url || uploadedPhoto.url,
            profile_picture_preview_url: reader.result,
          });
          setSettingsNotice("Profile photo updated.");
        } catch (error) {
          setLocalProfilePhotoPreview("");
          updateCurrentUser({
            profile_picture_preview_url: "",
          });
          setSettingsNotice(error.message || "Could not upload profile photo.");
        }
      };
      reader.onerror = () => setSettingsNotice("Could not read that image.");
      reader.readAsDataURL(file);
    };

    input.click();
  }

  async function handleSaveProfile() {
    const trimmedUsername = profile.username.trim();
    const trimmedEmail = profile.email.trim();
    const trimmedFullName = profile.fullName.trim();
    const trimmedBio = profile.bio.trim();
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    if (!trimmedUsername) {
      setSettingsNotice("Please add a username before saving your profile.");
      return;
    }

    if (!hasValidEmail) {
      setSettingsNotice("Please enter a valid email address before saving.");
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before saving your profile.");
      return;
    }

    try {
      const response = await updateMyProfile(token, {
        username: trimmedUsername,
        email: trimmedEmail.toLowerCase(),
        full_name: trimmedFullName || null,
        age: profile.age ? Number(profile.age) : null,
        height_cm: profile.heightCm ? Number(profile.heightCm) : null,
        bio: trimmedBio || null,
        profile_picture_url: profile.profilePictureUrl || null,
        is_dob_public: privacy === "Friends only",
        is_age_public: privacy === "Friends only",
        is_height_public: privacy === "Friends only",
        is_weight_public: privacy === "Friends only",
      });

      setProfile((current) => ({
        ...current,
        username: response.profile?.username || trimmedUsername,
        email: response.profile?.email || trimmedEmail.toLowerCase(),
        fullName: response.profile?.full_name || trimmedFullName,
        age: response.profile?.age != null ? String(response.profile.age) : "",
        heightCm: response.profile?.height_cm != null ? String(response.profile.height_cm) : "",
        bio: response.profile?.bio || trimmedBio,
        profilePictureUrl:
          response.profile?.profile_picture_url || current.profilePictureUrl,
      }));
      updateCurrentUser({
        username: response.profile?.username || trimmedUsername,
        email: response.profile?.email || trimmedEmail.toLowerCase(),
        profile_picture_url:
          response.profile?.profile_picture_url || profile.profilePictureUrl || "",
        profile_picture_preview_url: localProfilePhotoPreview || "",
      });
      setSettingsNotice("Profile saved.");
    } catch (error) {
      setSettingsNotice(error.message || "Could not save your profile.");
    }
  }

  async function handleDeleteOldLogs() {
    if (managedLogs.length === 0) {
      setSettingsNotice("There are no saved logs listed right now.");
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before deleting logs.");
      return;
    }

    try {
      await Promise.all(managedLogs.map((log) => deleteLog(token, log.id)));
      setManagedLogs([]);
      setSettingsNotice("Listed logs deleted.");
    } catch (error) {
      setSettingsNotice(error.message || "Could not delete listed logs.");
    }
  }

  async function handleExportWeeklyLogs() {
    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before exporting logs.");
      return;
    }

    try {
      const exportData = await exportAccountData(token);
      const logCount = exportData.logs?.length || 0;
      setSettingsNotice(`Export contains ${logCount} saved log${logCount === 1 ? "" : "s"}.`);
    } catch (error) {
      setSettingsNotice(error.message || "Could not export logs.");
    }
  }

  async function handleAcceptFriend(friendId) {
    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before accepting friend requests.");
      return;
    }

    try {
      await respondToFriendRequest(token, friendId, "accept");
      setFriendConnections((current) =>
        current.map((friend) =>
          friend.id === friendId ? { ...friend, status: "Friend" } : friend,
        ),
      );
      setSettingsNotice("Friend request accepted.");
    } catch (error) {
      setSettingsNotice(error.message || "Could not accept friend request.");
    }
  }

  async function handleRemoveFriend(friendId) {
    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before changing friends.");
      return;
    }

    try {
      await removeFriendApi(token, friendId);
      setFriendConnections((current) =>
        current.filter((friend) => friend.id !== friendId),
      );
      setSettingsNotice("Friend connection removed.");
    } catch (error) {
      setSettingsNotice(error.message || "Could not update friend connection.");
    }
  }

  async function handleExportAccountData() {
    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before exporting your data.");
      return;
    }

    try {
      const exportData = await exportAccountData(token);

      if (Platform.OS === "web" && typeof document !== "undefined") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `jhoom-data-${new Date().toISOString().slice(0, 10)}.json`;
        anchor.click();
        URL.revokeObjectURL(url);
      }

      setSettingsNotice("Account data export ready.");
    } catch (error) {
      setSettingsNotice(error.message || "Could not export account data.");
    }
  }

  async function handleDeleteAccount() {
    const token = getAuthToken();

    if (!token) {
      setSettingsNotice("Log in again before deleting your account.");
      return;
    }

    if (Platform.OS !== "web" || typeof window === "undefined") {
      setSettingsNotice("Account deletion confirmation is available in the web app.");
      return;
    }

    const password = window.prompt("Enter your password to permanently delete your Jhoom account.");

    if (!password) {
      return;
    }

    try {
      await deleteAccountApi(token, password);
      clearSession();
      router.replace("/(auth)/login");
    } catch (error) {
      setSettingsNotice(error.message || "Could not delete account.");
    }
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
          Delete the listed saved logs here. Full saved-data export uses the backend.
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

                <View style={styles.settingGroup}>
                  <Text style={styles.groupLabel}>Units</Text>
                  <View style={styles.infoPanel}>
                    <Text style={styles.infoPanelTitle}>Metric only</Text>
                    <Text style={styles.infoPanelText}>
                      Jhoom uses cm, kg, km, min, kcal, g, hours, and steps across the app.
                    </Text>
                  </View>
                </View>

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

                <View style={styles.profilePhotoSection}>
                  <View style={styles.profilePhotoFrame}>
                    {hasProfilePhoto ? (
                      isUsingLocalProfilePhotoPreview ? (
                        <Image
                          source={{ uri: profilePhotoUri }}
                          style={styles.profilePhotoImage}
                        />
                      ) : (
                        <Image
                          source={{ uri: profilePhotoUri }}
                          style={styles.profilePhotoImage}
                          onError={() => {
                            setProfilePhotoLoadFailed(true);
                            setSettingsNotice("Profile photo uploaded, but the preview could not be loaded.");
                          }}
                        />
                      )
                    ) : (
                      <View style={styles.profilePhotoPlaceholder}>
                        <Ionicons name="person-outline" size={32} color="#83B66E" />
                      </View>
                    )}
                  </View>
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
                  value={profile.fullName}
                  onChangeText={(value) => handleProfileChange("fullName", value)}
                  placeholder="Full name"
                  placeholderTextColor="#7A8699"
                  style={styles.profileInput}
                />

                <TextInput
                  value={profile.age}
                  onChangeText={(value) => handleProfileChange("age", value)}
                  placeholder="Age (years)"
                  placeholderTextColor="#7A8699"
                  style={styles.profileInput}
                  keyboardType="number-pad"
                />

                <TextInput
                  value={profile.heightCm}
                  onChangeText={(value) => handleProfileChange("heightCm", value)}
                  placeholder="Height (cm)"
                  placeholderTextColor="#7A8699"
                  style={styles.profileInput}
                  keyboardType="decimal-pad"
                />

                <TextInput
                  value={profile.bio}
                  onChangeText={(value) => handleProfileChange("bio", value)}
                  placeholder="Bio"
                  placeholderTextColor="#7A8699"
                  style={[styles.profileInput, styles.profileTextarea]}
                  multiline
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
                  {hasProfilePhoto ? "Change profile photo" : "Upload profile photo"}
                </Text>
                <Text style={styles.profileHelperText}>
                  JPG, PNG, WebP, or GIF. Saved to account storage.
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
                <Text style={styles.privacyHelperText}>
                  This controls whether age, height, weight, and date of birth are visible on your profile.
                </Text>
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
                    onPress={handleExportAccountData}
                    style={({ pressed }) => [
                      styles.dataActionButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.dataActionText}>Export data</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleDeleteAccount}
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
                  onPress={() => {
                    clearSession();
                    router.replace("/(auth)/login");
                  }}
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
  infoPanel: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoPanelTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  infoPanelText: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
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
  profilePhotoSection: {
    width: "100%",
    alignItems: "center",
    marginBottom: 14,
  },
  profilePhotoFrame: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePhotoImage: {
    width: "100%",
    height: "100%",
  },
  profilePhotoPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4FFF7",
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
  profileTextarea: {
    minHeight: 92,
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 14,
    textAlignVertical: "top",
  },
  saveProfileText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  privacyHelperText: {
    marginTop: -4,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
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
