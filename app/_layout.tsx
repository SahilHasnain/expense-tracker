import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        header: () => null,
        contentStyle: { marginTop: 0 },
      }}
    />
  );
}
