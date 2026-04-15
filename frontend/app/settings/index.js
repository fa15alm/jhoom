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
import AppHeader from "../../components/ui/AppHeader";
import BottomNav from "../../components/ui/BottomNav";
import useMobileFrame from "../../hooks/useMobileFrame";

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
  const [profile, setProfile] = useState({
    username: "jhoom.user",
    email: "demo@jhoom.app",
    age: "",
  });
  const [privacy, setPrivacy] = useState("Friends only");
  const [dataNotice, setDataNotice] = useState("");

  function handleSelectLogAction(option) {
    setLogAction(option);
    setIsLogMenuOpen(false);
  }

  function handleSelectFriendAction(option) {
    setFriendAction(option);
    setIsFriendMenuOpen(false);
  }

  function handleProfileChange(field, value) {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }));
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
                  onChange={setUnitSystem}
                />

                <SegmentedControl
                  label="Integrations"
                  options={["Apple Health", "Google Fit"]}
                  value={integration}
                  onChange={setIntegration}
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

                <DropdownSetting
                  label="Friends"
                  value={friendAction}
                  isOpen={isFriendMenuOpen}
                  onToggle={() => setIsFriendMenuOpen((current) => !current)}
                  options={friendOptions}
                  onSelect={handleSelectFriendAction}
                  helper="Add, delete, or refuse connections"
                />
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
                  onPress={() => setHasProfilePhoto((current) => !current)}
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
                  onChange={setPrivacy}
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
                      setDataNotice("Data export will be generated when backend storage is connected.")
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
                      setDataNotice("Account deletion will require confirmation once auth is connected.")
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

                {dataNotice ? (
                  <Text style={styles.dataNotice}>{dataNotice}</Text>
                ) : null}

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
  dataNotice: {
    marginTop: 12,
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
