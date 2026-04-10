import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import useMobileFrame from "../../hooks/useMobileFrame";

export default function FlowShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  centered = false,
}) {
  const {
    isShortHeight,
    shellPaddingHorizontal,
    shellPaddingVertical,
    innerPaddingHorizontal,
    innerPaddingTop,
    innerPaddingBottom,
    shellMinHeight,
    sliderWidth,
    wordmarkSize,
  } = useMobileFrame();
  const flowWidth = sliderWidth - 36;

  return (
    <SafeAreaView style={styles.container}>
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
              minHeight: shellMinHeight,
              paddingHorizontal: innerPaddingHorizontal,
              paddingTop: innerPaddingTop,
              paddingBottom: innerPaddingBottom,
            },
          ]}
        >
          <View style={[styles.headerSection, isShortHeight && styles.compactHeaderSection]}>
            <Text style={[styles.wordmark, { fontSize: wordmarkSize }]}>Jhoom.</Text>
          </View>

          <View style={styles.contentSection}>
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                centered && styles.scrollContentCentered,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.contentStack, { width: flowWidth }]}>
                {eyebrow ? (
                  <Text style={[styles.eyebrow, centered && styles.copyCentered]}>
                    {eyebrow}
                  </Text>
                ) : null}

                <Text style={[styles.title, centered && styles.copyCentered]}>
                  {title}
                </Text>

                {subtitle ? (
                  <Text style={[styles.subtitle, centered && styles.copyCentered]}>
                    {subtitle}
                  </Text>
                ) : null}

                {children}
              </View>
            </ScrollView>
          </View>

          {footer ? <View style={styles.bottomSection}>{footer}</View> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FB",
  },
  outerShell: {
    flex: 1,
  },
  inner: {
    flex: 1,
    borderRadius: 38,
    backgroundColor: "#F7F8FB",
  },
  headerSection: {
    alignItems: "center",
    paddingTop: 42,
    marginBottom: 18,
  },
  compactHeaderSection: {
    paddingTop: 24,
  },
  wordmark: {
    fontWeight: "600",
    color: "#111827",
    letterSpacing: 0.1,
    fontFamily: Platform.select({
      ios: "Georgia",
      android: "serif",
      default: "serif",
    }),
    textShadowColor: "rgba(34, 197, 94, 0.35)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  contentSection: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  scrollContentCentered: {
    justifyContent: "center",
  },
  contentStack: {},
  eyebrow: {
    marginBottom: 12,
    fontSize: 11,
    fontWeight: "600",
    color: "#62716A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#5E6B7F",
    marginBottom: 24,
  },
  copyCentered: {
    textAlign: "center",
  },
  bottomSection: {
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 14,
    width: "100%",
  },
});
