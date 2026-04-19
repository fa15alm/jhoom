import { SafeAreaView, StyleSheet, Text, View } from "react-native";

//import hooks + logs API
import { useEffect, useState } from "react";
import { getLogs } from "../../src/services/api/logsApi";
import { getAuthToken } from "../../src/services/authSession";

export default function WorkoutLogScreen() {
  //state to store logs
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  //load logs when screen opens
  useEffect(() => {
    loadLogs();
  }, []);

  //fetch logs from backend
  async function loadLogs() {
    try {
      const token = getAuthToken();
      const data = token ? await getLogs(token, { type: "workout" }) : [];
      setLogs(data);
      setError(token ? "" : "Log in to view workout logs.");
    } catch (err) {
      console.log("Error loading logs:", err);
      setError(err.message || "Could not load workout logs.");
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Workout Log</Text>
        <Text style={styles.text}>
          This is where users will log exercises, sets, reps, and weights.
        </Text>
    {/* show message if no logs */}
        {logs.length === 0 && (
          <Text style={{ marginTop: 10 }}>{error || "No logs yet"}</Text>
        )}

        {/* render logs */}
        {logs.length > 0 && logs.map((log) => (
          <View key={log.id} style={{ marginTop: 10 }}>
            <Text>{log.name}</Text>
            <Text>{log.typeKey}</Text>
            <Text>{log.dateKey}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  text: { fontSize: 16, color: "#475569", textAlign: "center" },
});
