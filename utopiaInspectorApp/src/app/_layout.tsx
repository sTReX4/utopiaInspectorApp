import { Stack } from 'expo-router';
import { Image, View } from 'react-native';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Home',
          headerTitleAlign: 'left',
          headerBackVisible: false,
          headerRight: () => (
            <View style={{ height: 56, justifyContent: 'center', paddingRight: 10 }}>
              <Image source={require('../../imgfolder/download-removebg-preview.png')} style={{ width: 48, height: 48 }} resizeMode="contain" />
            </View>
          ),
        }}
      />
      <Stack.Screen name="history" options={{ title: 'History' }} />
      <Stack.Screen name="audit" options={{ title: 'Digital Audit' }} />
    </Stack>
  );
}
