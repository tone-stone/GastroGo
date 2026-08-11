import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { SERVICE_FLOW_STEPS, type ServiceFlowStepId } from '@/constants/serviceFlow';
import { colors, radius } from '@/constants/theme';

interface ServiceFlowStepsProps {
  activeStep: ServiceFlowStepId;
  compact?: boolean;
}

export function ServiceFlowSteps({ activeStep, compact }: ServiceFlowStepsProps) {
  const activeIndex = SERVICE_FLOW_STEPS.findIndex((s) => s.id === activeStep);

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {SERVICE_FLOW_STEPS.map((step, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        const isLast = index === SERVICE_FLOW_STEPS.length - 1;

        return (
          <View key={step.id} style={styles.stepWrap}>
            <View style={styles.stepRow}>
              <View
                style={[
                  styles.circle,
                  done && styles.circleDone,
                  active && styles.circleActive,
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#FFF" />
                ) : (
                  <Ionicons
                    name={step.icon as keyof typeof Ionicons.glyphMap}
                    size={14}
                    color={active ? '#FFF' : colors.textMuted}
                  />
                )}
              </View>
              {!compact ? (
                <Text
                  style={[
                    styles.label,
                    done && styles.labelDone,
                    active && styles.labelActive,
                  ]}
                >
                  {step.shortLabel}
                </Text>
              ) : null}
            </View>
            {!isLast ? (
              <View style={[styles.line, done && styles.lineDone]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  compact: { paddingVertical: 0 },
  stepWrap: { flex: 1, alignItems: 'center', position: 'relative' },
  stepRow: { alignItems: 'center', gap: 6, zIndex: 1 },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  circleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  circleActive: { backgroundColor: colors.coffee, borderColor: colors.coffee },
  label: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  labelDone: { color: colors.primary },
  labelActive: { color: colors.coffee, fontWeight: '800' },
  line: {
    position: 'absolute',
    top: 16,
    left: '55%',
    right: '-45%',
    height: 2,
    backgroundColor: colors.borderLight,
    zIndex: 0,
  },
  lineDone: { backgroundColor: colors.primaryLight },
});
