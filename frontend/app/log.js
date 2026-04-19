/*
 * Log screen.
 *
 * Lets users create, edit, delete, and review daily health logs. The form is
 * driven by `LOG_TYPES`, so adding a new metric type mostly means adding a new
 * definition below.
 */
import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AppHeader from "../src/shared/ui/AppHeader";
import BottomNav from "../src/shared/ui/BottomNav";
import useMobileFrame from "../src/shared/hooks/useMobileFrame";
import {
  createLog,
  deleteLog,
  getLogs,
  updateLog,
} from "../src/services/api/logsApi";
import { getAuthToken } from "../src/services/authSession";

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Log type definitions drive the selector and the dynamic input fields below it.
// Each type declares the fields that should appear in the editor card.
const LOG_TYPES = [
  {
    key: "workout",
    label: "Workout",
    namePlaceholder: "Log name",
    fields: [
      { key: "sets", label: "Sets", placeholder: "Sets...", keyboardType: "number-pad" },
      { key: "reps", label: "Reps", placeholder: "Reps...", keyboardType: "number-pad" },
      { key: "weight", label: "Weight (kg)", placeholder: "Weight in kg...", keyboardType: "decimal-pad", unit: "kg" },
    ],
  },
  {
    key: "cardio",
    label: "Cardio session",
    namePlaceholder: "Log name",
    fields: [
      { key: "duration", label: "Duration (min)", placeholder: "Duration in minutes...", keyboardType: "number-pad", unit: "min" },
      { key: "distance", label: "Distance (km)", placeholder: "Distance in km...", keyboardType: "decimal-pad", unit: "km" },
      { key: "calories", label: "Calories (kcal)", placeholder: "Calories in kcal...", keyboardType: "number-pad", unit: "kcal" },
    ],
  },
  {
    key: "nutrition",
    label: "Nutrition",
    namePlaceholder: "Log name",
    fields: [
      { key: "calories", label: "Calories (kcal)", placeholder: "Calories in kcal...", keyboardType: "number-pad", unit: "kcal" },
      { key: "protein", label: "Protein (g)", placeholder: "Protein in g...", keyboardType: "decimal-pad", unit: "g" },
      { key: "carbs", label: "Carbs (g)", placeholder: "Carbs in g...", keyboardType: "decimal-pad", unit: "g" },
    ],
  },
  {
    key: "caloriesBurned",
    label: "Calories burned",
    namePlaceholder: "Log name",
    fields: [
      { key: "calories", label: "Calories burned (kcal)", placeholder: "Calories burned in kcal...", keyboardType: "number-pad", unit: "kcal" },
      { key: "source", label: "Source", placeholder: "Source eg workout, walk...", keyboardType: "default" },
      { key: "duration", label: "Duration (min)", placeholder: "Duration in minutes...", keyboardType: "number-pad", unit: "min" },
    ],
  },
  {
    key: "sleep",
    label: "Sleep",
    namePlaceholder: "Log name",
    fields: [
      { key: "hours", label: "Sleep duration", placeholder: "", keyboardType: "decimal-pad", unit: "h", computed: true },
      { key: "bedtime", label: "Bedtime (24h)", placeholder: "Bedtime eg 23:00...", keyboardType: "numbers-and-punctuation" },
      { key: "wakeTime", label: "Wake time (24h)", placeholder: "Wake time eg 07:00...", keyboardType: "numbers-and-punctuation" },
    ],
  },
  {
    key: "steps",
    label: "Steps",
    namePlaceholder: "Log name",
    fields: [
      { key: "steps", label: "Steps", placeholder: "Steps...", keyboardType: "number-pad" },
      { key: "distance", label: "Distance (km)", placeholder: "Distance in km...", keyboardType: "decimal-pad", unit: "km" },
      { key: "activeMinutes", label: "Active minutes (min)", placeholder: "Active minutes...", keyboardType: "number-pad", unit: "min" },
    ],
  },
  {
    key: "weight",
    label: "Weight check-in",
    namePlaceholder: "Log name",
    fields: [
      { key: "weight", label: "Weight (kg)", placeholder: "Weight in kg...", keyboardType: "decimal-pad", unit: "kg" },
    ],
  },
];

