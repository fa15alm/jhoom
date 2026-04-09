import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WorkoutLogScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Workout Log</Text>
        <Text style={styles.text}>
          This is where users will log exercises, sets, reps, and weights.
        </Text>
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
