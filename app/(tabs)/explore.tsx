import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme'; // Asegúrate de que esta línea coincida con el nombre del archivo

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Text style={[styles.title, { color: Colors[theme].text }]}>
        Explorar
      </Text>
      <Text style={{ color: Colors[theme].text }}>
        Segunda pestaña lista.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
});