function getTodayKey() {
  return formatDateKey(new Date());
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTodayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function getRelativeDateKey(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return formatDateKey(date);
}

function getMonthKey(dateKey) {
  return dateKey.slice(0, 7);
}

function shiftDateKey(dateKey, offsetDays) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offsetDays);
  return formatDateKey(date);
}

function getWeekStartDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - daysSinceMonday);
  return formatDateKey(date);
}

function getWeekDateOptions(dateKey) {
  const weekStartDateKey = getWeekStartDateKey(dateKey);

  return WEEK_DAYS.map((dayLabel, index) => {
    const nextDateKey = shiftDateKey(weekStartDateKey, index);
    return {
      dayLabel,
      dateKey: nextDateKey,
      shortLabel: formatLogDateLabel(nextDateKey),
    };
  });
}

function formatWeekRangeLabel(dateKey) {
  const weekDateOptions = getWeekDateOptions(dateKey);
  const firstDateKey = weekDateOptions[0].dateKey;
  const lastDateKey = weekDateOptions[weekDateOptions.length - 1].dateKey;
  const [firstYear, firstMonth, firstDay] = firstDateKey.split("-").map(Number);
  const [lastYear, lastMonth, lastDay] = lastDateKey.split("-").map(Number);
  const firstDate = new Date(firstYear, firstMonth - 1, firstDay);
  const lastDate = new Date(lastYear, lastMonth - 1, lastDay);

  return `${firstDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })} - ${lastDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  })}`;
}

function shiftMonthKey(monthKey, offset) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);

  return getMonthKey(formatDateKey(date));
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function buildCalendarCells(monthKey) {
  // Adds leading blanks so dates align correctly under a Monday-first calendar.
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < firstWeekday; index += 1) {
    cells.push({ id: `empty-${monthKey}-${index}`, isPlaceholder: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = `${monthKey}-${`${day}`.padStart(2, "0")}`;

    cells.push({
      id: dateKey,
      day,
      dateKey,
      isPlaceholder: false,
    });
  }

  return cells;
}

function formatLogDateLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const todayKey = getTodayKey();
  const yesterdayKey = getRelativeDateKey(1);

  if (dateKey === todayKey) {
    return "Today";
  }

  if (dateKey === yesterdayKey) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function parseTimeToMinutes(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value || "").trim());

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function calculateSleepHours(bedtime, wakeTime) {
  const bedtimeMinutes = parseTimeToMinutes(bedtime);
  const wakeTimeMinutes = parseTimeToMinutes(wakeTime);

  if (bedtimeMinutes == null || wakeTimeMinutes == null) {
    return null;
  }

  let durationMinutes = wakeTimeMinutes - bedtimeMinutes;

  if (durationMinutes <= 0) {
    durationMinutes += 24 * 60;
  }

  return Number((durationMinutes / 60).toFixed(1));
}

function getLogType(typeKey) {
  return LOG_TYPES.find((item) => item.key === typeKey) ?? LOG_TYPES[0];
}

function createEmptyDraft(typeKey) {
  // A draft mirrors the selected log type so the same editor can handle
  // workouts, sleep, nutrition, steps, and calories burned without branching UI.
  const logType = getLogType(typeKey);

  return {
    name: "",
    values: Object.fromEntries(logType.fields.map((field) => [field.key, ""])),
  };
}

function formatHistoryValue(field, value) {
  if (!value) {
    return "Not set";
  }

  const stringValue = String(value).trim();

  if (!field.unit || stringValue.toLowerCase().includes(field.unit.toLowerCase())) {
    return stringValue;
  }

  return `${stringValue} ${field.unit}`;
}

