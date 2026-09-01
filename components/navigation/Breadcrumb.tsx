import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/constants/legacyTheme';

interface BreadcrumbProps {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View key={`${item.label}-${index}`} style={styles.row}>
            {index > 0 ? (
              <Ionicons name="chevron-forward" size={12} color={colors.textMuted} style={styles.sep} />
            ) : null}
            {item.href && !isLast ? (
              <Pressable onPress={() => router.push(item.href as '/(app)/(tabs)')}>
                <Text style={styles.link}>{item.label}</Text>
              </Pressable>
            ) : (
              <Text style={[styles.text, isLast && styles.active]} numberOfLines={1}>
                {item.label}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  sep: { marginHorizontal: 4 },
  link: { fontSize: 14, fontWeight: '600', color: colors.primary },
  text: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  active: { color: colors.text, fontWeight: '700' },
});
