import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import useMobileFrame from "../../hooks/useMobileFrame";
import AppHeader from "./AppHeader";

export default function PlaceholderScreen({
  title,
  text,
  footer = null,
  headerTitle = null,
}) {
  const {
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
  } = useMobileFrame();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                minHeight: Math.max(shellMinHeight, 640),
                paddingHorizontal: innerPaddingHorizontal,
                paddingTop: innerPaddingTop,
                paddingBottom: innerPaddingBottom,
              },
            ]}
          >
            {headerTitle ? <AppHeader title={headerTitle} /> : null}

            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.text}>{text}</Text>
            </View>

            {footer}
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
    borderRadius: 38,
    backgroundColor: "#F7F8FB",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    color: "#5E6B7F",
    textAlign: "center",
  },
});