function SaveButton({ label, onPress, disabled = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.saveButton,
        disabled && styles.saveButtonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.saveText, disabled && styles.saveTextDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function LogScreen() {
  const params = useLocalSearchParams();
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    cardWidth,
  } = useMobileFrame();
  const todayKey = getTodayKey();
  const [selectedTypeKey, setSelectedTypeKey] = useState(LOG_TYPES[0].key);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedHistoryDateKey, setSelectedHistoryDateKey] = useState(todayKey);
  const [selectedLogDateKey, setSelectedLogDateKey] = useState(todayKey);
  const [isLogCalendarOpen, setIsLogCalendarOpen] = useState(false);
  const [logCalendarMonthKey, setLogCalendarMonthKey] = useState(getMonthKey(todayKey));
  const [logs, setLogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(() => createEmptyDraft(LOG_TYPES[0].key));
  const [saveError, setSaveError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);

  const activeType = getLogType(selectedTypeKey);
  const calculatedSleepHours = selectedTypeKey === "sleep"
    ? calculateSleepHours(draft.values.bedtime, draft.values.wakeTime)
    : null;
  const selectedHistoryLogs = logs.filter(
    (entry) => entry.dateKey === selectedHistoryDateKey,
  );
  const currentWeekDateOptions = getWeekDateOptions(selectedHistoryDateKey);
  const currentWeekDateKeys = new Set(currentWeekDateOptions.map((entry) => entry.dateKey));
  const currentWeekLogs = logs.filter((entry) => currentWeekDateKeys.has(entry.dateKey));
  const loggedDateKeys = new Set(logs.map((entry) => entry.dateKey));
  const logCalendarCells = buildCalendarCells(logCalendarMonthKey);
  const hasDraftContent =
    draft.name.trim().length > 0 ||
    Object.values(draft.values).some((value) => value.trim().length > 0);

  useEffect(() => {
    const requestedType = Array.isArray(params.type) ? params.type[0] : params.type;

    if (!requestedType || !LOG_TYPES.some((type) => type.key === requestedType)) {
      return;
    }

    setSelectedTypeKey(requestedType);
    setDraft(createEmptyDraft(requestedType));
    setEditingId(null);
    setIsMenuOpen(false);
    setSaveError("");
  }, [params.type]);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    const token = getAuthToken();

    if (!token) {
      setSaveError("Log in to sync your health logs.");
      return;
    }

    try {
      setIsLoadingLogs(true);
      setLogs(await getLogs(token));
      setSaveError("");
    } catch (error) {
      setSaveError(error.message || "Could not load saved logs.");
    } finally {
      setIsLoadingLogs(false);
    }
  }

  function handleSelectType(typeKey) {
    // Changing type resets edit mode because each log type owns a different field set.
    setSelectedTypeKey(typeKey);
    setDraft(createEmptyDraft(typeKey));
    setEditingId(null);
    setIsMenuOpen(false);
    setSaveError("");
  }

  function handleChange(field, value) {
    setSaveError("");

    if (field === "name") {
      setDraft((current) => ({
        ...current,
        name: value,
      }));
      return;
    }

    setDraft((current) => ({
      ...current,
      values: {
        ...current.values,
        [field]: value,
      },
    }));
  }

  function handleResetDraft() {
    setDraft(createEmptyDraft(selectedTypeKey));
    setEditingId(null);
    setSelectedLogDateKey(todayKey);
    setLogCalendarMonthKey(getMonthKey(todayKey));
    setSaveError("");
  }

  async function handleSave() {
    // Prevent blank logs by requiring a name and at least one filled metric value.
    // Backend validation should repeat this rule to protect the database too.
    const hasLogName = draft.name.trim().length > 0;
    const hasMetricValue = Object.values(draft.values).some(
      (value) => String(value || "").trim().length > 0,
    );

    if (!hasLogName || !hasMetricValue) {
      setSaveError("Add a log name and at least one metric before saving.");
      return;
    }

    if (selectedTypeKey === "sleep" && calculatedSleepHours == null) {
      setSaveError("Enter bedtime and wake time in 24h format like 23:00 and 07:00.");
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setSaveError("Log in again before saving logs.");
      return;
    }

    const nextLog = {
      dateKey: selectedLogDateKey,
      typeKey: selectedTypeKey,
      name: draft.name.trim(),
      values: selectedTypeKey === "sleep"
        ? {
            ...draft.values,
            hours: calculatedSleepHours,
          }
        : draft.values,
    };

    try {
      setIsSavingLog(true);
      const savedLog = editingId
        ? await updateLog(token, editingId, nextLog)
        : await createLog(token, nextLog);

      setLogs((current) => {
        if (editingId) {
          return current.map((entry) => (entry.id === editingId ? savedLog : entry));
        }

        return [savedLog, ...current];
      });

      setDraft(createEmptyDraft(selectedTypeKey));
      setEditingId(null);
      setSaveError("");
    } catch (error) {
      setSaveError(error.message || "Could not save this log.");
    } finally {
      setIsSavingLog(false);
    }
  }

  function handleEdit(entry) {
    // Editing restores the selected type, log date, and field values into the form.
    setSelectedTypeKey(entry.typeKey);
    setDraft({
      name: entry.name,
      values: entry.values,
    });
    setEditingId(entry.id);
    setSelectedLogDateKey(entry.dateKey);
    setLogCalendarMonthKey(getMonthKey(entry.dateKey));
    setIsMenuOpen(false);
    setSaveError("");
  }

  function requestDelete(id) {
    setPendingDeleteId(id);
  }

  async function handleDelete(id) {
    const token = getAuthToken();

    if (!token) {
      setSaveError("Log in again before deleting logs.");
      return;
    }

    try {
      await deleteLog(token, id);
      setLogs((current) => current.filter((entry) => entry.id !== id));
      setPendingDeleteId(null);

      if (editingId === id) {
        setEditingId(null);
        setDraft(createEmptyDraft(selectedTypeKey));
      }
    } catch (error) {
      setSaveError(error.message || "Could not delete this log.");
    }
  }

  function handleSelectLogDate(dateKey) {
    // This date picker controls the date used for newly saved or edited logs.
    setSelectedLogDateKey(dateKey);
    setLogCalendarMonthKey(getMonthKey(dateKey));
    setIsLogCalendarOpen(false);
  }

  function handleSelectHistoryDate(dateKey) {
    setSelectedHistoryDateKey(dateKey);
  }

  function handleShiftHistoryWeek(offsetWeeks) {
    setSelectedHistoryDateKey((current) => shiftDateKey(current, offsetWeeks * 7));
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
                minHeight: Math.max(shellMinHeight, 920),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            <AppHeader title="ADD TO YOUR LOG" />

            <View style={styles.contentSection}>
              <View style={[styles.dateChip, { width: cardWidth }]}>
                <Ionicons name="calendar-outline" size={14} color="#4EA955" />
                <Text style={styles.dateChipText}>Today • {formatTodayLabel()}</Text>
              </View>

              <View style={[styles.selectorSection, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>Log type</Text>
                    <Text style={styles.sectionTitle}>Choose a log type</Text>
                  </View>
                  <Ionicons name="options-outline" size={22} color="#4EA955" />
                </View>

                <Pressable
                  onPress={() => setIsMenuOpen((current) => !current)}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View style={styles.selectorCopy}>
                    <Text style={styles.selectorValue}>{activeType.label}</Text>
                    <Text style={styles.selectorHint}>
                      Fields below change for each log type and old logs stay editable.
                    </Text>
                  </View>
                  <Ionicons
                    name={isMenuOpen ? "chevron-up-outline" : "chevron-down-outline"}
                    size={18}
                    color="#111827"
                  />
                </Pressable>

                {isMenuOpen ? (
                  <View style={styles.menuCard}>
                    {LOG_TYPES.map((type) => {
                      const isSelected = type.key === selectedTypeKey;

                      return (
                        <Pressable
                          key={type.key}
                          onPress={() => handleSelectType(type.key)}
                          style={[
                            styles.menuItem,
                            isSelected && styles.menuItemSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.menuItemText,
                              isSelected && styles.menuItemTextSelected,
                            ]}
                          >
                            {type.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <View style={[styles.editorCard, { width: cardWidth }]}>
                <View style={styles.editorHeader}>
                  <View style={styles.editorCopy}>
                    <Text style={styles.editorTitle}>LOG</Text>
                    <Text style={styles.editorMeta}>
                      {editingId ? "Editing saved log" : activeType.label}
                    </Text>
                  </View>

                  <View style={styles.editorActions}>
                    <Pressable
                      onPress={handleResetDraft}
                      style={({ pressed }) => [
                        styles.iconAction,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Ionicons name="refresh-outline" size={18} color="#4EA955" />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        if (editingId) {
                          requestDelete(editingId);
                        } else {
                          handleResetDraft();
                        }
                      }}
                      style={({ pressed }) => [
                        styles.iconAction,
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Ionicons name="trash-outline" size={18} color="#4EA955" />
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  onPress={() => setIsLogCalendarOpen((current) => !current)}
                  style={({ pressed }) => [
                    styles.historyDateButton,
                    styles.logDateButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <View>
                    <Text style={styles.historyDateLabel}>Log date</Text>
                    <Text style={styles.historyDateValue}>
                      {formatLogDateLabel(selectedLogDateKey)}
                    </Text>
                  </View>
                  <Ionicons
                    name={isLogCalendarOpen ? "chevron-up-outline" : "chevron-down-outline"}
                    size={18}
                    color="#111827"
                  />
                </Pressable>

                {isLogCalendarOpen ? (
                  <View style={styles.calendarMenu}>
                    <View style={styles.calendarHeader}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Previous month"
                        onPress={() =>
                          setLogCalendarMonthKey((current) =>
                            shiftMonthKey(current, -1),
                          )
                        }
                        style={({ pressed }) => [
                          styles.calendarNavButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Ionicons name="chevron-back-outline" size={18} color="#4EA955" />
                      </Pressable>

                      <Text style={styles.calendarMonthText}>
                        {formatMonthLabel(logCalendarMonthKey)}
                      </Text>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Next month"
                        onPress={() =>
                          setLogCalendarMonthKey((current) =>
                            shiftMonthKey(current, 1),
                          )
                        }
                        style={({ pressed }) => [
                          styles.calendarNavButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Ionicons name="chevron-forward-outline" size={18} color="#4EA955" />
                      </Pressable>
                    </View>

                    <View style={styles.calendarWeekdayRow}>
                      {WEEK_DAYS.map((day) => (
                        <Text key={day} style={styles.calendarWeekdayText}>
                          {day}
                        </Text>
                      ))}
                    </View>

                    <View style={styles.calendarGrid}>
                      {logCalendarCells.map((cell) => {
                        if (cell.isPlaceholder) {
                          return (
                            <View
                              key={cell.id}
                              style={styles.calendarCellPlaceholder}
                            />
                          );
                        }

                        const isSelected = selectedLogDateKey === cell.dateKey;
                        const hasLogs = loggedDateKeys.has(cell.dateKey);

                        return (
                          <Pressable
                            key={cell.id}
                            accessibilityRole="button"
                            accessibilityLabel={`Select ${cell.dateKey}`}
                            onPress={() => handleSelectLogDate(cell.dateKey)}
                            style={({ pressed }) => [
                              styles.calendarDay,
                              hasLogs && styles.calendarDayWithLogs,
                              isSelected && styles.calendarDaySelected,
                              pressed && styles.buttonPressed,
                            ]}
                          >
                            <Text
                              style={[
                                styles.calendarDayText,
                                isSelected && styles.calendarDayTextSelected,
                              ]}
                            >
                              {cell.day}
                            </Text>
                            {hasLogs ? <View style={styles.calendarLogDot} /> : null}
                          </Pressable>
                        );
                      })}
                    </View>

                    <Text style={styles.calendarHelperText}>
                      Green dots show days with saved logs.
                    </Text>
                  </View>
                ) : null}

                <TextInput
                  value={draft.name}
                  onChangeText={(value) => handleChange("name", value)}
                  placeholder={activeType.namePlaceholder}
                  placeholderTextColor="#7A8699"
                  style={styles.logInput}
                />

                {activeType.fields
                  .filter((field) => !field.computed)
                  .map((field) => (
                    <TextInput
                      key={field.key}
                      value={draft.values[field.key]}
                      onChangeText={(value) => handleChange(field.key, value)}
                      placeholder={field.placeholder}
                      placeholderTextColor="#7A8699"
                      keyboardType={field.keyboardType}
                      style={styles.logInput}
                    />
                  ))}

                {selectedTypeKey === "sleep" ? (
                  <View style={styles.computedMetricCard}>
                    <Text style={styles.computedMetricLabel}>Calculated sleep duration</Text>
                    <Text style={styles.computedMetricValue}>
                      {calculatedSleepHours == null ? "Enter bedtime and wake time" : `${calculatedSleepHours} h`}
                    </Text>
                  </View>
                ) : null}

                {saveError ? (
                  <Text accessibilityRole="alert" style={styles.saveErrorText}>
                    {saveError}
                  </Text>
                ) : null}

                {pendingDeleteId === editingId && editingId ? (
                  <View style={styles.confirmDeleteCard}>
                    <Text style={styles.confirmDeleteText}>
                      Delete this log? This cannot be undone.
                    </Text>
                    <View style={styles.confirmDeleteActions}>
                      <Pressable
                        onPress={() => setPendingDeleteId(null)}
                        style={({ pressed }) => [
                          styles.cancelDeleteButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.cancelDeleteText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleDelete(editingId)}
                        style={({ pressed }) => [
                          styles.confirmDeleteButton,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>

              <SaveButton
                label={isSavingLog ? "Saving..." : editingId ? "Update log" : "Save log"}
                disabled={!hasDraftContent || isSavingLog}
                onPress={handleSave}
              />

              <View style={[styles.historySection, { width: cardWidth }]}>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.eyebrow}>History</Text>
                    <Text style={styles.sectionTitle}>Week view</Text>
                  </View>
                  <Text style={styles.historyCount}>
                    {currentWeekLogs.length} entries
                  </Text>
                </View>

                <View style={styles.weekNavRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous week"
                    onPress={() => handleShiftHistoryWeek(-1)}
                    style={({ pressed }) => [
                      styles.calendarNavButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Ionicons name="chevron-back-outline" size={18} color="#4EA955" />
                  </Pressable>

                  <View style={styles.weekNavCopy}>
                    <Text style={styles.historyDateLabel}>Selected week</Text>
                    <Text style={styles.historyDateValue}>
                      {formatWeekRangeLabel(selectedHistoryDateKey)}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next week"
                    onPress={() => handleShiftHistoryWeek(1)}
                    style={({ pressed }) => [
                      styles.calendarNavButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Ionicons name="chevron-forward-outline" size={18} color="#4EA955" />
                  </Pressable>
                </View>

                <View style={styles.weekDaySelectorRow}>
                  {currentWeekDateOptions.map((dayOption) => {
                    const isSelected = selectedHistoryDateKey === dayOption.dateKey;
                    const hasLogs = loggedDateKeys.has(dayOption.dateKey);

                    return (
                      <Pressable
                        key={dayOption.dateKey}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${dayOption.shortLabel}`}
                        onPress={() => handleSelectHistoryDate(dayOption.dateKey)}
                        style={({ pressed }) => [
                          styles.weekDayButton,
                          hasLogs && styles.weekDayButtonWithLogs,
                          isSelected && styles.weekDayButtonSelected,
                          pressed && styles.buttonPressed,
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekDayLabel,
                            isSelected && styles.weekDayLabelSelected,
                          ]}
                        >
                          {dayOption.dayLabel}
                        </Text>
                        <Text
                          style={[
                            styles.weekDayValue,
                            isSelected && styles.weekDayValueSelected,
                          ]}
                        >
                          {dayOption.dateKey.slice(-2)}
                        </Text>
                        {hasLogs ? (
                          <View
                            style={[
                              styles.weekDayDot,
                              isSelected && styles.weekDayDotSelected,
                            ]}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>

                {selectedHistoryLogs.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No logs yet</Text>
                    <Text style={styles.emptyText}>
                      {isLoadingLogs
                        ? "Loading your saved logs..."
                        : `No logs have been added for ${formatLogDateLabel(selectedHistoryDateKey)}.`}
                    </Text>
                  </View>
                ) : (
                  selectedHistoryLogs.map((entry) => {
                    const type = getLogType(entry.typeKey);

                    return (
                      <View key={entry.id} style={styles.historyCard}>
                        <View style={styles.historyCardHeader}>
                          <View style={styles.historyCopy}>
                            <Text style={styles.historyCardTitle}>
                              {entry.name || type.namePlaceholder}
                            </Text>
                            <Text style={styles.historyCardType}>{type.label}</Text>
                            <Text style={styles.historyCardDate}>
                              {formatLogDateLabel(entry.dateKey)}
                            </Text>
                          </View>

                          <View style={styles.historyActions}>
                            <Pressable
                              onPress={() => handleEdit(entry)}
                              style={({ pressed }) => [
                                styles.iconAction,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <Ionicons name="create-outline" size={18} color="#4EA955" />
                            </Pressable>

                            <Pressable
                              onPress={() => requestDelete(entry.id)}
                              style={({ pressed }) => [
                                styles.iconAction,
                                pressed && styles.buttonPressed,
                              ]}
                            >
                              <Ionicons name="trash-outline" size={18} color="#4EA955" />
                            </Pressable>
                          </View>
                        </View>

                        {pendingDeleteId === entry.id ? (
                          <View style={styles.confirmDeleteCard}>
                            <Text style={styles.confirmDeleteText}>
                              Delete this log? This cannot be undone.
                            </Text>
                            <View style={styles.confirmDeleteActions}>
                              <Pressable
                                onPress={() => setPendingDeleteId(null)}
                                style={({ pressed }) => [
                                  styles.cancelDeleteButton,
                                  pressed && styles.buttonPressed,
                                ]}
                              >
                                <Text style={styles.cancelDeleteText}>Cancel</Text>
                              </Pressable>
                              <Pressable
                                onPress={() => handleDelete(entry.id)}
                                style={({ pressed }) => [
                                  styles.confirmDeleteButton,
                                  pressed && styles.buttonPressed,
                                ]}
                              >
                                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : null}

                        <View style={styles.metricSummaryGrid}>
                          {type.fields.map((field) => (
                            <View key={field.key} style={styles.metricSummaryItem}>
                              <Text style={styles.metricSummaryLabel}>{field.label}</Text>
                              <Text style={styles.metricSummaryValue}>
                                {formatHistoryValue(field, entry.values[field.key])}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>

            <BottomNav activeTab="log" />
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
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    backgroundColor: "#F4FFF7",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  selectorSection: {
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#F4FFF7",
    padding: 18,
    shadowColor: "rgba(78, 169, 85, 0.14)",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 1,
    shadowRadius: 26,
    elevation: 4,
  },
  sectionHeader: {
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
  selectorButton: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  selectorCopy: {
    flex: 1,
  },
  selectorValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  selectorHint: {
    fontSize: 10,
    lineHeight: 18,
    fontWeight: "700",
    color: "#7A8699",
  },
  menuCard: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    padding: 8,
  },
  menuItem: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemSelected: {
    backgroundColor: "#DCFCE7",
  },
  menuItemText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  menuItemTextSelected: {
    color: "#4EA955",
  },
  editorCard: {
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    padding: 18,
  },
  editorHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },
  editorCopy: {
    flex: 1,
  },
  editorTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  editorMeta: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  editorActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F8EB",
  },
  logInput: {
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CFEFD9",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  computedMetricCard: {
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  computedMetricLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  computedMetricValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  logDateButton: {
    marginBottom: 12,
  },
  saveErrorText: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 11,
    fontWeight: "800",
    color: "#991B1B",
    textAlign: "center",
  },
  confirmDeleteCard: {
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  confirmDeleteText: {
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "800",
    color: "#991B1B",
    textAlign: "center",
  },
  confirmDeleteActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelDeleteButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelDeleteText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#991B1B",
    textTransform: "uppercase",
  },
  confirmDeleteButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
    backgroundColor: "#991B1B",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmDeleteButtonText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  saveButton: {
    minWidth: 112,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  saveButtonDisabled: {
    backgroundColor: "#A8C995",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  saveTextDisabled: {
    color: "#FFFFFF",
  },
  historySection: {
    borderWidth: 1,
    borderColor: "#CFEFD9",
    borderRadius: 28,
    backgroundColor: "#ECFDF3",
    padding: 18,
  },
  historyCount: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  historyDateButton: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  historyDateLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  historyDateValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  historyCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  historyCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  historyCopy: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  historyCardType: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7A8699",
  },
  historyCardDate: {
    fontSize: 10,
    fontWeight: "700",
    color: "#83B66E",
    letterSpacing: 0.6,
    marginTop: 4,
    textTransform: "uppercase",
  },
  historyActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metricSummaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  metricSummaryItem: {
    width: "48%",
    borderRadius: 18,
    backgroundColor: "#F4FFF7",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  metricSummaryLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  metricSummaryValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#111827",
  },
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  weekNavCopy: {
    flex: 1,
    alignItems: "center",
  },
  weekDaySelectorRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  weekDayButton: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFEFD9",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  weekDayButtonWithLogs: {
    backgroundColor: "#F4FFF7",
    borderColor: "#CFEFD9",
  },
  weekDayButtonSelected: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  weekDayLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  weekDayLabelSelected: {
    color: "#DDF4E4",
  },
  weekDayValue: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
  },
  weekDayValueSelected: {
    color: "#FFFFFF",
  },
  weekDayDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#4EA955",
    marginTop: 6,
  },
  weekDayDotSelected: {
    backgroundColor: "#FFFFFF",
  },
  calendarMenu: {
    marginTop: 10,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    padding: 12,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  calendarNavButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#E7F8EB",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarMonthText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#111827",
    textTransform: "uppercase",
  },
  calendarWeekdayRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  calendarWeekdayText: {
    flex: 1,
    fontSize: 9,
    fontWeight: "900",
    color: "#83B66E",
    textAlign: "center",
    textTransform: "uppercase",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 8,
  },
  calendarCellPlaceholder: {
    width: "14.2857%",
    aspectRatio: 1,
  },
  calendarDay: {
    width: "14.2857%",
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    backgroundColor: "#F4FFF7",
  },
  calendarDayWithLogs: {
    backgroundColor: "#ECFDF3",
    borderColor: "#CFEFD9",
  },
  calendarDaySelected: {
    backgroundColor: "#4EA955",
    borderColor: "#4EA955",
  },
  calendarDayText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#111827",
  },
  calendarDayTextSelected: {
    color: "#FFFFFF",
  },
  calendarLogDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#83B66E",
    marginTop: 4,
  },
  calendarHelperText: {
    marginTop: 12,
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
    textAlign: "center",
  },
  healthMetricList: {
    gap: 10,
  },
  healthMetricRow: {
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  healthMetricCopy: {
    flex: 1,
  },
  healthMetricValue: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginTop: 3,
  },
  healthMetricMeta: {
    fontSize: 10,
    lineHeight: 16,
    fontWeight: "700",
    color: "#7A8699",
    marginTop: 4,
  },
  healthMetricDate: {
    fontSize: 10,
    fontWeight: "900",
    color: "#83B66E",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlign: "right",
  },
  emptyState: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DDF4E4",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "700",
    color: "#5E6B7F",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
